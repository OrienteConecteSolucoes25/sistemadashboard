ALTER TABLE public.eng_equipes
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS delete_reason text;

CREATE OR REPLACE FUNCTION public.eng_soft_delete(_table text, _id uuid, _password text, _reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  allowed_tables text[] := ARRAY['eng_sites','eng_atividades','eng_pendencias','eng_suprimentos','eng_materiais','eng_rfi','eng_equipes'];
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

  EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id = $1', _table)
    INTO before_row USING _id;

  IF before_row IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF COALESCE((before_row->>'is_deleted')::boolean, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_deleted');
  END IF;

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
END $function$;