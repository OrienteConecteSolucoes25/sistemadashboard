-- Organization Hierarchy Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    plan_type TEXT DEFAULT 'free', -- 'free', 'pro', 'enterprise'
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Platform Global Settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID
);

-- Update profiles for Organization support
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Immutable Enterprise Audit (Cadeia de Custódia)
CREATE TABLE IF NOT EXISTS public.enterprise_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL,
    event_code TEXT NOT NULL, -- e.g., 'AUTH_001', 'DATA_005'
    module_name TEXT NOT NULL,
    details JSONB,
    severity INTEGER DEFAULT 1, -- 1-5 (5=Critical)
    ip_hash TEXT, -- Obfuscated IP
    integrity_signature TEXT, -- Placeholder for blockchain or HMAC signature
    created_at TIMESTAMPTZ DEFAULT now()
) WITH (OIDS=FALSE);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_audit_trail ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Enterprise Isolation
CREATE POLICY "Global Admins see all organizations" 
ON public.organizations 
FOR ALL 
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_ocs', 'root_ocs')
);

CREATE POLICY "Org members see their own organization" 
ON public.organizations 
FOR SELECT 
USING (
    id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Platform settings only accessible to OCS Admins" 
ON public.platform_settings 
FOR ALL 
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_ocs', 'root_ocs')
);

CREATE POLICY "Enterprise audit isolation" 
ON public.enterprise_audit_trail 
FOR SELECT 
USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_ocs', 'root_ocs')
);

-- Automate Enterprise Auditing
CREATE OR REPLACE FUNCTION public.proc_enterprise_audit_log() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.enterprise_audit_trail (
        organization_id,
        user_id,
        event_code,
        module_name,
        details,
        severity
    ) VALUES (
        COALESCE(NEW.company_id, (SELECT organization_id FROM public.profiles WHERE id = auth.uid())),
        auth.uid(),
        'UPDATE_RECORD',
        TG_TABLE_NAME,
        jsonb_build_object('table', TG_TABLE_NAME, 'op', TG_OP),
        2
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
