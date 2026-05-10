-- Enum for AI Action Classifications
DO $$ BEGIN
    CREATE TYPE public.ai_action_classification AS ENUM (
        'informativa', 
        'operacional', 
        'administrativa', 
        'critica'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AI Governance Logs Table
CREATE TABLE IF NOT EXISTS public.ai_governance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    user_id UUID NOT NULL,
    agent_name TEXT NOT NULL, -- 'Jarbas', 'OCS Guard', 'TI Agent', etc.
    classification public.ai_action_classification DEFAULT 'informativa',
    module TEXT NOT NULL,
    prompt_text TEXT,
    response_text TEXT,
    action_executed TEXT,
    impact_description TEXT,
    is_automated BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT false,
    approval_status TEXT DEFAULT 'not_required', -- 'not_required', 'pending', 'approved', 'rejected'
    approved_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_governance_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users see their company's AI logs, OCS admins see all
CREATE POLICY "Company users can view their AI governance logs" 
ON public.ai_governance_logs 
FOR SELECT 
USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) 
    OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_ocs', 'root_ocs')
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_ai_gov_company ON public.ai_governance_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_gov_classification ON public.ai_governance_logs(classification);
