
-- Add scope to company_theme_settings to support system_global theme
ALTER TABLE public.company_theme_settings
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'client_company';

-- Allow company_id to be NULL for system_global scope
ALTER TABLE public.company_theme_settings
  ALTER COLUMN company_id DROP NOT NULL;

-- Drop old unique on company_id only and create scope-aware partial unique indexes
ALTER TABLE public.company_theme_settings
  DROP CONSTRAINT IF EXISTS company_theme_settings_company_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_theme_per_company
  ON public.company_theme_settings(company_id)
  WHERE company_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_theme_system_global
  ON public.company_theme_settings((1))
  WHERE scope = 'system_global' AND company_id IS NULL;

-- Mark ERP OCS company as owner_company scope
UPDATE public.company_theme_settings
   SET scope = 'owner_company'
 WHERE company_id IN (SELECT id FROM public.companies WHERE nome ILIKE 'ERP OCS' OR nome ILIKE 'Oriente%');

-- Allow theme_can to handle NULL company (system_global) for admins
CREATE OR REPLACE FUNCTION public.theme_can(_uid uuid, _company uuid, _action text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE perm record;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  IF public.has_role(_uid,'admin'::app_role) THEN RETURN true; END IF;
  IF _company IS NULL THEN RETURN false; END IF;
  IF public.is_company_admin(_uid, _company) THEN
    IF _action IN ('view','manage','manage_brand','manage_charts','view_audit') THEN RETURN true; END IF;
  END IF;
  IF _action = 'view' AND public.user_company(_uid) = _company THEN
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
END $function$;

-- Allow admins to insert/update rows with NULL company_id (system_global)
DROP POLICY IF EXISTS theme_insert_admin ON public.company_theme_settings;
CREATE POLICY theme_insert_admin ON public.company_theme_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(),'admin'::app_role)
    OR (company_id IS NOT NULL AND (is_company_admin(auth.uid(), company_id) OR is_financeiro_ocs(auth.uid())))
  );

DROP POLICY IF EXISTS theme_update_admin ON public.company_theme_settings;
CREATE POLICY theme_update_admin ON public.company_theme_settings
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(),'admin'::app_role)
    OR (company_id IS NOT NULL AND (is_company_admin(auth.uid(), company_id) OR is_financeiro_ocs(auth.uid())))
  )
  WITH CHECK (
    has_role(auth.uid(),'admin'::app_role)
    OR (company_id IS NOT NULL AND (is_company_admin(auth.uid(), company_id) OR is_financeiro_ocs(auth.uid())))
  );

-- Allow theme_audit_logs to accept NULL company_id (system_global) for admins
ALTER TABLE public.theme_audit_logs ALTER COLUMN company_id DROP NOT NULL;

DROP POLICY IF EXISTS theme_audit_insert ON public.theme_audit_logs;
CREATE POLICY theme_audit_insert ON public.theme_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(),'admin'::app_role)
    OR (company_id IS NOT NULL AND (is_company_admin(auth.uid(), company_id) OR is_financeiro_ocs(auth.uid())))
  );
