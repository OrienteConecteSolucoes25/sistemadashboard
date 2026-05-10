-- 1. Categorias e Prioridades (Enums implícitos via check constraints)
CREATE TABLE public.ti_tickets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    company_id UUID,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('acesso', 'erro_sistema', 'lentidao', 'integracao', 'infraestrutura', 'seguranca', 'treinamento', 'melhoria')),
    priority TEXT NOT NULL CHECK (priority IN ('baixa', 'media', 'alta', 'critica')),
    status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_analise', 'aguardando_usuario', 'em_execucao', 'resolvido', 'cancelado')),
    diagnostic_info JSONB, -- Respostas do diagnóstico inteligente
    assigned_to UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Base de Conhecimento
CREATE TABLE public.ti_knowledge_base (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Ativos de TI
CREATE TABLE public.ti_assets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id), -- Responsável atual
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('computador', 'celular', 'impressora', 'software', 'acesso_externo')),
    serial_number TEXT,
    specification JSONB,
    status TEXT NOT NULL DEFAULT 'ativo',
    warranty_until DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Solicitações de Acesso
CREATE TABLE public.ti_access_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    company_id UUID NOT NULL,
    module_key TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('criacao', 'alteracao', 'remocao')),
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.ti_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ti_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ti_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ti_access_requests ENABLE ROW LEVEL SECURITY;

-- Políticas: Usuários veem seus próprios chamados, Admins veem tudo da empresa.
CREATE POLICY "Users view own tickets" ON public.ti_tickets FOR SELECT USING (auth.uid() = user_id OR public.is_internal_ocs(auth.uid()));
CREATE POLICY "Users create tickets" ON public.ti_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage tickets" ON public.ti_tickets FOR ALL USING (public.is_internal_ocs(auth.uid()));

CREATE POLICY "Knowledge base viewable by all" ON public.ti_knowledge_base FOR SELECT USING (true);

CREATE POLICY "Users view own assets" ON public.ti_assets FOR SELECT USING (auth.uid() = user_id OR public.is_internal_ocs(auth.uid()));

CREATE POLICY "Access requests policy" ON public.ti_access_requests FOR SELECT USING (auth.uid() = user_id OR public.is_internal_ocs(auth.uid()));
CREATE POLICY "Access requests create" ON public.ti_access_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
