
-- Habilitar pgcrypto para hash da senha
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Adicionar campos de soft delete nas tabelas P1 da Engenharia
ALTER TABLE public.eng_sites        ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
                                    ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
                                    ADD COLUMN IF NOT EXISTS deleted_by uuid,
                                    ADD COLUMN IF NOT EXISTS delete_reason text;
ALTER TABLE public.eng_atividades   ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
                                    ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
                                    ADD COLUMN IF NOT EXISTS deleted_by uuid,
                                    ADD COLUMN IF NOT EXISTS delete_reason text;
ALTER TABLE public.eng_pendencias   ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
                                    ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
                                    ADD COLUMN IF NOT EXISTS deleted_by uuid,
                                    ADD COLUMN IF NOT EXISTS delete_reason text;
ALTER TABLE public.eng_suprimentos  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
                                    ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
                                    ADD COLUMN IF NOT EXISTS deleted_by uuid,
                                    ADD COLUMN IF NOT EXISTS delete_reason text;
ALTER TABLE public.eng_materiais    ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
                                    ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
                                    ADD COLUMN IF NOT EXISTS deleted_by uuid,
                                    ADD COLUMN IF NOT EXISTS delete_reason text;
ALTER TABLE public.eng_rfi          ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
                                    ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
                                    ADD COLUMN IF NOT EXISTS deleted_by uuid,
                                    ADD COLUMN IF NOT EXISTS delete_reason text;

-- Indexes para filtragem rápida
CREATE INDEX IF NOT EXISTS idx_eng_sites_active       ON public.eng_sites (is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_eng_atividades_active  ON public.eng_atividades (is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_eng_pendencias_active  ON public.eng_pendencias (is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_eng_suprimentos_active ON public.eng_suprimentos (is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_eng_materiais_active   ON public.eng_materiais (is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_eng_rfi_active         ON public.eng_rfi (is_deleted) WHERE is_deleted = false;

-- 2) Tabela de configuração administrativa para guardar hash da senha de exclusão
CREATE TABLE IF NOT EXISTS public.eng_admin_config (
  key         text PRIMARY KEY,
  value       text,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid
);
ALTER TABLE public.eng_admin_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin manage eng_admin_config" ON public.eng_admin_config;
CREATE POLICY "admin manage eng_admin_config" ON public.eng_admin_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

-- Inserir hash da senha padrão (852741963) — bcrypt via pgcrypto
INSERT INTO public.eng_admin_config (key, value)
VALUES ('delete_password_hash', crypt('852741963', gen_salt('bf', 10)))
ON CONFLICT (key) DO NOTHING;

-- 3) RPC server-side: valida permissão + senha + motivo; faz soft delete e audita
CREATE OR REPLACE FUNCTION public.eng_soft_delete(
  _table   text,
  _id      uuid,
  _password text,
  _reason  text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed_tables text[] := ARRAY['eng_sites','eng_atividades','eng_pendencias','eng_suprimentos','eng_materiais','eng_rfi'];
  stored_hash text;
  before_row jsonb;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  IF NOT (_table = ANY(allowed_tables)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_table');
  END IF;

  IF NOT public.eng_can_edit(uid) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  IF _reason IS NULL OR length(btrim(_reason)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'reason_required');
  END IF;

  SELECT value INTO stored_hash FROM public.eng_admin_config WHERE key = 'delete_password_hash';
  IF stored_hash IS NULL OR crypt(COALESCE(_password,''), stored_hash) <> stored_hash THEN
    PERFORM public.eng_log_audit(
      'soft_delete_failed', _table, _table, _id::text, NULL, NULL, NULL, NULL, NULL,
      'Tentativa de exclusão com senha inválida'
    );
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_password');
  END IF;

  -- snapshot antes
  EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id = $1', _table)
    INTO before_row USING _id;

  IF before_row IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF COALESCE((before_row->>'is_deleted')::boolean, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_deleted');
  END IF;

  -- aplica soft delete
  EXECUTE format(
    'UPDATE public.%I SET is_deleted = true, deleted_at = now(), deleted_by = $1, delete_reason = $2 WHERE id = $3',
    _table
  ) USING uid, _reason, _id;

  PERFORM public.eng_log_audit(
    'soft_delete', _table, _table, _id::text,
    COALESCE(before_row->>'titulo', before_row->>'nome', before_row->>'numero', before_row->>'descricao', _id::text),
    before_row, NULL, NULL, NULL, _reason
  );

  RETURN jsonb_build_object('ok', true);
END $$;

REVOKE ALL ON FUNCTION public.eng_soft_delete(text, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.eng_soft_delete(text, uuid, text, text) TO authenticated;

-- 4) RPC para admin trocar a senha de exclusão (sem expor o hash)
CREATE OR REPLACE FUNCTION public.eng_set_delete_password(_new_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;
  IF _new_password IS NULL OR length(_new_password) < 6 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'password_too_short');
  END IF;
  INSERT INTO public.eng_admin_config (key, value, updated_at, updated_by)
  VALUES ('delete_password_hash', crypt(_new_password, gen_salt('bf', 10)), now(), auth.uid())
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = now(), updated_by = auth.uid();
  RETURN jsonb_build_object('ok', true);
END $$;

REVOKE ALL ON FUNCTION public.eng_set_delete_password(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.eng_set_delete_password(text) TO authenticated;
