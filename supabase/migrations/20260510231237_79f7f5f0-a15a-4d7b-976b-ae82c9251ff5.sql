-- Financial Security Alerts Table
CREATE TABLE IF NOT EXISTS public.financial_security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    alert_type TEXT NOT NULL, -- 'mass_export', 'suspicious_change', 'unusual_access', 'high_value_transaction'
    module TEXT DEFAULT 'financeiro',
    severity TEXT DEFAULT 'high', -- 'medium', 'high', 'critical'
    description TEXT,
    details JSONB,
    status TEXT DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'false_positive'
    triggered_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID
);

-- Enable RLS
ALTER TABLE public.financial_security_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Strict isolation
CREATE POLICY "Strict financial alert isolation" 
ON public.financial_security_alerts 
FOR ALL 
USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) 
    OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_ocs', 'root_ocs')
);

-- Function to trigger financial alerts
CREATE OR REPLACE FUNCTION public.trigger_financial_alert(
    p_company_id UUID,
    p_alert_type TEXT,
    p_description TEXT,
    p_details JSONB,
    p_severity TEXT DEFAULT 'high'
) RETURNS UUID AS $$
DECLARE
    v_alert_id UUID;
BEGIN
    INSERT INTO public.financial_security_alerts (
        company_id, 
        alert_type, 
        description, 
        details, 
        severity, 
        triggered_by
    ) VALUES (
        p_company_id, 
        p_alert_type, 
        p_description, 
        p_details, 
        p_severity, 
        auth.uid()
    ) RETURNING id INTO v_alert_id;
    
    -- Also log to general security audit
    INSERT INTO public.security_audit_logs (
        company_id,
        user_id,
        action_type,
        module,
        description,
        severity,
        payload
    ) VALUES (
        p_company_id,
        auth.uid(),
        'FINANCIAL_ALERT_' || p_alert_type,
        'FINANCEIRO',
        p_description,
        p_severity,
        p_details
    );

    RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexing
CREATE INDEX IF NOT EXISTS idx_fin_alerts_company ON public.financial_security_alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_fin_alerts_status ON public.financial_security_alerts(status);
