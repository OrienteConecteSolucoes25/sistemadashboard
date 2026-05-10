
-- LEVA 1 — ACL CENTRAL
CREATE TABLE IF NOT EXISTS public.acl_permissions_catalog (
  key text PRIMARY KEY,
  module text NOT NULL,
  resource text NOT NULL,
  action text NOT NULL,
  label text NOT NULL,
  description text,
  ativo boolean NOT NULL DEFAULT true,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.acl_internal_staff (
  user_id uuid PRIMARY KEY,
  added_by uuid,
  added_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

CREATE TABLE IF NOT EXISTS public.acl_user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NULL,
  permission_key text NOT NULL REFERENCES public.acl_permissions_catalog(key) ON UPDATE CASCADE,
  granted_by uuid,
  granted_at timestamptz NOT NULL DEFAULT now(),
  reason text
);
-- Unicidade: um par (user, key) por empresa, e um global (company NULL)
CREATE UNIQUE INDEX IF NOT EXISTS uq_aclup_company ON public.acl_user_permissions (user_id, company_id, permission_key) WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_aclup_global  ON public.acl_user_permissions (user_id, permission_key) WHERE company_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_aclup_user ON public.acl_user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_aclup_company ON public.acl_user_permissions(company_id);
CREATE INDEX IF NOT EXISTS idx_aclup_key ON public.acl_user_permissions(permission_key);

CREATE TABLE IF NOT EXISTS public.acl_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  target_user_id uuid,
  company_id uuid,
  permission_key text,
  action text NOT NULL,
  reason text,
  before jsonb,
  after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_acl_audit_actor ON public.acl_audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_acl_audit_target ON public.acl_audit_logs(target_user_id);

-- Funções
CREATE OR REPLACE FUNCTION public.is_internal_ocs(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.is_platform_owner(_uid)
    OR public.has_role(_uid, 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.acl_internal_staff WHERE user_id = _uid)
$$;

CREATE OR REPLACE FUNCTION public.can(_uid uuid, _key text, _company uuid DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_module text; v_action text;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  IF public.is_internal_ocs(_uid) THEN RETURN true; END IF;
  IF EXISTS (
    SELECT 1 FROM public.acl_user_permissions
    WHERE user_id = _uid AND permission_key = _key
      AND (company_id = _company OR company_id IS NULL)
  ) THEN RETURN true; END IF;
  SELECT module, action INTO v_module, v_action FROM public.acl_permissions_catalog WHERE key = _key;
  IF v_module IS NULL THEN RETURN false; END IF;
  IF v_module = 'engenharia' AND v_action IN ('editar','criar','excluir') THEN RETURN public.eng_can_edit(_uid); END IF;
  IF v_module = 'crea' THEN
    RETURN public.crea_can(_uid, _company, CASE v_action WHEN 'editar' THEN 'edit' WHEN 'criar' THEN 'create' WHEN 'excluir' THEN 'delete' ELSE 'view' END);
  END IF;
  IF v_module = 'comunicacao' THEN
    RETURN public.comm_can(_uid, _company, CASE v_action WHEN 'editar' THEN 'edit' WHEN 'criar' THEN 'create' WHEN 'excluir' THEN 'delete' WHEN 'aprovar' THEN 'approve' WHEN 'publicar' THEN 'publish' ELSE 'view' END);
  END IF;
  IF v_module = 'rhdp' THEN RETURN public.has_role(_uid,'rh_admin'::app_role) OR public.has_role(_uid,'dp_admin'::app_role); END IF;
  IF v_module = 'juridico' THEN RETURN public.has_role(_uid,'juridico'::app_role); END IF;
  RETURN false;
END $$;

CREATE OR REPLACE FUNCTION public.acl_grant(_target uuid, _company uuid, _key text, _reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor uuid := auth.uid(); new_id uuid;
BEGIN
  IF actor IS NULL THEN RETURN jsonb_build_object('ok',false,'error','unauthenticated'); END IF;
  IF NOT public.is_internal_ocs(actor) THEN RETURN jsonb_build_object('ok',false,'error','forbidden_only_ocs_internal'); END IF;
  IF NOT EXISTS (SELECT 1 FROM public.acl_permissions_catalog WHERE key=_key AND ativo) THEN
    RETURN jsonb_build_object('ok',false,'error','invalid_key');
  END IF;
  INSERT INTO public.acl_user_permissions(user_id, company_id, permission_key, granted_by, reason)
    VALUES (_target, _company, _key, actor, _reason)
    ON CONFLICT DO NOTHING
    RETURNING id INTO new_id;
  INSERT INTO public.acl_audit_logs(actor_user_id,target_user_id,company_id,permission_key,action,reason,after)
    VALUES (actor,_target,_company,_key,'grant',_reason, jsonb_build_object('granted',true));
  RETURN jsonb_build_object('ok',true,'id',new_id);
END $$;

CREATE OR REPLACE FUNCTION public.acl_revoke(_target uuid, _company uuid, _key text, _reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor uuid := auth.uid(); n int;
BEGIN
  IF actor IS NULL THEN RETURN jsonb_build_object('ok',false,'error','unauthenticated'); END IF;
  IF NOT public.is_internal_ocs(actor) THEN RETURN jsonb_build_object('ok',false,'error','forbidden_only_ocs_internal'); END IF;
  WITH del AS (
    DELETE FROM public.acl_user_permissions
     WHERE user_id=_target AND permission_key=_key AND (company_id IS NOT DISTINCT FROM _company)
     RETURNING 1
  ) SELECT COUNT(*) INTO n FROM del;
  INSERT INTO public.acl_audit_logs(actor_user_id,target_user_id,company_id,permission_key,action,reason,before)
    VALUES (actor,_target,_company,_key,'revoke',_reason,jsonb_build_object('removed_rows',n));
  RETURN jsonb_build_object('ok',true,'removed',n);
END $$;

-- RLS
ALTER TABLE public.acl_permissions_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acl_internal_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acl_user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acl_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY acl_cat_read ON public.acl_permissions_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY acl_cat_write ON public.acl_permissions_catalog FOR ALL TO authenticated
  USING (public.is_internal_ocs(auth.uid())) WITH CHECK (public.is_internal_ocs(auth.uid()));

CREATE POLICY acl_staff_all ON public.acl_internal_staff FOR ALL TO authenticated
  USING (public.is_internal_ocs(auth.uid())) WITH CHECK (public.is_internal_ocs(auth.uid()));

CREATE POLICY acl_up_read_self ON public.acl_user_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_internal_ocs(auth.uid()));
CREATE POLICY acl_up_write_internal ON public.acl_user_permissions FOR ALL TO authenticated
  USING (public.is_internal_ocs(auth.uid())) WITH CHECK (public.is_internal_ocs(auth.uid()));

CREATE POLICY acl_audit_read ON public.acl_audit_logs FOR SELECT TO authenticated
  USING (public.is_internal_ocs(auth.uid()));

-- Seed catálogo
INSERT INTO public.acl_permissions_catalog (key, module, resource, action, label, ordem) VALUES
  ('adm.visibilidade.visualizar','adm','visibilidade','visualizar','ADM Visibilidade — Ver',10),
  ('adm.visibilidade.editar','adm','visibilidade','editar','ADM Visibilidade — Editar',11),
  ('adm.auditoria.visualizar','adm','auditoria','visualizar','ADM Auditoria — Ver',12),
  ('engenharia.acessar','engenharia','modulo','acessar','Engenharia — Acessar',100),
  ('engenharia.sites.visualizar','engenharia','sites','visualizar','Sites — Ver',101),
  ('engenharia.sites.criar','engenharia','sites','criar','Sites — Criar',102),
  ('engenharia.sites.editar','engenharia','sites','editar','Sites — Editar',103),
  ('engenharia.sites.excluir','engenharia','sites','excluir','Sites — Excluir',104),
  ('engenharia.atividades.visualizar','engenharia','atividades','visualizar','Atividades — Ver',110),
  ('engenharia.atividades.editar','engenharia','atividades','editar','Atividades — Editar',111),
  ('engenharia.materiais.visualizar','engenharia','materiais','visualizar','Materiais — Ver',120),
  ('engenharia.materiais.editar','engenharia','materiais','editar','Materiais — Editar',121),
  ('engenharia.suprimentos.visualizar','engenharia','suprimentos','visualizar','Suprimentos — Ver',130),
  ('engenharia.suprimentos.editar','engenharia','suprimentos','editar','Suprimentos — Editar',131),
  ('engenharia.governanca.acessar','engenharia','governanca','acessar','Eng. Governança — Acessar',140),
  ('crea.acessar','crea','modulo','acessar','CREA — Acessar',200),
  ('crea.art.visualizar','crea','art','visualizar','ART — Ver',201),
  ('crea.art.criar','crea','art','criar','ART — Criar',202),
  ('crea.art.editar','crea','art','editar','ART — Editar',203),
  ('crea.art.excluir','crea','art','excluir','ART — Excluir',204),
  ('crea.credenciais.visualizar','crea','credenciais','visualizar','Credenciais — Ver',210),
  ('crea.credenciais.gerenciar','crea','credenciais','gerenciar','Credenciais — Gerenciar',211),
  ('crea.governanca.acessar','crea','governanca','acessar','CREA Governança — Acessar',220),
  ('crea.governanca.financeiro','crea','governanca','financeiro','CREA Gov. — Financeiro',221),
  ('crea.governanca.importar','crea','governanca','importar','CREA Gov. — Importar',222),
  ('comunicacao.acessar','comunicacao','modulo','acessar','Comunicação — Acessar',300),
  ('comunicacao.posts.visualizar','comunicacao','posts','visualizar','Posts — Ver',301),
  ('comunicacao.posts.criar','comunicacao','posts','criar','Posts — Criar',302),
  ('comunicacao.posts.editar','comunicacao','posts','editar','Posts — Editar',303),
  ('comunicacao.posts.aprovar','comunicacao','posts','aprovar','Posts — Aprovar',304),
  ('comunicacao.posts.publicar','comunicacao','posts','publicar','Posts — Publicar',305),
  ('comunicacao.marca.gerenciar','comunicacao','marca','gerenciar','Marca — Gerenciar',310),
  ('rhdp.acessar','rhdp','modulo','acessar','RH/DP — Acessar',400),
  ('rhdp.colaboradores.visualizar','rhdp','colaboradores','visualizar','Colaboradores — Ver',401),
  ('rhdp.colaboradores.editar','rhdp','colaboradores','editar','Colaboradores — Editar',402),
  ('rhdp.folha.visualizar','rhdp','folha','visualizar','Folha — Ver',410),
  ('rhdp.folha.editar','rhdp','folha','editar','Folha — Editar',411),
  ('rhdp.ferias.aprovar','rhdp','ferias','aprovar','Férias — Aprovar',420),
  ('juridico.acessar','juridico','modulo','acessar','Jurídico — Acessar',500),
  ('juridico.processos.visualizar','juridico','processos','visualizar','Processos — Ver',501),
  ('juridico.processos.editar','juridico','processos','editar','Processos — Editar',502),
  ('governanca.acessar','governanca','modulo','acessar','Governança — Acessar',600),
  ('governanca.dados.editar','governanca','dados','editar','Governança Dados — Editar',601),
  ('governanca.relatorios.exportar','governanca','relatorios','exportar','Governança — Exportar',602),
  ('aparencia.acessar','aparencia','modulo','acessar','Aparência — Acessar',700),
  ('aparencia.tema.editar','aparencia','tema','editar','Aparência — Editar tema',701),
  ('planos.acessar','planos','modulo','acessar','Planos — Acessar',800),
  ('planos.empresas.editar','planos','empresas','editar','Empresas — Editar',801),
  ('planos.calculadora.editar','planos','calculadora','editar','Calculadora — Editar',802)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.acl_internal_staff (user_id, notes)
  VALUES ('3510fb25-714e-4906-b6bb-a2a9cef7c8c6'::uuid, 'Owner da plataforma OCS')
  ON CONFLICT DO NOTHING;
