-- Enum for Trust Entities
DO $$ BEGIN
    CREATE TYPE public.trust_entity_type AS ENUM (
        'user', 
        'company', 
        'integration', 
        'device', 
        'module'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Trust Scores Table
CREATE TABLE IF NOT EXISTS public.security_trust_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    entity_id UUID NOT NULL, -- references profiles.id, company_id, etc.
    entity_type public.trust_entity_type NOT NULL,
    trust_score INTEGER DEFAULT 100, -- 0 to 100
    risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    behavior_points INTEGER DEFAULT 0,
    failed_attempts INTEGER DEFAULT 0,
    incident_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMPTZ DEFAULT now(),
    risk_factors JSONB DEFAULT '[]', -- List of reasons for score reduction
    metadata JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_trust_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Strict isolation for trust scores" 
ON public.security_trust_scores 
FOR SELECT 
USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) 
    OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_ocs', 'root_ocs')
);

-- Function to update trust score based on behavior
CREATE OR REPLACE FUNCTION public.update_entity_trust_score(
    p_entity_id UUID,
    p_entity_type public.trust_entity_type,
    p_point_change INTEGER,
    p_risk_factor TEXT
) RETURNS VOID AS $$
DECLARE
    v_company_id UUID;
BEGIN
    -- Get company_id based on entity type (simplified)
    SELECT company_id INTO v_company_id FROM public.profiles WHERE id = auth.uid();

    INSERT INTO public.security_trust_scores (company_id, entity_id, entity_type, trust_score, risk_factors)
    VALUES (v_company_id, p_entity_id, p_entity_type, 100 + p_point_change, jsonb_build_array(p_risk_factor))
    ON CONFLICT (entity_id) DO UPDATE SET
        trust_score = GREATEST(0, LEAST(100, security_trust_scores.trust_score + p_point_change)),
        risk_factors = security_trust_scores.risk_factors || jsonb_build_array(p_risk_factor),
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
