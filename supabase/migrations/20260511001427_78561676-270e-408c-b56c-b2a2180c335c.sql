-- ADM Visibility Control
CREATE TABLE IF NOT EXISTS public.adm_visibility_configs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL UNIQUE,
    active_modules TEXT[] DEFAULT '{dashboard, engenharia, financeiro}',
    hidden_features TEXT[] DEFAULT '{}',
    is_client_environment BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trust & Reputation Score (OCS Guard)
-- Check if security_trust_scores exists, if so we link it or create the specialized one
CREATE TABLE IF NOT EXISTS public.ocs_guard_trust_scores (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    target_id UUID NOT NULL, -- User ID, Company ID, or Device ID
    target_type TEXT NOT NULL, -- 'user', 'company', 'device', 'integration'
    trust_score INTEGER DEFAULT 100, -- 0 to 100
    risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    last_assessment_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    factors JSONB DEFAULT '[]'
);

-- Compliance & Governance
CREATE TABLE IF NOT EXISTS public.compliance_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    standard TEXT NOT NULL, -- 'LGPD', 'ISO27001', 'SOC2'
    status TEXT DEFAULT 'pending', -- 'compliant', 'partial', 'non_compliant'
    evidence_url TEXT,
    last_audit_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Advanced Financial Protection Alerts
CREATE TABLE IF NOT EXISTS public.financial_protection_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    user_id UUID NOT NULL,
    alert_type TEXT NOT NULL, -- 'mass_export', 'suspicious_edit', 'unauthorized_access'
    severity TEXT NOT NULL,
    details TEXT,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update AI Governance Logs if table exists
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_governance_logs') THEN
        ALTER TABLE public.ai_governance_logs 
        ADD COLUMN IF NOT EXISTS ai_classification TEXT CHECK (ai_classification IN ('IA informativa', 'IA operacional', 'IA administrativa', 'IA crítica')),
        ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.adm_visibility_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocs_guard_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_protection_alerts ENABLE ROW LEVEL SECURITY;

-- Governance Policies
DROP POLICY IF EXISTS "Admins have full visibility" ON public.adm_visibility_configs;
CREATE POLICY "Admins have full visibility" ON public.adm_visibility_configs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin_ocs');

DROP POLICY IF EXISTS "Companies see their own config" ON public.adm_visibility_configs;
CREATE POLICY "Companies see their own config" ON public.adm_visibility_configs
    FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
