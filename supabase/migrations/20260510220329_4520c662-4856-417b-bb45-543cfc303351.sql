-- Tabelas para o OCS Guard

-- 1. Logs de Segurança e Auditoria de Acesso
CREATE TABLE public.ocs_guard_security_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL, -- 'login', 'failed_login', 'permission_change', 'data_access'
    severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    description TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Configurações de Conformidade e Checklist LGPD
CREATE TABLE public.ocs_guard_compliance_checks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id),
    category TEXT NOT NULL, -- 'LGPD', 'Access', 'Data'
    question TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'compliant', 'not_compliant', 'pending'
    recommendation TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Incidentes de Segurança
CREATE TABLE public.ocs_guard_incidents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id),
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'investigating', 'resolved'
    severity TEXT NOT NULL,
    description TEXT,
    containment_steps JSONB,
    reporter_id UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.ocs_guard_security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocs_guard_compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocs_guard_incidents ENABLE ROW LEVEL SECURITY;

-- Políticas corrigidas usando a tabela company_users para verificar admin
CREATE POLICY "Admins can view security logs" ON public.ocs_guard_security_logs FOR SELECT 
USING (
    public.is_internal_ocs(auth.uid()) 
    OR EXISTS (
        SELECT 1 FROM public.company_users 
        WHERE user_id = auth.uid() AND is_company_admin = true
    )
);

CREATE POLICY "Admins can view compliance" ON public.ocs_guard_compliance_checks FOR SELECT 
USING (
    public.is_internal_ocs(auth.uid()) 
    OR (
        EXISTS (
            SELECT 1 FROM public.company_users 
            WHERE user_id = auth.uid() AND company_id = ocs_guard_compliance_checks.company_id AND is_company_admin = true
        )
    )
);

CREATE POLICY "Admins can view incidents" ON public.ocs_guard_incidents FOR SELECT 
USING (
    public.is_internal_ocs(auth.uid()) 
    OR (
        EXISTS (
            SELECT 1 FROM public.company_users 
            WHERE user_id = auth.uid() AND company_id = ocs_guard_incidents.company_id AND is_company_admin = true
        )
    )
);
