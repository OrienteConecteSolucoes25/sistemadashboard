-- Create Jarbas Training Tables
CREATE TABLE public.training_paths (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT, -- e.g., 'onboarding', 'technical', 'safety'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.training_modules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    path_id UUID REFERENCES public.training_paths(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT, -- Markdown or JSON for the module content
    order_index INTEGER NOT NULL DEFAULT 0,
    estimated_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.training_questions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    module_id UUID REFERENCES public.training_modules(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings/objects
    correct_option_index INTEGER NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.training_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    module_id UUID REFERENCES public.training_modules(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'started', -- 'started', 'completed', 'failed'
    score DECIMAL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.training_user_answers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.training_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.training_questions(id) ON DELETE CASCADE,
    selected_option_index INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.operational_certifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    path_id UUID REFERENCES public.training_paths(id) ON DELETE CASCADE,
    issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expiry_date TIMESTAMP WITH TIME ZONE,
    certificate_code TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' -- 'active', 'expired', 'revoked'
);

-- Enable RLS
ALTER TABLE public.training_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_certifications ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Simplified for the initial structure)
CREATE POLICY "Users can view training paths for their company" ON public.training_paths
    FOR SELECT USING (true); -- Should ideally filter by company_id linked to user

CREATE POLICY "Users can view modules for paths they see" ON public.training_modules
    FOR SELECT USING (true);

CREATE POLICY "Users can view questions for their modules" ON public.training_questions
    FOR SELECT USING (true);

CREATE POLICY "Users can view/create their own sessions" ON public.training_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own answers" ON public.training_user_answers
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.training_sessions 
        WHERE id = session_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can view their own certifications" ON public.operational_certifications
    FOR SELECT USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_training_paths_updated_at
    BEFORE UPDATE ON public.training_paths
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
