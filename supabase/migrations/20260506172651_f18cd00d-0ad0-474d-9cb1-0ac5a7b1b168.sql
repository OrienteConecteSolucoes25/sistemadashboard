
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.crea_admin_config (
  key text PRIMARY KEY, value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid
);
ALTER TABLE public.crea_admin_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY crea_admin_config_admin ON public.crea_admin_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.crea_module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, company_id uuid NOT NULL,
  can_view boolean NOT NULL DEFAULT true, can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false, can_delete boolean NOT NULL DEFAULT false,
  can_import boolean NOT NULL DEFAULT false, can_export boolean NOT NULL DEFAULT false,
  can_view_sensitive boolean NOT NULL DEFAULT false,
  can_view_credentials boolean NOT NULL DEFAULT false, can_manage_credentials boolean NOT NULL DEFAULT false,
  can_manage_norms boolean NOT NULL DEFAULT false, can_approve_publication boolean NOT NULL DEFAULT false,
  can_manage_ai_sources boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);
ALTER TABLE public.crea_module_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY crea_perm_admin ON public.crea_module_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.is_company_admin(auth.uid(), company_id));
CREATE POLICY crea_perm_self_read ON public.crea_module_permissions FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.crea_can(_uid uuid, _company uuid, _action text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE perm record;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  IF public.has_role(_uid,'admin'::app_role) THEN RETURN true; END IF;
  IF public.has_role(_uid,'crea_admin'::app_role) THEN
    IF _company IS NULL OR public.user_company(_uid) = _company THEN RETURN true; END IF;
  END IF;
  IF _company IS NOT NULL AND public.is_company_admin(_uid, _company) THEN RETURN true; END IF;
  IF public.has_role(_uid,'crea_auditor'::app_role) AND _action IN ('view','view_sensitive') THEN
    IF _company IS NULL OR public.user_company(_uid) = _company THEN RETURN true; END IF;
  END IF;
  IF _company IS NULL THEN RETURN false; END IF;
  SELECT * INTO perm FROM public.crea_module_permissions WHERE user_id=_uid AND company_id=_company LIMIT 1;
  IF perm.id IS NULL THEN RETURN false; END IF;
  RETURN CASE _action
    WHEN 'view' THEN perm.can_view WHEN 'create' THEN perm.can_create
    WHEN 'edit' THEN perm.can_edit WHEN 'delete' THEN perm.can_delete
    WHEN 'import' THEN perm.can_import WHEN 'export' THEN perm.can_export
    WHEN 'view_sensitive' THEN perm.can_view_sensitive
    WHEN 'view_credentials' THEN perm.can_view_credentials
    WHEN 'manage_credentials' THEN perm.can_manage_credentials
    WHEN 'manage_norms' THEN perm.can_manage_norms
    WHEN 'approve_publication' THEN perm.can_approve_publication
    WHEN 'manage_ai_sources' THEN perm.can_manage_ai_sources
    ELSE false END;
END $$;

CREATE TABLE IF NOT EXISTS public.crea_audit_logs (
  id bigserial PRIMARY KEY, company_id uuid, user_id uuid,
  action text NOT NULL, modulo text NOT NULL,
  entidade_tipo text, entidade_id text, nome_entidade text,
  payload jsonb, observacoes text, ip_origem text, user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crea_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY crea_audit_read ON public.crea_audit_logs FOR SELECT TO authenticated USING (public.crea_can(auth.uid(), company_id, 'view'));
CREATE POLICY crea_audit_insert_self ON public.crea_audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.crea_log_audit(
  _company uuid, _action text, _modulo text,
  _entidade_tipo text DEFAULT NULL, _entidade_id text DEFAULT NULL, _nome_entidade text DEFAULT NULL,
  _payload jsonb DEFAULT NULL, _observacoes text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.crea_audit_logs(company_id,user_id,action,modulo,entidade_tipo,entidade_id,nome_entidade,payload,observacoes)
  VALUES (_company, auth.uid(), _action, _modulo, _entidade_tipo, _entidade_id, _nome_entidade, _payload, _observacoes);
END $$;

-- Globais
CREATE TABLE IF NOT EXISTS public.crea_links_oficiais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), uf text NOT NULL UNIQUE,
  portal_principal text, portal_servicos text, login_profissional text, login_empresa text,
  consulta_art text, consulta_cat text, certidoes text, protocolo text, atendimento text, normas text,
  observacoes text, data jsonb DEFAULT '{}'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crea_links_oficiais ENABLE ROW LEVEL SECURITY;
CREATE POLICY crea_links_read ON public.crea_links_oficiais FOR SELECT TO authenticated USING (true);
CREATE POLICY crea_links_admin ON public.crea_links_oficiais FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'crea_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'crea_admin'::app_role));
CREATE TRIGGER crea_links_upd BEFORE UPDATE ON public.crea_links_oficiais FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE TABLE IF NOT EXISTS public.crea_norms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL, numero text, ano int, orgao text, uf text, tema text, resumo text,
  link text, arquivo_url text, status text DEFAULT 'vigente', data_vigencia date, tags text[],
  data jsonb DEFAULT '{}'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crea_norms ENABLE ROW LEVEL SECURITY;
CREATE POLICY crea_norms_read ON public.crea_norms FOR SELECT TO authenticated USING (true);
CREATE POLICY crea_norms_manage ON public.crea_norms FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'crea_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'crea_admin'::app_role));
CREATE TRIGGER crea_norms_upd BEFORE UPDATE ON public.crea_norms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE TABLE IF NOT EXISTS public.crea_module_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE, enabled boolean NOT NULL DEFAULT true,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crea_module_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY crea_settings_read ON public.crea_module_settings FOR SELECT TO authenticated USING (public.crea_can(auth.uid(), company_id, 'view'));
CREATE POLICY crea_settings_manage ON public.crea_module_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.is_company_admin(auth.uid(), company_id));

CREATE TABLE IF NOT EXISTS public.crea_companies_crea (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL,
  empresa text NOT NULL, cnpj text, uf text NOT NULL,
  registro text, visto text, rt_principal_id uuid,
  status text DEFAULT 'ativo', validade date, link_portal text, observacoes text,
  data jsonb DEFAULT '{}'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crea_companies_crea ENABLE ROW LEVEL SECURITY;
CREATE POLICY crea_companies_view ON public.crea_companies_crea FOR SELECT TO authenticated USING (public.crea_can(auth.uid(), company_id, 'view'));
CREATE POLICY crea_companies_write ON public.crea_companies_crea FOR ALL TO authenticated USING (public.crea_can(auth.uid(), company_id, 'edit')) WITH CHECK (public.crea_can(auth.uid(), company_id, 'edit'));
CREATE TRIGGER crea_companies_upd BEFORE UPDATE ON public.crea_companies_crea FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();
CREATE INDEX IF NOT EXISTS idx_crea_companies_company ON public.crea_companies_crea(company_id);

CREATE TABLE IF NOT EXISTS public.crea_engineers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL,
  nome text NOT NULL, cpf_mask text, crea text, uf text, modalidade text, titulo text,
  email text, telefone text, status text DEFAULT 'ativo',
  data jsonb DEFAULT '{}'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crea_engineers ENABLE ROW LEVEL SECURITY;
CREATE POLICY crea_eng_view ON public.crea_engineers FOR SELECT TO authenticated USING (public.crea_can(auth.uid(), company_id, 'view'));
CREATE POLICY crea_eng_write ON public.crea_engineers FOR ALL TO authenticated USING (public.crea_can(auth.uid(), company_id, 'edit')) WITH CHECK (public.crea_can(auth.uid(), company_id, 'edit'));
CREATE TRIGGER crea_eng_upd BEFORE UPDATE ON public.crea_engineers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE TABLE IF NOT EXISTS public.crea_responsible_technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL,
  engineer_id uuid REFERENCES public.crea_engineers(id) ON DELETE SET NULL,
  empresa_vinculada text, setor text, inicio_vinculo date, fim_vinculo date,
  status text DEFAULT 'ativo', observacoes text,
  data jsonb DEFAULT '{}'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crea_responsible_technicians ENABLE ROW LEVEL SECURITY;
CREATE POLICY crea_rt_view ON public.crea_responsible_technicians FOR SELECT TO authenticated USING (public.crea_can(auth.uid(), company_id, 'view'));
CREATE POLICY crea_rt_write ON public.crea_responsible_technicians FOR ALL TO authenticated USING (public.crea_can(auth.uid(), company_id, 'edit')) WITH CHECK (public.crea_can(auth.uid(), company_id, 'edit'));
CREATE TRIGGER crea_rt_upd BEFORE UPDATE ON public.crea_responsible_technicians FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE TABLE IF NOT EXISTS public.crea_arts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL,
  numero text NOT NULL, uf text,
  empresa_id uuid REFERENCES public.crea_companies_crea(id) ON DELETE SET NULL,
  contratante text, contratado text,
  rt_id uuid REFERENCES public.crea_responsible_technicians(id) ON DELETE SET NULL,
  engineer_id uuid REFERENCES public.crea_engineers(id) ON DELETE SET NULL,
  escopo text, setor text, site_ref text,
  data_emissao date, data_pagamento date, data_baixa date,
  status text DEFAULT 'rascunho', valor numeric(14,2),
  link text, anexo_url text, observacoes text,
  data jsonb DEFAULT '{}'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crea_arts ENABLE ROW LEVEL SECURITY;
CREATE POLICY crea_arts_view ON public.crea_arts FOR SELECT TO authenticated USING (public.crea_can(auth.uid(), company_id, 'view'));
CREATE POLICY crea_arts_write ON public.crea_arts FOR ALL TO authenticated USING (public.crea_can(auth.uid(), company_id, 'edit')) WITH CHECK (public.crea_can(auth.uid(), company_id, 'edit'));
CREATE TRIGGER crea_arts_upd BEFORE UPDATE ON public.crea_arts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();
CREATE INDEX IF NOT EXISTS idx_crea_arts_company ON public.crea_arts(company_id);
CREATE INDEX IF NOT EXISTS idx_crea_arts_status ON public.crea_arts(status);

CREATE TABLE IF NOT EXISTS public.crea_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL,
  numero text, uf text,
  empresa_id uuid REFERENCES public.crea_companies_crea(id) ON DELETE SET NULL,
  rt_id uuid REFERENCES public.crea_responsible_technicians(id) ON DELETE SET NULL,
  tipo text NOT NULL, data_abertura date DEFAULT current_date, prazo_esperado date,
  status text DEFAULT 'aberto', exigencia text, link text, login_relacionado text,
  tratativa text, responsavel_interno uuid,
  data jsonb DEFAULT '{}'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crea_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY crea_prot_view ON public.crea_protocols FOR SELECT TO authenticated USING (public.crea_can(auth.uid(), company_id, 'view'));
CREATE POLICY crea_prot_write ON public.crea_protocols FOR ALL TO authenticated USING (public.crea_can(auth.uid(), company_id, 'edit')) WITH CHECK (public.crea_can(auth.uid(), company_id, 'edit'));
CREATE TRIGGER crea_prot_upd BEFORE UPDATE ON public.crea_protocols FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE TABLE IF NOT EXISTS public.crea_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL,
  tipo text NOT NULL, uf text,
  empresa_id uuid REFERENCES public.crea_companies_crea(id) ON DELETE SET NULL,
  rt_id uuid REFERENCES public.crea_responsible_technicians(id) ON DELETE SET NULL,
  numero text, data_emissao date, validade date, status text DEFAULT 'valida',
  link text, anexo_url text, observacoes text,
  data jsonb DEFAULT '{}'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crea_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY crea_cert_view ON public.crea_certificates FOR SELECT TO authenticated USING (public.crea_can(auth.uid(), company_id, 'view'));
CREATE POLICY crea_cert_write ON public.crea_certificates FOR ALL TO authenticated USING (public.crea_can(auth.uid(), company_id, 'edit')) WITH CHECK (public.crea_can(auth.uid(), company_id, 'edit'));
CREATE TRIGGER crea_cert_upd BEFORE UPDATE ON public.crea_certificates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE TABLE IF NOT EXISTS public.crea_cats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL,
  numero text,
  rt_id uuid REFERENCES public.crea_responsible_technicians(id) ON DELETE SET NULL,
  uf text,
  empresa_id uuid REFERENCES public.crea_companies_crea(id) ON DELETE SET NULL,
  art_id uuid REFERENCES public.crea_arts(id) ON DELETE SET NULL,
  tipo text, status text DEFAULT 'solicitada',
  data_solicitacao date, data_emissao date, atestado text, link text, observacoes text,
  data jsonb DEFAULT '{}'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crea_cats ENABLE ROW LEVEL SECURITY;
CREATE POLICY crea_cats_view ON public.crea_cats FOR SELECT TO authenticated USING (public.crea_can(auth.uid(), company_id, 'view'));
CREATE POLICY crea_cats_write ON public.crea_cats FOR ALL TO authenticated USING (public.crea_can(auth.uid(), company_id, 'edit')) WITH CHECK (public.crea_can(auth.uid(), company_id, 'edit'));
CREATE TRIGGER crea_cats_upd BEFORE UPDATE ON public.crea_cats FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE TABLE IF NOT EXISTS public.crea_deregistrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL,
  tipo text NOT NULL,
  art_id uuid REFERENCES public.crea_arts(id) ON DELETE SET NULL,
  rt_id uuid REFERENCES public.crea_responsible_technicians(id) ON DELETE SET NULL,
  uf text,
  empresa_id uuid REFERENCES public.crea_companies_crea(id) ON DELETE SET NULL,
  data_solicitada date, data_concluida date,
  protocolo_id uuid REFERENCES public.crea_protocols(id) ON DELETE SET NULL,
  status text DEFAULT 'pendente', observacoes text,
  data jsonb DEFAULT '{}'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crea_deregistrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY crea_dereg_view ON public.crea_deregistrations FOR SELECT TO authenticated USING (public.crea_can(auth.uid(), company_id, 'view'));
CREATE POLICY crea_dereg_write ON public.crea_deregistrations FOR ALL TO authenticated USING (public.crea_can(auth.uid(), company_id, 'edit')) WITH CHECK (public.crea_can(auth.uid(), company_id, 'edit'));
CREATE TRIGGER crea_dereg_upd BEFORE UPDATE ON public.crea_deregistrations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE TABLE IF NOT EXISTS public.crea_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL,
  nome text NOT NULL, tipo text, obrigatorio boolean DEFAULT false, uf text, escopo text,
  modelo_url text, validade date, status text DEFAULT 'ativo',
  anexo_url text, responsavel uuid, observacoes text,
  data jsonb DEFAULT '{}'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crea_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY crea_docs_view ON public.crea_documents FOR SELECT TO authenticated USING (public.crea_can(auth.uid(), company_id, 'view'));
CREATE POLICY crea_docs_write ON public.crea_documents FOR ALL TO authenticated USING (public.crea_can(auth.uid(), company_id, 'edit')) WITH CHECK (public.crea_can(auth.uid(), company_id, 'edit'));
CREATE TRIGGER crea_docs_upd BEFORE UPDATE ON public.crea_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE TABLE IF NOT EXISTS public.crea_treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL,
  tipo text,
  protocol_id uuid REFERENCES public.crea_protocols(id) ON DELETE SET NULL,
  art_id uuid REFERENCES public.crea_arts(id) ON DELETE SET NULL,
  cat_id uuid REFERENCES public.crea_cats(id) ON DELETE SET NULL,
  certificate_id uuid REFERENCES public.crea_certificates(id) ON DELETE SET NULL,
  responsavel uuid, data_evento date DEFAULT current_date, canal text,
  descricao text, proximo_passo text, prazo date,
  data jsonb DEFAULT '{}'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crea_treatments ENABLE ROW LEVEL SECURITY;
CREATE POLICY crea_trat_view ON public.crea_treatments FOR SELECT TO authenticated USING (public.crea_can(auth.uid(), company_id, 'view'));
CREATE POLICY crea_trat_write ON public.crea_treatments FOR ALL TO authenticated USING (public.crea_can(auth.uid(), company_id, 'edit')) WITH CHECK (public.crea_can(auth.uid(), company_id, 'edit'));
CREATE TRIGGER crea_trat_upd BEFORE UPDATE ON public.crea_treatments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE TABLE IF NOT EXISTS public.crea_deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL,
  tipo text NOT NULL, ref_table text, ref_id uuid,
  prazo date NOT NULL, status text DEFAULT 'aberto', observacoes text,
  data jsonb DEFAULT '{}'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crea_deadlines ENABLE ROW LEVEL SECURITY;
CREATE POLICY crea_dl_view ON public.crea_deadlines FOR SELECT TO authenticated USING (public.crea_can(auth.uid(), company_id, 'view'));
CREATE POLICY crea_dl_write ON public.crea_deadlines FOR ALL TO authenticated USING (public.crea_can(auth.uid(), company_id, 'edit')) WITH CHECK (public.crea_can(auth.uid(), company_id, 'edit'));
CREATE TRIGGER crea_dl_upd BEFORE UPDATE ON public.crea_deadlines FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE TABLE IF NOT EXISTS public.crea_ai_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  titulo text NOT NULL, tipo text, conteudo text, link text, uf text, tags text[],
  ativo boolean NOT NULL DEFAULT true,
  data jsonb DEFAULT '{}'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crea_ai_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY crea_ai_sources_view ON public.crea_ai_sources FOR SELECT TO authenticated
  USING (company_id IS NULL OR public.crea_can(auth.uid(), company_id, 'view'));
CREATE POLICY crea_ai_sources_manage ON public.crea_ai_sources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'crea_admin'::app_role)
         OR (company_id IS NOT NULL AND public.crea_can(auth.uid(), company_id, 'manage_ai_sources')))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'crea_admin'::app_role)
              OR (company_id IS NOT NULL AND public.crea_can(auth.uid(), company_id, 'manage_ai_sources')));
CREATE TRIGGER crea_ai_sources_upd BEFORE UPDATE ON public.crea_ai_sources FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE TABLE IF NOT EXISTS public.crea_ai_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid, user_id uuid,
  pergunta text NOT NULL, resposta text, fontes jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crea_ai_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY crea_ai_q_read ON public.crea_ai_questions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.crea_can(auth.uid(), company_id, 'view'));
CREATE POLICY crea_ai_q_insert ON public.crea_ai_questions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.crea_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL,
  uf text NOT NULL,
  empresa_crea_id uuid REFERENCES public.crea_companies_crea(id) ON DELETE SET NULL,
  rt_id uuid REFERENCES public.crea_responsible_technicians(id) ON DELETE SET NULL,
  portal_url text, login text, senha_enc bytea,
  status text DEFAULT 'ativo', observacoes text,
  created_by uuid, updated_by uuid,
  data jsonb DEFAULT '{}'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crea_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY crea_cred_view ON public.crea_credentials FOR SELECT TO authenticated USING (public.crea_can(auth.uid(), company_id, 'view_credentials'));
CREATE POLICY crea_cred_manage ON public.crea_credentials FOR ALL TO authenticated
  USING (public.crea_can(auth.uid(), company_id, 'manage_credentials'))
  WITH CHECK (public.crea_can(auth.uid(), company_id, 'manage_credentials'));
CREATE TRIGGER crea_cred_upd BEFORE UPDATE ON public.crea_credentials FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE OR REPLACE FUNCTION public.crea_set_master_key(_pwd text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin'::app_role) THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  IF _pwd IS NULL OR length(_pwd) < 12 THEN RETURN jsonb_build_object('ok',false,'error','key_too_short'); END IF;
  INSERT INTO public.crea_admin_config(key,value,updated_at,updated_by)
    VALUES('credentials_master_key', _pwd, now(), auth.uid())
    ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value, updated_at=now(), updated_by=auth.uid();
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION public.crea_save_credential(
  _id uuid, _company uuid, _uf text, _empresa_crea uuid, _rt uuid,
  _portal text, _login text, _senha text, _status text, _obs text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE mk text; new_id uuid; enc bytea;
BEGIN
  IF NOT public.crea_can(auth.uid(), _company, 'manage_credentials') THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  SELECT value INTO mk FROM public.crea_admin_config WHERE key='credentials_master_key';
  IF mk IS NULL THEN RETURN jsonb_build_object('ok',false,'error','master_key_missing'); END IF;
  IF _senha IS NOT NULL AND length(_senha) > 0 THEN enc := pgp_sym_encrypt(_senha, mk); END IF;
  IF _id IS NULL THEN
    INSERT INTO public.crea_credentials(company_id, uf, empresa_crea_id, rt_id, portal_url, login, senha_enc, status, observacoes, created_by, updated_by)
    VALUES (_company, _uf, _empresa_crea, _rt, _portal, _login, enc, COALESCE(_status,'ativo'), _obs, auth.uid(), auth.uid())
    RETURNING id INTO new_id;
    PERFORM public.crea_log_audit(_company,'credential_create','crea.credenciais','crea_credentials', new_id::text, _login, jsonb_build_object('uf',_uf), NULL);
    RETURN jsonb_build_object('ok',true,'id',new_id);
  ELSE
    UPDATE public.crea_credentials
       SET uf=_uf, empresa_crea_id=_empresa_crea, rt_id=_rt, portal_url=_portal, login=_login,
           senha_enc=COALESCE(enc, senha_enc), status=COALESCE(_status,status), observacoes=_obs,
           updated_by=auth.uid(), updated_at=now()
     WHERE id=_id;
    PERFORM public.crea_log_audit(_company,'credential_update','crea.credenciais','crea_credentials', _id::text, _login, jsonb_build_object('uf',_uf), NULL);
    RETURN jsonb_build_object('ok',true,'id',_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.crea_reveal_credential(_id uuid, _reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE rec record; mk text; pw text;
BEGIN
  SELECT * INTO rec FROM public.crea_credentials WHERE id=_id;
  IF rec.id IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_found'); END IF;
  IF NOT public.crea_can(auth.uid(), rec.company_id, 'view_credentials') THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  IF _reason IS NULL OR length(btrim(_reason)) < 3 THEN RETURN jsonb_build_object('ok',false,'error','reason_required'); END IF;
  SELECT value INTO mk FROM public.crea_admin_config WHERE key='credentials_master_key';
  IF mk IS NULL OR rec.senha_enc IS NULL THEN RETURN jsonb_build_object('ok',false,'error','no_password'); END IF;
  pw := pgp_sym_decrypt(rec.senha_enc, mk);
  PERFORM public.crea_log_audit(rec.company_id,'credential_reveal','crea.credenciais','crea_credentials', _id::text, rec.login, jsonb_build_object('uf',rec.uf), _reason);
  RETURN jsonb_build_object('ok',true,'login',rec.login,'senha',pw);
END $$;

CREATE OR REPLACE FUNCTION public.crea_soft_delete(_table text, _id uuid, _reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE allowed text[] := ARRAY[
  'crea_companies_crea','crea_engineers','crea_responsible_technicians','crea_arts','crea_protocols',
  'crea_certificates','crea_cats','crea_deregistrations','crea_documents','crea_treatments',
  'crea_deadlines','crea_credentials','crea_ai_sources','crea_norms','crea_links_oficiais'
];
  before_row jsonb; cid uuid;
BEGIN
  IF NOT (_table = ANY(allowed)) THEN RETURN jsonb_build_object('ok',false,'error','invalid_table'); END IF;
  IF _reason IS NULL OR length(btrim(_reason))<3 THEN RETURN jsonb_build_object('ok',false,'error','reason_required'); END IF;
  EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id=$1',_table) INTO before_row USING _id;
  IF before_row IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_found'); END IF;
  cid := NULLIF(before_row->>'company_id','')::uuid;
  IF cid IS NOT NULL AND NOT public.crea_can(auth.uid(), cid,'delete') THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  IF cid IS NULL AND NOT (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'crea_admin'::app_role)) THEN
    RETURN jsonb_build_object('ok',false,'error','forbidden');
  END IF;
  EXECUTE format('UPDATE public.%I SET is_deleted=true, deleted_at=now(), deleted_by=$1, delete_reason=$2 WHERE id=$3',_table)
    USING auth.uid(), _reason, _id;
  PERFORM public.crea_log_audit(cid,'soft_delete',_table,_table,_id::text, COALESCE(before_row->>'numero', before_row->>'nome', before_row->>'titulo', _id::text), before_row, _reason);
  RETURN jsonb_build_object('ok',true);
END $$;

INSERT INTO public.plan_modules_catalog(key,label,grupo,sempre_obrigatorio,ativo) VALUES
  ('crea.base','CREA & ART — Base','CREA & ART', false, true),
  ('crea.dashboard','Dashboard CREA','CREA & ART', false, true),
  ('crea.arts','ARTs','CREA & ART', false, true),
  ('crea.protocolos','Protocolos','CREA & ART', false, true),
  ('crea.rts','Responsáveis Técnicos','CREA & ART', false, true),
  ('crea.empresas','Empresas e CREAs','CREA & ART', false, true),
  ('crea.credenciais','Credenciais','CREA & ART', false, true),
  ('crea.certidoes','Certidões','CREA & ART', false, true),
  ('crea.cats','CATs / Acervo','CREA & ART', false, true),
  ('crea.baixas','Baixas','CREA & ART', false, true),
  ('crea.documentos','Documentações','CREA & ART', false, true),
  ('crea.tratativas','Tratativas','CREA & ART', false, true),
  ('crea.normas','Normas e Regras','CREA & ART', false, true),
  ('crea.prazos','Prazos','CREA & ART', false, true),
  ('crea.assistente','Assistente IA CREA','CREA & ART', false, true),
  ('crea.links','Links Oficiais','CREA & ART', false, true),
  ('crea.auditoria','Auditoria CREA','CREA & ART', false, true)
ON CONFLICT (key) DO NOTHING;
