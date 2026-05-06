
-- Branding por empresa
CREATE TABLE public.company_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE,
  logo_url text,
  letterhead_url text,
  primary_color text,
  rodape text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.company_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read branding" ON public.company_branding
FOR SELECT TO authenticated
USING (company_id = public.user_company(auth.uid()) OR public.is_financeiro_ocs(auth.uid()));

CREATE POLICY "company admin write branding" ON public.company_branding
FOR ALL TO authenticated
USING (public.is_company_admin(auth.uid(), company_id) OR public.is_financeiro_ocs(auth.uid()))
WITH CHECK (public.is_company_admin(auth.uid(), company_id) OR public.is_financeiro_ocs(auth.uid()));

-- Storage bucket público para logos
INSERT INTO storage.buckets (id, name, public) VALUES ('company-branding', 'company-branding', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "branding public read" ON storage.objects
FOR SELECT USING (bucket_id = 'company-branding');

CREATE POLICY "branding upload by company admin" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'company-branding'
  AND (
    public.is_financeiro_ocs(auth.uid())
    OR public.is_company_admin(auth.uid(), (storage.foldername(name))[1]::uuid)
  )
);

CREATE POLICY "branding update by company admin" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'company-branding'
  AND (
    public.is_financeiro_ocs(auth.uid())
    OR public.is_company_admin(auth.uid(), (storage.foldername(name))[1]::uuid)
  )
);

CREATE POLICY "branding delete by company admin" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'company-branding'
  AND (
    public.is_financeiro_ocs(auth.uid())
    OR public.is_company_admin(auth.uid(), (storage.foldername(name))[1]::uuid)
  )
);

-- Impersonação OCS: registra sessões para auditoria. A "impersonação" é client-side
-- (somente leitura visual da UI); RLS continua intacto (OCS já tem permissão de leitura nas tabelas).
CREATE TABLE public.ocs_impersonation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ocs_user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  reason text,
  data_access_granted boolean NOT NULL DEFAULT false
);
ALTER TABLE public.ocs_impersonation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ocs read sessions" ON public.ocs_impersonation_sessions
FOR SELECT TO authenticated
USING (public.is_financeiro_ocs(auth.uid()) OR ocs_user_id = auth.uid()
       OR company_id = public.user_company(auth.uid()));

CREATE POLICY "ocs insert sessions" ON public.ocs_impersonation_sessions
FOR INSERT TO authenticated
WITH CHECK (public.is_financeiro_ocs(auth.uid()) AND ocs_user_id = auth.uid());

CREATE POLICY "ocs end sessions" ON public.ocs_impersonation_sessions
FOR UPDATE TO authenticated
USING (public.is_financeiro_ocs(auth.uid()) AND ocs_user_id = auth.uid())
WITH CHECK (public.is_financeiro_ocs(auth.uid()) AND ocs_user_id = auth.uid());

CREATE INDEX idx_imp_company ON public.ocs_impersonation_sessions(company_id, started_at DESC);
