-- Tabela de Memória Operacional
CREATE TABLE IF NOT EXISTS public.jarbas_operational_memory (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Logs de Segurança e Governança
CREATE TABLE IF NOT EXISTS public.jarbas_safety_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    company_id UUID,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    module_key TEXT,
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Padrões de Treinamento (Aprendizado)
CREATE TABLE IF NOT EXISTS public.jarbas_training_patterns (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pattern_type TEXT NOT NULL, -- e.g., 'common_error', 'optimized_workflow'
    module_key TEXT,
    description TEXT,
    frequency INTEGER DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Atualizar Contexto Operacional
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jarbas_operational_context' AND column_name = 'current_module') THEN
        ALTER TABLE public.jarbas_operational_context ADD COLUMN current_module TEXT;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.jarbas_operational_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jarbas_safety_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jarbas_training_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own memory" 
ON public.jarbas_operational_memory 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own safety logs" 
ON public.jarbas_safety_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Trigger para updated_at na memória
CREATE TRIGGER update_jarbas_memory_updated_at
BEFORE UPDATE ON public.jarbas_operational_memory
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_generic();

CREATE TRIGGER update_jarbas_training_patterns_updated_at
BEFORE UPDATE ON public.jarbas_training_patterns
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_generic();
