-- IT Module Schema Consolidation

-- 1. Synchronize ti_tickets
ALTER TABLE public.ti_tickets ADD COLUMN IF NOT EXISTS module_key TEXT;
ALTER TABLE public.ti_tickets ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.ti_tickets ADD COLUMN IF NOT EXISTS attachments TEXT[];

-- 2. Synchronize ti_assets (mapping existing columns)
ALTER TABLE public.ti_assets ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE public.ti_assets ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.ti_assets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 3. Synchronize ti_knowledge_base
ALTER TABLE public.ti_knowledge_base ADD COLUMN IF NOT EXISTS attachments TEXT[];
ALTER TABLE public.ti_knowledge_base ADD COLUMN IF NOT EXISTS tags TEXT[];

-- 4. Create Support Tables
CREATE TABLE IF NOT EXISTS public.ti_ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.ti_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    attachments TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ti_ticket_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.ti_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ti_security_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    description TEXT NOT NULL,
    involved_user_id UUID REFERENCES auth.users(id),
    evidence_urls TEXT[],
    actions_taken TEXT,
    status TEXT NOT NULL DEFAULT 'aberto',
    responsible_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- RLS & Helpers
CREATE OR REPLACE FUNCTION public.ti_is_it_staff() RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_app_meta_data->>'role' = 'admin' OR raw_app_meta_data->>'is_super_admin' = 'true'))
    OR EXISTS (SELECT 1 FROM public.module_visibility_settings WHERE module_key = 'ti' AND (settings->'admins')::jsonb ? auth.uid()::text)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies (using idempotent checks)
DO $$ 
BEGIN
    -- Comments
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ti_comments_all_staff') THEN
        ALTER TABLE public.ti_ticket_comments ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "ti_comments_all_staff" ON public.ti_ticket_comments FOR SELECT USING (public.ti_is_it_staff() OR user_id = auth.uid() OR EXISTS(SELECT 1 FROM public.ti_tickets WHERE id = ticket_id AND (user_id = auth.uid() OR assigned_to = auth.uid())));
        CREATE POLICY "ti_comments_insert_user" ON public.ti_ticket_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Security
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ti_security_all_staff') THEN
        ALTER TABLE public.ti_security_incidents ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "ti_security_all_staff" ON public.ti_security_incidents FOR ALL USING (public.ti_is_it_staff());
    END IF;
    
    -- Ensure other tables have RLS enabled
    ALTER TABLE public.ti_tickets ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.ti_assets ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.ti_knowledge_base ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.ti_access_requests ENABLE ROW LEVEL SECURITY;
END $$;
