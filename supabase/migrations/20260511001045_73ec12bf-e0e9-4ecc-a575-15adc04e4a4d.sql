-- Create Jarbas API Brain Tables
CREATE TABLE public.jarbas_integrations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    provider TEXT NOT NULL, -- 'whatsapp', 'telegram', 'email', 'external_erp', 'crm', 'iot'
    name TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'active', -- 'active', 'inactive', 'error'
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.jarbas_webhooks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'productivity_alert', 'vision_anomaly', 'critical_risk'
    secret_key TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.jarbas_external_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    integration_id UUID REFERENCES public.jarbas_integrations(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'send_message', 'receive_data', 'trigger_automation'
    payload JSONB,
    response JSONB,
    status TEXT, -- 'success', 'failed'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jarbas_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jarbas_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jarbas_external_logs ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Users can view integrations for their company" ON public.jarbas_integrations
    FOR SELECT USING (true);

CREATE POLICY "Users can view webhooks for their company" ON public.jarbas_webhooks
    FOR SELECT USING (true);

CREATE POLICY "Users can view external logs" ON public.jarbas_external_logs
    FOR SELECT USING (true);
