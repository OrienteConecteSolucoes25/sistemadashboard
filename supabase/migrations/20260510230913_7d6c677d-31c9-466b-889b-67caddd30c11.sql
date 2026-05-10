-- Update profiles table with security fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'cliente',
ADD COLUMN IF NOT EXISTS company_id UUID,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS session_timeout_minutes INTEGER DEFAULT 60;

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    user_id UUID NOT NULL,
    action_type TEXT NOT NULL,
    module TEXT NOT NULL,
    description TEXT,
    payload JSONB,
    severity TEXT DEFAULT 'info',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Security Policies Table
CREATE TABLE IF NOT EXISTS public.security_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    policy_type TEXT NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pending Approvals Table
CREATE TABLE IF NOT EXISTS public.security_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    requested_by UUID NOT NULL,
    action_type TEXT NOT NULL,
    module TEXT NOT NULL,
    payload JSONB,
    status TEXT DEFAULT 'pending',
    approved_by UUID,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vulnerability Registry
CREATE TABLE IF NOT EXISTS public.security_vulnerabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    module TEXT NOT NULL,
    risk_level TEXT NOT NULL,
    description TEXT,
    mitigation_plan TEXT,
    status TEXT DEFAULT 'detected',
    detected_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- Credential Vault
CREATE TABLE IF NOT EXISTS public.security_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    integration_name TEXT NOT NULL,
    key_hint TEXT,
    encrypted_secret TEXT,
    last_accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Security Scores Table
CREATE TABLE IF NOT EXISTS public.security_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL UNIQUE,
    finance_score INTEGER DEFAULT 100,
    legal_score INTEGER DEFAULT 100,
    hr_score INTEGER DEFAULT 100,
    eng_score INTEGER DEFAULT 100,
    overall_score INTEGER DEFAULT 100,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Emergency Mode Registry
CREATE TABLE IF NOT EXISTS public.security_emergency_mode (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    activated_by UUID NOT NULL,
    status BOOLEAN DEFAULT false,
    reason TEXT,
    activated_at TIMESTAMPTZ,
    deactivated_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.security_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_emergency_mode ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Strict data isolation for company users on logs" 
ON public.security_audit_logs 
FOR SELECT 
USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) 
    OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_ocs', 'root_ocs')
);

CREATE POLICY "Strict isolation for policies" 
ON public.security_policies 
FOR ALL 
USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) 
    OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_ocs', 'root_ocs')
);

CREATE POLICY "Strict isolation for approvals" ON public.security_approvals FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_ocs', 'root_ocs'));
CREATE POLICY "Strict isolation for vulnerabilities" ON public.security_vulnerabilities FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_ocs', 'root_ocs'));
CREATE POLICY "Strict isolation for vault" ON public.security_vault FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_ocs', 'root_ocs'));
CREATE POLICY "Strict isolation for scores" ON public.security_scores FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_ocs', 'root_ocs'));
CREATE POLICY "Strict isolation for emergency" ON public.security_emergency_mode FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_ocs', 'root_ocs'));
