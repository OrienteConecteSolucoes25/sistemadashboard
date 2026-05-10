-- Módulo Financeiro OCS

-- 1. Perfis Financeiros (PF, PJ, Corporativo)
CREATE TYPE public.financial_profile_type AS ENUM ('personal', 'business_small', 'corporate');

CREATE TABLE public.fin_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    company_id UUID REFERENCES public.companies(id),
    type public.financial_profile_type NOT NULL DEFAULT 'personal',
    name TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Contas Bancárias e Cartões
CREATE TABLE public.fin_bank_accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.fin_profiles(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_type TEXT NOT NULL, -- 'corrente', 'poupanca', 'investimento'
    currency TEXT DEFAULT 'BRL',
    balance NUMERIC(15,2) DEFAULT 0,
    open_finance_id TEXT, -- Preparação para integração
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.fin_credit_cards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.fin_profiles(id) ON DELETE CASCADE,
    bank_account_id UUID REFERENCES public.fin_bank_accounts(id),
    name TEXT NOT NULL,
    brand TEXT,
    limit_amount NUMERIC(15,2),
    closing_day INTEGER,
    due_day INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Categorias e Centros de Custo
CREATE TABLE public.fin_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.fin_profiles(id) ON DELETE CASCADE, -- null = global
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT,
    color TEXT,
    parent_id UUID REFERENCES public.fin_categories(id),
    is_system BOOLEAN DEFAULT false
);

CREATE TABLE public.fin_cost_centers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    name TEXT NOT NULL,
    code TEXT,
    budget_limit NUMERIC(15,2),
    is_active BOOLEAN DEFAULT true
);

-- 4. Transações (Entradas/Saídas)
CREATE TABLE public.fin_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.fin_profiles(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.fin_bank_accounts(id),
    category_id UUID REFERENCES public.fin_categories(id),
    cost_center_id UUID REFERENCES public.fin_cost_centers(id),
    credit_card_id UUID REFERENCES public.fin_credit_cards(id),
    description TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'canceled')),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    is_recurring BOOLEAN DEFAULT false,
    recurring_period TEXT,
    attachment_url TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Contas a Pagar / Receber
CREATE TABLE public.fin_bills (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.fin_profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('payable', 'receivable')),
    title TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'canceled')),
    category_id UUID REFERENCES public.fin_categories(id),
    supplier_customer_id UUID, -- Referência a contatos (futuro)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Metas e Dívidas (Pessoa Física)
CREATE TABLE public.fin_goals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.fin_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(15,2) NOT NULL,
    current_amount NUMERIC(15,2) DEFAULT 0,
    deadline DATE,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.fin_debts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.fin_profiles(id) ON DELETE CASCADE,
    creditor TEXT NOT NULL,
    total_amount NUMERIC(15,2) NOT NULL,
    interest_rate NUMERIC(5,2),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.fin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own profiles" ON public.fin_profiles FOR ALL USING (auth.uid() = user_id OR public.is_internal_ocs(auth.uid()));
CREATE POLICY "Users access own transactions" ON public.fin_transactions FOR ALL USING (EXISTS (SELECT 1 FROM public.fin_profiles p WHERE p.id = fin_transactions.profile_id AND p.user_id = auth.uid()) OR public.is_internal_ocs(auth.uid()));
CREATE POLICY "Users access own bills" ON public.fin_bills FOR ALL USING (EXISTS (SELECT 1 FROM public.fin_profiles p WHERE p.id = fin_bills.profile_id AND p.user_id = auth.uid()) OR public.is_internal_ocs(auth.uid()));
CREATE POLICY "Users access own goals" ON public.fin_goals FOR ALL USING (EXISTS (SELECT 1 FROM public.fin_profiles p WHERE p.id = fin_goals.profile_id AND p.user_id = auth.uid()) OR public.is_internal_ocs(auth.uid()));
