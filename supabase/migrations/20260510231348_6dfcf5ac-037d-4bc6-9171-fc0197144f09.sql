-- Compliance Policies and Standards
CREATE TABLE IF NOT EXISTS public.compliance_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    standard_name TEXT NOT NULL, -- 'LGPD', 'ISO27001', 'SOC2'
    status TEXT DEFAULT 'not_started', -- 'not_started', 'in_progress', 'compliant'
    completion_percentage INTEGER DEFAULT 0,
    last_audit_at TIMESTAMPTZ,
    next_audit_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Evidence Registry (Cadeia de Custódia)
CREATE TABLE IF NOT EXISTS public.compliance_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    standard_id UUID REFERENCES public.compliance_standards(id),
    title TEXT NOT NULL,
    description TEXT,
    evidence_type TEXT, -- 'log', 'document', 'screenshot', 'policy'
    file_url TEXT,
    integrity_hash TEXT, -- SHA-256 hash for immutability verification
    verified_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Incident Management System
CREATE TABLE IF NOT EXISTS public.compliance_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    title TEXT NOT NULL,
    severity TEXT DEFAULT 'low',
    incident_type TEXT NOT NULL, -- 'data_breach', 'unauthorized_access', 'system_failure'
    status TEXT DEFAULT 'open', -- 'open', 'investigating', 'remediated', 'closed'
    description TEXT,
    remediation_plan TEXT,
    impact_analysis TEXT,
    opened_by UUID NOT NULL,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Data Retention Policies
CREATE TABLE IF NOT EXISTS public.compliance_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    module TEXT NOT NULL, -- 'financeiro', 'juridico', 'rh', 'auditoria'
    retention_period_years INTEGER NOT NULL,
    is_legally_required BOOLEAN DEFAULT true,
    legal_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.compliance_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_retention_policies ENABLE ROW LEVEL SECURITY;

-- Strict Isolation Policies
CREATE POLICY "Company isolation for standards" ON public.compliance_standards FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_ocs', 'root_ocs'));
CREATE POLICY "Company isolation for evidence" ON public.compliance_evidence FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_ocs', 'root_ocs'));
CREATE POLICY "Company isolation for incidents" ON public.compliance_incidents FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_ocs', 'root_ocs'));
CREATE POLICY "Company isolation for retention" ON public.compliance_retention_policies FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_ocs', 'root_ocs'));

-- Trigger for Compliance Logging
CREATE OR REPLACE FUNCTION public.log_compliance_event() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.security_audit_logs (
        company_id,
        user_id,
        action_type,
        module,
        description,
        severity
    ) VALUES (
        NEW.company_id,
        auth.uid(),
        'COMPLIANCE_CHANGE',
        'GOVERNANÇA',
        'Alteração em política de compliance ou registro de incidente: ' || TG_TABLE_NAME,
        'medium'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_compliance_standards_audit AFTER INSERT OR UPDATE ON public.compliance_standards FOR EACH ROW EXECUTE FUNCTION public.log_compliance_event();
CREATE TRIGGER tr_compliance_incidents_audit AFTER INSERT OR UPDATE ON public.compliance_incidents FOR EACH ROW EXECUTE FUNCTION public.log_compliance_event();
