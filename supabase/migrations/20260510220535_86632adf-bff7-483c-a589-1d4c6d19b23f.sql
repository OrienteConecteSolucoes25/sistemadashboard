-- Jarbas OCS: Tabelas de Suporte Operacional

-- 1. Documentos de Instrução Operacional (Base de conhecimento para o Jarbas)
CREATE TABLE public.jarbas_instruction_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    module_key TEXT NOT NULL, -- 'engenharia', 'seguranca', etc.
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Texto extraído ou digitado
    document_type TEXT DEFAULT 'procedimento', -- 'norma', 'instrucao', 'risco'
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Checklists Operacionais Guiados
CREATE TABLE public.jarbas_checklists (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    module_key TEXT NOT NULL,
    steps JSONB NOT NULL, -- Array de objetos: { "question": "string", "type": "voice_confirm|photo|number", "required_epi": [] }
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Memória Operacional e Contexto (O que o usuário está fazendo agora)
CREATE TABLE public.jarbas_operational_context (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    company_id UUID,
    active_os_id TEXT, -- ID da Ordem de Serviço atual
    active_activity TEXT, -- Nome da atividade (ex: 'Instalação Elétrica')
    current_step_index INTEGER DEFAULT 0,
    checklist_id UUID REFERENCES public.jarbas_checklists(id),
    last_location JSONB, -- { "lat": number, "lng": number }
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Logs de Interação por Voz e Comandos
CREATE TABLE public.jarbas_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    command TEXT,
    response TEXT,
    was_voice BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.jarbas_instruction_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jarbas_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jarbas_operational_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jarbas_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view instructions" ON public.jarbas_instruction_documents FOR SELECT USING (true);
CREATE POLICY "Everyone can view checklists" ON public.jarbas_checklists FOR SELECT USING (true);
CREATE POLICY "Users view their own context" ON public.jarbas_operational_context FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view their own logs" ON public.jarbas_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create their logs" ON public.jarbas_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
