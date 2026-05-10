-- Categorias de Marketplace
CREATE TABLE IF NOT EXISTS public.market_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.market_categories(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Lojas/Vendedores (vinculado a companies do ERP)
CREATE TABLE IF NOT EXISTS public.market_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) UNIQUE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    commission_rate NUMERIC(5,2) DEFAULT 0,
    status TEXT DEFAULT 'active', -- active, inactive, suspended
    rating NUMERIC(3,2) DEFAULT 5.0,
    contact_email TEXT,
    contact_phone TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Produtos
CREATE TABLE IF NOT EXISTS public.market_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.market_stores(id),
    category_id UUID REFERENCES public.market_categories(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    promo_price NUMERIC(12,2),
    sku TEXT,
    stock_quantity INTEGER DEFAULT 0,
    min_stock_alert INTEGER DEFAULT 5,
    images TEXT[] DEFAULT '{}',
    specifications JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_digital BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Clientes do Marketplace (pode ser diferente de users do sistema)
CREATE TABLE IF NOT EXISTS public.market_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id), -- Opcional se for cliente externo
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    document TEXT, -- CPF/CNPJ
    address JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pedidos
CREATE TABLE IF NOT EXISTS public.market_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.market_customers(id),
    store_id UUID NOT NULL REFERENCES public.market_stores(id),
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    shipping_cost NUMERIC(12,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, processing, paid, shipped, delivered, cancelled
    payment_method TEXT,
    payment_status TEXT DEFAULT 'unpaid',
    shipping_address JSONB NOT NULL,
    tracking_code TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Itens do Pedido
CREATE TABLE IF NOT EXISTS public.market_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.market_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.market_products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_purchase NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Cupons
CREATE TABLE IF NOT EXISTS public.market_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.market_stores(id), -- null para cupons globais
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL, -- percentage, fixed
    value NUMERIC(12,2) NOT NULL,
    min_purchase_amount NUMERIC(12,2) DEFAULT 0,
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Movimentação de Estoque
CREATE TABLE IF NOT EXISTS public.market_inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.market_products(id),
    quantity INTEGER NOT NULL,
    type TEXT NOT NULL, -- entry, exit, sale, adjustment, return
    reference_id UUID, -- UUID do pedido, por exemplo
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Mensagens de Atendimento
CREATE TABLE IF NOT EXISTS public.market_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.market_orders(id),
    store_id UUID NOT NULL REFERENCES public.market_stores(id),
    customer_id UUID NOT NULL REFERENCES public.market_customers(id),
    sender_type TEXT NOT NULL, -- store, customer, system
    message TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.market_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso (Select liberado para visualização pública)
CREATE POLICY "Acesso público as categorias" ON public.market_categories FOR SELECT USING (true);
CREATE POLICY "Acesso público as lojas" ON public.market_stores FOR SELECT USING (true);
CREATE POLICY "Acesso público aos produtos ativos" ON public.market_products FOR SELECT USING (is_active = true);

-- Inserir permissões no catálogo ACL centralizado
INSERT INTO public.acl_permissions_catalog (key, module, resource, action, label, description, ordem)
VALUES 
('marketplace.dashboard.visualizar', 'marketplace', 'dashboard', 'visualizar', 'Ver Dashboard Comercial', 'Permite visualizar métricas e faturamento', 1),
('marketplace.produtos.visualizar', 'marketplace', 'produtos', 'visualizar', 'Ver Produtos', 'Permite listar produtos da loja', 2),
('marketplace.produtos.editar', 'marketplace', 'produtos', 'editar', 'Gerenciar Produtos', 'Permite criar, editar e excluir produtos', 3),
('marketplace.pedidos.visualizar', 'marketplace', 'pedidos', 'visualizar', 'Ver Pedidos', 'Permite visualizar pedidos recebidos', 4),
('marketplace.pedidos.editar', 'marketplace', 'pedidos', 'editar', 'Gerenciar Pedidos', 'Permite atualizar status de pedidos', 5),
('marketplace.estoque.visualizar', 'marketplace', 'estoque', 'visualizar', 'Ver Estoque', 'Permite visualizar níveis de estoque', 6),
('marketplace.estoque.editar', 'marketplace', 'estoque', 'editar', 'Gerenciar Estoque', 'Permite realizar movimentações manuais', 7),
('marketplace.configuracoes.editar', 'marketplace', 'configuracoes', 'editar', 'Configurar Loja', 'Permite alterar dados da loja, logo e banner', 8),
('marketplace.clientes.visualizar', 'marketplace', 'clientes', 'visualizar', 'Ver Clientes', 'Permite visualizar base de clientes', 9),
('marketplace.cupons.editar', 'marketplace', 'cupons', 'editar', 'Gerenciar Cupons', 'Permite criar e editar cupons de desconto', 10)
ON CONFLICT (key) DO NOTHING;
