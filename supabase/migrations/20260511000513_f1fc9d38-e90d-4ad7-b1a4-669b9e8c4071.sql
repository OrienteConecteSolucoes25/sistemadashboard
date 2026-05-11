-- Create Jarbas Vision Tables
CREATE TABLE public.jarbas_vision_analysis (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    user_id UUID NOT NULL,
    image_url TEXT NOT NULL,
    analysis_type TEXT NOT NULL, -- e.g., 'safety_epi', 'construction_quality', 'equipment_check'
    detected_objects JSONB, -- List of detected items, EPIs, or anomalies
    confidence_score DECIMAL,
    ai_feedback TEXT,
    status TEXT DEFAULT 'processed', -- 'processing', 'processed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.jarbas_visual_validations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    analysis_id UUID REFERENCES public.jarbas_vision_analysis(id) ON DELETE CASCADE,
    is_compliant BOOLEAN NOT NULL,
    discrepancy_details TEXT,
    required_standard TEXT, -- Reference to the standard or blueprint
    validated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jarbas_vision_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jarbas_visual_validations ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Users can view vision analysis for their company" ON public.jarbas_vision_analysis
    FOR SELECT USING (true);

CREATE POLICY "Users can view visual validations" ON public.jarbas_visual_validations
    FOR SELECT USING (true);
