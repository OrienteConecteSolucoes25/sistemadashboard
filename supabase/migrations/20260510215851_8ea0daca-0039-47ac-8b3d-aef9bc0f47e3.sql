-- Tabela de conversas dos agentes por módulo
CREATE TABLE public.pixel_agent_conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    company_id UUID REFERENCES public.companies(id),
    module_key TEXT NOT NULL, -- 'engenharia', 'juridico', 'rhdp', etc.
    title TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de mensagens dos agentes
CREATE TABLE public.pixel_agent_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.pixel_agent_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user', 'assistant', 'tool'
    content TEXT NOT NULL,
    tool_results JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.pixel_agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pixel_agent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agent conversations"
ON public.pixel_agent_conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agent conversations"
ON public.pixel_agent_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent conversations"
ON public.pixel_agent_conversations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages of their conversations"
ON public.pixel_agent_messages FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.pixel_agent_conversations
    WHERE id = conversation_id AND user_id = auth.uid()
));

CREATE POLICY "Users can insert messages in their conversations"
ON public.pixel_agent_messages FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.pixel_agent_conversations
    WHERE id = conversation_id AND user_id = auth.uid()
));
