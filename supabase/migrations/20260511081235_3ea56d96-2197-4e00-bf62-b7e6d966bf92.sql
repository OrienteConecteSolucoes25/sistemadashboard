CREATE TABLE IF NOT EXISTS public.crea_empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  nome_fantasia text NOT NULL,
  razao_social text,
  endereco_completo text,
  cidade text,
  uf text,
  cep text,
  cnpj text,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid,
  delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crea_empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY crea_empresas_view ON public.crea_empresas
  FOR SELECT TO authenticated
  USING (public.crea_can(auth.uid(), company_id, 'view'));

CREATE POLICY crea_empresas_write ON public.crea_empresas
  FOR ALL TO authenticated
  USING (public.crea_can(auth.uid(), company_id, 'edit'))
  WITH CHECK (public.crea_can(auth.uid(), company_id, 'edit'));

CREATE TRIGGER crea_empresas_upd BEFORE UPDATE ON public.crea_empresas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE INDEX IF NOT EXISTS idx_crea_empresas_company ON public.crea_empresas(company_id);

-- Atualiza RPC de soft-delete para incluir a nova tabela
CREATE OR REPLACE FUNCTION public.crea_soft_delete(_table text, _id uuid, _reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _allowed text[] := ARRAY[
    'crea_companies_crea','crea_engineers','crea_responsible_technicians','crea_arts','crea_protocols',
    'crea_cats','crea_certificates','crea_deregistrations','crea_treatments','crea_deadlines',
    'crea_documents','crea_norms','crea_links_oficiais','crea_gov_tags','crea_gov_setores',
    'crea_gov_focos','crea_gov_cnaes','crea_gov_engs_perfil','crea_gov_eventos','crea_art_obras',
    'crea_rts_pessoas','crea_empresas'
  ];
  _company_id uuid;
  _uid uuid := auth.uid();
BEGIN
  IF NOT (_table = ANY(_allowed)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'tabela_nao_permitida');
  END IF;
  IF _reason IS NULL OR length(trim(_reason)) < 3 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'motivo_obrigatorio');
  END IF;
  EXECUTE format('SELECT company_id FROM public.%I WHERE id = $1', _table) INTO _company_id USING _id;
  IF _company_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'registro_nao_encontrado');
  END IF;
  IF NOT public.crea_can(_uid, _company_id, 'delete') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'sem_permissao');
  END IF;
  EXECUTE format(
    'UPDATE public.%I SET is_deleted = true, deleted_at = now(), deleted_by = $1, delete_reason = $2 WHERE id = $3',
    _table
  ) USING _uid, _reason, _id;
  INSERT INTO public.crea_audit_log (company_id, user_id, action, table_name, record_id, payload)
  VALUES (_company_id, _uid, 'soft_delete', _table, _id, jsonb_build_object('reason', _reason));
  RETURN jsonb_build_object('ok', true);
END;
$$;