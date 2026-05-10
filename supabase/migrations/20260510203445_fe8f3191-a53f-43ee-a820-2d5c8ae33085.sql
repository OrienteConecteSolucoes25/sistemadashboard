
-- Leva 4: funções legadas passam a consultar também a ACL central (public.can)
-- Estratégia: shim no topo de cada função. Mantém comportamento antigo como fallback.

-- Engenharia ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.eng_can_edit(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.is_internal_ocs(_uid)
    OR public.can(_uid, 'engenharia.acessar', NULL)
    OR public.has_role(_uid, 'admin'::app_role)
    OR public.has_role(_uid, 'engenharia'::app_role)
    OR public.has_role(_uid, 'planejamento'::app_role)
    OR public.has_role(_uid, 'diretoria'::app_role)
    OR public.has_role(_uid, 'suprimentos'::app_role)
    OR public.has_role(_uid, 'fibra'::app_role)
$$;

-- CREA ------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crea_can(_uid uuid, _company uuid, _action text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  perm record;
  acl_key text;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  IF public.is_internal_ocs(_uid) THEN RETURN true; END IF;

  -- Mapeia action → chave ACL central
  acl_key := CASE _action
    WHEN 'view'                 THEN 'crea.art.visualizar'
    WHEN 'create'               THEN 'crea.art.criar'
    WHEN 'edit'                 THEN 'crea.art.editar'
    WHEN 'delete'               THEN 'crea.art.excluir'
    WHEN 'view_credentials'     THEN 'crea.credenciais.visualizar'
    WHEN 'manage_credentials'   THEN 'crea.credenciais.gerenciar'
    WHEN 'governance'           THEN 'crea.governanca.acessar'
    WHEN 'governance_finance'   THEN 'crea.governanca.financeiro'
    WHEN 'governance_audit'     THEN 'crea.governanca.acessar'
    WHEN 'governance_import'    THEN 'crea.governanca.importar'
    ELSE NULL
  END;
  IF acl_key IS NOT NULL AND public.can(_uid, acl_key, _company) THEN RETURN true; END IF;
  -- 'crea.acessar' libera leitura geral
  IF _action = 'view' AND public.can(_uid, 'crea.acessar', _company) THEN RETURN true; END IF;

  -- Lógica antiga (fallback)
  IF public.has_role(_uid,'admin'::app_role) THEN RETURN true; END IF;
  IF public.has_role(_uid,'crea_admin'::app_role) THEN
    IF _company IS NULL OR public.user_company(_uid) = _company THEN RETURN true; END IF;
  END IF;
  IF _company IS NOT NULL AND public.is_company_admin(_uid, _company) THEN RETURN true; END IF;
  IF public.has_role(_uid,'crea_auditor'::app_role) AND _action IN ('view','view_sensitive','governance','governance_audit') THEN
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
    WHEN 'governance' THEN perm.can_governance
    WHEN 'governance_finance' THEN perm.can_governance_finance
    WHEN 'governance_audit' THEN perm.can_governance_audit
    WHEN 'governance_import' THEN perm.can_governance_import
    ELSE false END;
END $$;

-- Comunicação ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.comm_can(_uid uuid, _company uuid, _action text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE perm record; acl_key text;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  IF public.is_internal_ocs(_uid) THEN RETURN true; END IF;

  acl_key := CASE _action
    WHEN 'view'           THEN 'comunicacao.posts.visualizar'
    WHEN 'create'         THEN 'comunicacao.posts.criar'
    WHEN 'edit'           THEN 'comunicacao.posts.editar'
    WHEN 'approve'        THEN 'comunicacao.posts.aprovar'
    WHEN 'publish'        THEN 'comunicacao.posts.publicar'
    WHEN 'manage_brand'   THEN 'comunicacao.marca.gerenciar'
    ELSE NULL
  END;
  IF acl_key IS NOT NULL AND public.can(_uid, acl_key, _company) THEN RETURN true; END IF;
  IF _action = 'view' AND public.can(_uid, 'comunicacao.acessar', _company) THEN RETURN true; END IF;

  -- Lógica antiga
  IF public.has_role(_uid,'admin'::app_role) THEN RETURN true; END IF;
  IF public.has_role(_uid,'comunicacao_admin'::app_role) THEN
    IF _company IS NULL OR public.user_company(_uid) = _company THEN RETURN true; END IF;
  END IF;
  IF _company IS NOT NULL AND public.is_company_admin(_uid, _company) THEN RETURN true; END IF;
  IF _action IN ('view','create','edit','generate_content','generate_design','export') AND (
       public.has_role(_uid,'social_media'::app_role) OR
       public.has_role(_uid,'redator'::app_role) OR
       public.has_role(_uid,'designer'::app_role) OR
       public.has_role(_uid,'gestor_produto'::app_role)) THEN
    IF _company IS NULL OR public.user_company(_uid) = _company THEN RETURN true; END IF;
  END IF;
  IF _action = 'generate_image' AND (
       public.has_role(_uid,'social_media'::app_role) OR
       public.has_role(_uid,'designer'::app_role)) THEN
    IF _company IS NULL OR public.user_company(_uid) = _company THEN RETURN true; END IF;
  END IF;
  IF _action IN ('approve','publish') AND public.has_role(_uid,'aprovador'::app_role) THEN
    IF _company IS NULL OR public.user_company(_uid) = _company THEN RETURN true; END IF;
  END IF;
  IF _action = 'view' AND _company IS NOT NULL AND public.user_company(_uid) = _company THEN RETURN true; END IF;
  IF _company IS NULL THEN RETURN false; END IF;
  SELECT * INTO perm FROM public.comm_module_permissions WHERE user_id=_uid AND company_id=_company LIMIT 1;
  IF perm.id IS NULL THEN RETURN false; END IF;
  RETURN CASE _action
    WHEN 'view' THEN perm.can_view WHEN 'create' THEN perm.can_create
    WHEN 'edit' THEN perm.can_edit WHEN 'delete' THEN perm.can_delete
    WHEN 'approve' THEN perm.can_approve WHEN 'publish' THEN perm.can_publish
    WHEN 'generate_content' THEN perm.can_generate_content
    WHEN 'generate_design' THEN perm.can_generate_design
    WHEN 'generate_image' THEN perm.can_generate_image
    WHEN 'export' THEN perm.can_export
    WHEN 'manage_brand' THEN perm.can_manage_brand
    WHEN 'manage_templates' THEN perm.can_manage_templates
    WHEN 'manage_settings' THEN perm.can_manage_settings
    ELSE false END;
END $$;

-- RH/DP -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hrdp_can(_uid uuid, _company uuid, _submodule text, _action text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE perm record; acl_key text;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  IF public.is_internal_ocs(_uid) THEN RETURN true; END IF;

  acl_key := CASE _action
    WHEN 'view'    THEN 'rhdp.colaboradores.visualizar'
    WHEN 'edit'    THEN 'rhdp.colaboradores.editar'
    WHEN 'approve' THEN 'rhdp.ferias.aprovar'
    ELSE NULL
  END;
  IF acl_key IS NOT NULL AND public.can(_uid, acl_key, _company) THEN RETURN true; END IF;
  IF _action = 'view' AND public.can(_uid, 'rhdp.acessar', _company) THEN RETURN true; END IF;

  -- Lógica antiga
  IF public.has_role(_uid,'admin'::app_role) THEN RETURN true; END IF;
  IF public.has_role(_uid,'rh_admin'::app_role) OR public.has_role(_uid,'dp_admin'::app_role) THEN
    IF _company IS NULL OR public.user_company(_uid) = _company THEN RETURN true; END IF;
  END IF;
  IF _company IS NOT NULL AND public.is_company_admin(_uid, _company) THEN RETURN true; END IF;
  IF public.has_role(_uid,'auditor_rh'::app_role) AND _action IN ('view','view_sensitive') THEN
    IF _company IS NULL OR public.user_company(_uid) = _company THEN RETURN true; END IF;
  END IF;
  SELECT * INTO perm FROM public.hrdp_module_permissions
   WHERE user_id=_uid AND company_id=_company AND submodule_key=_submodule LIMIT 1;
  IF perm.id IS NULL THEN RETURN false; END IF;
  RETURN CASE _action
    WHEN 'view' THEN perm.can_view
    WHEN 'edit' THEN perm.can_edit
    WHEN 'approve' THEN perm.can_approve
    WHEN 'view_sensitive' THEN perm.can_view_sensitive
    ELSE false END;
END $$;

-- Tema/Aparência --------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.theme_can(_uid uuid, _company uuid, _action text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE perm record;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  IF public.is_internal_ocs(_uid) THEN RETURN true; END IF;

  -- ACL central
  IF _action IN ('manage','manage_brand','manage_charts') AND public.can(_uid, 'aparencia.tema.editar', _company) THEN
    RETURN true;
  END IF;
  IF _action IN ('view','view_audit') AND public.can(_uid, 'aparencia.acessar', _company) THEN
    RETURN true;
  END IF;

  -- Lógica antiga
  IF public.has_role(_uid,'admin'::app_role) THEN RETURN true; END IF;
  IF _company IS NULL THEN RETURN false; END IF;
  IF public.is_company_admin(_uid, _company) THEN
    IF _action IN ('view','manage','manage_brand','manage_charts','view_audit') THEN RETURN true; END IF;
  END IF;
  IF _action = 'view' AND public.user_company(_uid) = _company THEN RETURN true; END IF;
  SELECT * INTO perm FROM public.theme_permissions
    WHERE user_id = _uid AND (company_id = _company OR company_id IS NULL)
    ORDER BY company_id NULLS LAST LIMIT 1;
  IF perm.id IS NULL THEN RETURN false; END IF;
  RETURN CASE _action
    WHEN 'view' THEN perm.can_view
    WHEN 'manage' THEN perm.can_manage
    WHEN 'manage_brand' THEN perm.can_manage_brand
    WHEN 'manage_charts' THEN perm.can_manage_charts
    WHEN 'view_audit' THEN perm.can_view_audit
    ELSE false END;
END $$;

-- Governança ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.gov_can_edit(_uid uuid, _module text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  IF public.is_internal_ocs(_uid) THEN RETURN true; END IF;

  -- ACL central
  IF public.can(_uid, 'governanca.dados.editar', NULL) THEN RETURN true; END IF;
  IF _module = 'engenharia'  AND public.can(_uid, 'engenharia.governanca.acessar', NULL) THEN RETURN true; END IF;
  IF _module = 'crea'        AND public.can(_uid, 'crea.governanca.acessar', NULL) THEN RETURN true; END IF;

  -- Lógica antiga
  IF public.has_role(_uid,'admin'::app_role) THEN RETURN true; END IF;
  IF public.gov_edit_open() THEN RETURN true; END IF;
  IF public.has_role(_uid,'planejamento'::app_role) OR public.has_role(_uid,'diretoria'::app_role) THEN RETURN true; END IF;
  IF _module = 'engenharia' AND public.eng_can_edit(_uid) THEN RETURN true; END IF;
  IF _module = 'juridico'  AND public.has_role(_uid,'juridico'::app_role) THEN RETURN true; END IF;
  IF _module = 'crea'      AND public.crea_can(_uid, NULL,'edit') THEN RETURN true; END IF;
  IF _module = 'rhdp'      AND (public.has_role(_uid,'rh_admin'::app_role) OR public.has_role(_uid,'dp_admin'::app_role)) THEN RETURN true; END IF;
  IF _module = 'comunicacao' AND public.has_role(_uid,'comunicacao_admin'::app_role) THEN RETURN true; END IF;
  RETURN false;
END $$;
