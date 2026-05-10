-- Módulo Marketplace OCS

-- 1. Categorias de Produtos
CREATE TABLE public.market_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    parent_id UUID REFERENCES public.market_categories(id),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Lojas (Vendedores) - Vinculadas às empresas do ERP
CREATE TABLE public.market_stores (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    commission_rate NUMERIC(5,2) DEFAULT 10.00, -- Taxa do marketplace
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'blocked')),
    rating NUMERIC(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Produtos
CREATE TABLE public.market_products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.market_stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.market_categories(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL,
    promo_price NUMERIC(12,2),
    sku TEXT,
    stock_quantity INTEGER DEFAULT 0,
    min_stock_alert INTEGER DEFAULT 5,
    images TEXT[], -- Array de URLs
    specifications JSONB, -- Variações, tamanhos, cores
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Carrinhos (Persistência para usuários logados)
CREATE TABLE public.market_carts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    items JSONB DEFAULT '[]', -- [{product_id, quantity, price}]
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Pedidos
CREATE TABLE public.market_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    store_id UUID REFERENCES public.market_stores(id),
    total_amount NUMERIC(12,2) NOT NULL,
    shipping_cost NUMERIC(12,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'canceled')),
    payment_method TEXT,
    shipping_address JSONB,
    tracking_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Itens do Pedido
CREATE TABLE public.market_order_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.market_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.market_products(id),
    quantity INTEGER NOT NULL,
    price_at_purchase NUMERIC(12,2) NOT NULL
);

-- RLS
ALTER TABLE public.market_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_orders ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Public categories" ON public.market_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public products" ON public.market_products FOR SELECT USING (is_active = true);
CREATE POLICY "Users manage own cart" ON public.market_carts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own orders" ON public.market_orders FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.market_stores s WHERE s.id = market_orders.store_id AND public.is_company_admin(auth.uid(), s.company_id)
));
