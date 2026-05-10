-- IT Tickets Table
CREATE TABLE IF NOT EXISTS public.it_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number SERIAL,
    company_id UUID NOT NULL,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'acesso', 'sistema', 'lentidao', 'permissoes', 'infra', 'seguranca', etc.
    priority TEXT NOT NULL DEFAULT 'media', -- 'baixa', 'media', 'alta', 'critica'
    status TEXT NOT NULL DEFAULT 'aberto', -- 'aberto', 'em_analise', 'aguardando_usuario', 'em_execucao', 'resolvido', 'cancelado'
    technician_id UUID,
    module_affected TEXT,
    sla_deadline TIMESTAMPTZ,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    rating_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- Ticket Comments/History
CREATE TABLE IF NOT EXISTS public.it_ticket_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.it_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    comment_text TEXT,
    old_status TEXT,
    new_status TEXT,
    attachment_urls TEXT[],
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- IT Assets Table
CREATE TABLE IF NOT EXISTS public.it_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'pc', 'notebook', 'mobile', 'server', 'network', 'software'
    serial_number TEXT,
    patrimony_tag TEXT,
    responsible_user_id UUID,
    status TEXT DEFAULT 'disponivel', -- 'disponivel', 'em_uso', 'manutencao', 'descartado'
    warranty_until DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Knowledge Base Articles
CREATE TABLE IF NOT EXISTS public.it_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID, -- NULL means global/public to all clients
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    tags TEXT[],
    author_id UUID NOT NULL,
    views_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Access Requests Table
CREATE TABLE IF NOT EXISTS public.it_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    requester_id UUID NOT NULL,
    target_user_id UUID,
    module_name TEXT NOT NULL,
    access_level TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_by UUID,
    approval_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- SLA Configuration Table (Global/Per Company)
CREATE TABLE IF NOT EXISTS public.it_sla_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID, -- NULL for default OCS SLA
    priority TEXT UNIQUE,
    response_time_hours INTEGER,
    resolution_time_hours INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Default SLA Seed
INSERT INTO public.it_sla_config (priority, resolution_time_hours) VALUES 
('baixa', 72),
('media', 48),
('alta', 24),
('critica', 4)
ON CONFLICT (priority) DO UPDATE SET resolution_time_hours = EXCLUDED.resolution_time_hours;

-- Enable RLS
ALTER TABLE public.it_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_ticket_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_access_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Strict isolation for IT Tickets" 
ON public.it_tickets FOR ALL USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) 
    OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_ocs', 'root_ocs', 'supervisor_interno')
);

CREATE POLICY "Strict isolation for Ticket Updates" 
ON public.it_ticket_updates FOR ALL USING (
    ticket_id IN (SELECT id FROM public.it_tickets)
);

CREATE POLICY "Isolation for IT Assets" 
ON public.it_assets FOR ALL USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) 
    OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_ocs', 'root_ocs')
);

CREATE POLICY "Visibility for KB Articles" 
ON public.it_knowledge_base FOR SELECT USING (
    company_id IS NULL 
    OR 
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- Function to set SLA deadline automatically
CREATE OR REPLACE FUNCTION public.set_it_ticket_sla() RETURNS TRIGGER AS $$
DECLARE
    v_sla_hours INTEGER;
BEGIN
    SELECT resolution_time_hours INTO v_sla_hours 
    FROM public.it_sla_config 
    WHERE priority = NEW.priority 
    AND (company_id = NEW.company_id OR company_id IS NULL)
    ORDER BY company_id DESC NULLS LAST LIMIT 1;

    IF v_sla_hours IS NOT NULL THEN
        NEW.sla_deadline := now() + (v_sla_hours || ' hours')::interval;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_it_ticket_sla BEFORE INSERT ON public.it_tickets FOR EACH ROW EXECUTE FUNCTION public.set_it_ticket_sla();
