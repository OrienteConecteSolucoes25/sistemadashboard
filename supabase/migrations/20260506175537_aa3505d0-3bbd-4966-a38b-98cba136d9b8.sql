
-- =========================================================
-- APARÊNCIA & MARCA — Schema
-- =========================================================

-- 1) Tema salvo por empresa
CREATE TABLE IF NOT EXISTS public.company_theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE,
  preset_key text NOT NULL DEFAULT 'oriente',
  palette jsonb NOT NULL DEFAULT '{}'::jsonb,
  typography jsonb NOT NULL DEFAULT '{}'::jsonb,
  layout jsonb NOT NULL DEFAULT '{}'::jsonb,
  sidebar_style jsonb NOT NULL DEFAULT '{}'::jsonb,
  background_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

-- 2) Preferências de gráficos por empresa
CREATE TABLE IF NOT EXISTS public.company_chart_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  module_key text NOT NULL,
  tab_key text NOT NULL DEFAULT '',
  subtab_key text NOT NULL DEFAULT '',
  metric_key text NOT NULL,
  allowed_chart_types text[] NOT NULL DEFAULT ARRAY['bar','line','pie']::text[],
  default_chart_type text NOT NULL DEFAULT 'bar',
  user_can_switch boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  UNIQUE (company_id, module_key, tab_key, subtab_key, metric_key)
);

-- 3) Preferências de gráficos por usuário
CREATE TABLE IF NOT EXISTS public.user_chart_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  module_key text NOT NULL,
  tab_key text NOT NULL DEFAULT '',
  metric_key text NOT NULL,
  selected_chart_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id, module_key, tab_key, metric_key)
);

-- 4) Preferências de layout por usuário
CREATE TABLE IF NOT EXISTS public.user_layout_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid,
  module_key text NOT NULL,
  internal_sidebar_collapsed boolean NOT NULL DEFAULT false,
  dashboard_density text NOT NULL DEFAULT 'comfortable',
  table_density text NOT NULL DEFAULT 'comfortable',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_key)
);

-- 5) Auditoria de tema
CREATE TABLE IF NOT EXISTS public.theme_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  user_id uuid,
  action text NOT NULL,
  change_type text NOT NULL,
  summary text,
  before jsonb,
  after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6) Permissões de tema por usuário/empresa
CREATE TABLE IF NOT EXISTS public.theme_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid,
  can_view boolean NOT NULL DEFAULT true,
  can_manage boolean NOT NULL DEFAULT false,
  can_manage_brand boolean NOT NULL DEFAULT false,
  can_manage_charts boolean NOT NULL DEFAULT false,
  can_view_audit boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_cts_updated ON public.company_theme_settings;
CREATE TRIGGER trg_cts_updated BEFORE UPDATE ON public.company_theme_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();
DROP TRIGGER IF EXISTS trg_ccp_updated ON public.company_chart_preferences;
CREATE TRIGGER trg_ccp_updated BEFORE UPDATE ON public.company_chart_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();
DROP TRIGGER IF EXISTS trg_ucp_updated ON public.user_chart_preferences;
CREATE TRIGGER trg_ucp_updated BEFORE UPDATE ON public.user_chart_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();
DROP TRIGGER IF EXISTS trg_ulp_updated ON public.user_layout_preferences;
CREATE TRIGGER trg_ulp_updated BEFORE UPDATE ON public.user_layout_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();
DROP TRIGGER IF EXISTS trg_tp_updated ON public.theme_permissions;
CREATE TRIGGER trg_tp_updated BEFORE UPDATE ON public.theme_permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

-- =========================================================
-- Função theme_can
-- =========================================================
CREATE OR REPLACE FUNCTION public.theme_can(_uid uuid, _company uuid, _action text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE perm record;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  IF public.has_role(_uid,'admin'::app_role) THEN RETURN true; END IF;
  IF _company IS NOT NULL AND public.is_company_admin(_uid, _company) THEN
    IF _action IN ('view','manage','manage_brand','manage_charts','view_audit') THEN RETURN true; END IF;
  END IF;
  IF _action = 'view' AND _company IS NOT NULL AND public.user_company(_uid) = _company THEN
    RETURN true;
  END IF;
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

-- =========================================================
-- RPC theme_save
-- =========================================================
CREATE OR REPLACE FUNCTION public.theme_save(_company uuid, _payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE before_row jsonb; new_id uuid;
BEGIN
  IF _company IS NULL THEN RETURN jsonb_build_object('ok',false,'error','company_required'); END IF;
  IF NOT public.theme_can(auth.uid(), _company, 'manage') THEN
    RETURN jsonb_build_object('ok',false,'error','forbidden');
  END IF;
  SELECT to_jsonb(t) INTO before_row FROM public.company_theme_settings t WHERE company_id = _company;

  INSERT INTO public.company_theme_settings (
    company_id, preset_key, palette, typography, layout, sidebar_style, background_image_url, updated_by, updated_at
  ) VALUES (
    _company,
    COALESCE(_payload->>'preset_key','oriente'),
    COALESCE(_payload->'palette','{}'::jsonb),
    COALESCE(_payload->'typography','{}'::jsonb),
    COALESCE(_payload->'layout','{}'::jsonb),
    COALESCE(_payload->'sidebar_style','{}'::jsonb),
    NULLIF(_payload->>'background_image_url',''),
    auth.uid(), now()
  )
  ON CONFLICT (company_id) DO UPDATE SET
    preset_key = EXCLUDED.preset_key,
    palette = EXCLUDED.palette,
    typography = EXCLUDED.typography,
    layout = EXCLUDED.layout,
    sidebar_style = EXCLUDED.sidebar_style,
    background_image_url = EXCLUDED.background_image_url,
    updated_by = auth.uid(),
    updated_at = now()
  RETURNING id INTO new_id;

  INSERT INTO public.theme_audit_logs (company_id, user_id, action, change_type, summary, before, after)
  VALUES (_company, auth.uid(), 'save', 'theme', 'Tema salvo', before_row, _payload);

  RETURN jsonb_build_object('ok',true,'id',new_id);
END $$;

-- =========================================================
-- RPC theme_restore_default
-- =========================================================
CREATE OR REPLACE FUNCTION public.theme_restore_default(_company uuid, _reason text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE before_row jsonb;
BEGIN
  IF NOT public.theme_can(auth.uid(), _company, 'manage') THEN
    RETURN jsonb_build_object('ok',false,'error','forbidden');
  END IF;
  SELECT to_jsonb(t) INTO before_row FROM public.company_theme_settings t WHERE company_id = _company;
  DELETE FROM public.company_theme_settings WHERE company_id = _company;
  INSERT INTO public.theme_audit_logs (company_id, user_id, action, change_type, summary, before, after)
  VALUES (_company, auth.uid(), 'restore_default', 'theme', COALESCE(_reason,'Restauração padrão OCS'), before_row, NULL);
  RETURN jsonb_build_object('ok',true);
END $$;

-- =========================================================
-- RLS
-- =========================================================
ALTER TABLE public.company_theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_chart_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chart_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_layout_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_permissions ENABLE ROW LEVEL SECURITY;

-- company_theme_settings
DROP POLICY IF EXISTS cts_select ON public.company_theme_settings;
CREATE POLICY cts_select ON public.company_theme_settings FOR SELECT
  USING (public.theme_can(auth.uid(), company_id, 'view'));
DROP POLICY IF EXISTS cts_write ON public.company_theme_settings;
CREATE POLICY cts_write ON public.company_theme_settings FOR ALL
  USING (public.theme_can(auth.uid(), company_id, 'manage'))
  WITH CHECK (public.theme_can(auth.uid(), company_id, 'manage'));

-- company_chart_preferences
DROP POLICY IF EXISTS ccp_select ON public.company_chart_preferences;
CREATE POLICY ccp_select ON public.company_chart_preferences FOR SELECT
  USING (public.theme_can(auth.uid(), company_id, 'view'));
DROP POLICY IF EXISTS ccp_write ON public.company_chart_preferences;
CREATE POLICY ccp_write ON public.company_chart_preferences FOR ALL
  USING (public.theme_can(auth.uid(), company_id, 'manage_charts') OR public.theme_can(auth.uid(), company_id, 'manage'))
  WITH CHECK (public.theme_can(auth.uid(), company_id, 'manage_charts') OR public.theme_can(auth.uid(), company_id, 'manage'));

-- user_chart_preferences (própria)
DROP POLICY IF EXISTS ucp_self ON public.user_chart_preferences;
CREATE POLICY ucp_self ON public.user_chart_preferences FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_layout_preferences (própria)
DROP POLICY IF EXISTS ulp_self ON public.user_layout_preferences;
CREATE POLICY ulp_self ON public.user_layout_preferences FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- theme_audit_logs
DROP POLICY IF EXISTS tal_select ON public.theme_audit_logs;
CREATE POLICY tal_select ON public.theme_audit_logs FOR SELECT
  USING (public.theme_can(auth.uid(), company_id, 'view_audit') OR public.theme_can(auth.uid(), company_id, 'manage'));

-- theme_permissions (admin gerencia)
DROP POLICY IF EXISTS tp_admin ON public.theme_permissions;
CREATE POLICY tp_admin ON public.theme_permissions FOR ALL
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));
DROP POLICY IF EXISTS tp_self_select ON public.theme_permissions;
CREATE POLICY tp_self_select ON public.theme_permissions FOR SELECT
  USING (auth.uid() = user_id);
