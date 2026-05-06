
CREATE TABLE IF NOT EXISTS public.company_theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE,
  theme_preset text NOT NULL DEFAULT 'glassmorphism',
  primary_color text,
  secondary_color text,
  accent_color text,
  background_color text,
  surface_color text,
  text_color text,
  muted_text_color text,
  border_color text,
  success_color text,
  warning_color text,
  danger_color text,
  info_color text,
  font_family text DEFAULT 'Inter',
  border_radius text DEFAULT 'md',
  shadow_style text DEFAULT 'soft',
  button_style text DEFAULT 'rounded',
  card_style text DEFAULT 'elevated',
  sidebar_style text DEFAULT 'dark',
  dashboard_density text DEFAULT 'comfortable',
  table_density text DEFAULT 'comfortable',
  animation_level text DEFAULT 'normal',
  glass_intensity int DEFAULT 50,
  contrast_level text DEFAULT 'normal',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.company_theme_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "theme_view_own_company"
ON public.company_theme_settings FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.user_company(auth.uid()) = company_id
);

CREATE POLICY "theme_insert_admin"
ON public.company_theme_settings FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.is_company_admin(auth.uid(), company_id)
  OR public.is_financeiro_ocs(auth.uid())
);

CREATE POLICY "theme_update_admin"
ON public.company_theme_settings FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.is_company_admin(auth.uid(), company_id)
  OR public.is_financeiro_ocs(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.is_company_admin(auth.uid(), company_id)
  OR public.is_financeiro_ocs(auth.uid())
);

CREATE POLICY "theme_delete_admin"
ON public.company_theme_settings FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_theme_updated_at
BEFORE UPDATE ON public.company_theme_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE TABLE IF NOT EXISTS public.theme_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  user_id uuid,
  action_type text NOT NULL,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.theme_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "theme_audit_view"
ON public.theme_audit_logs FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.is_company_admin(auth.uid(), company_id)
);

CREATE POLICY "theme_audit_insert"
ON public.theme_audit_logs FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.is_company_admin(auth.uid(), company_id)
  OR public.is_financeiro_ocs(auth.uid())
);

CREATE INDEX IF NOT EXISTS idx_theme_audit_company ON public.theme_audit_logs(company_id, created_at DESC);
