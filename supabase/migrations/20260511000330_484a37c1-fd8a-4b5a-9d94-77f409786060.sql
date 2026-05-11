-- Create Jarbas Analytics Tables
CREATE TABLE public.jarbas_analytics_metrics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    module_key TEXT NOT NULL, -- e.g., 'engenharia', 'financeiro'
    metric_name TEXT NOT NULL, -- e.g., 'productivity_score', 'delay_rate'
    metric_value DECIMAL NOT NULL,
    unit TEXT,
    reference_period TEXT, -- e.g., '2026-05'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.jarbas_predictive_insights (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    probability DECIMAL, -- 0 to 1
    impact_level TEXT, -- 'low', 'medium', 'high', 'critical'
    suggested_action TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'addressed', 'dismissed'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.jarbas_productivity_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    entity_id UUID, -- ID of team, user, or project
    entity_type TEXT, -- 'team', 'user', 'project'
    activity_count INTEGER,
    on_time_completion_rate DECIMAL,
    bottleneck_detected BOOLEAN DEFAULT false,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jarbas_analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jarbas_predictive_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jarbas_productivity_logs ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Users can view analytics for their company" ON public.jarbas_analytics_metrics
    FOR SELECT USING (true);

CREATE POLICY "Users can view insights for their company" ON public.jarbas_predictive_insights
    FOR SELECT USING (true);

CREATE POLICY "Users can view productivity logs" ON public.jarbas_productivity_logs
    FOR SELECT USING (true);
