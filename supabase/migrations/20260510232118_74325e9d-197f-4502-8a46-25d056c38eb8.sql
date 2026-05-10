-- Drop existing tables to start clean (since they have no data yet)
DROP TABLE IF EXISTS public.market_inventory_movements CASCADE;
DROP TABLE IF EXISTS public.market_coupons CASCADE;
DROP TABLE IF EXISTS public.market_messages CASCADE;
DROP TABLE IF EXISTS public.market_order_items CASCADE;
DROP TABLE IF EXISTS public.market_orders CASCADE;
DROP TABLE IF EXISTS public.market_products CASCADE;
DROP TABLE IF EXISTS public.market_categories CASCADE;
DROP TABLE IF EXISTS public.market_carts CASCADE;
DROP TABLE IF EXISTS public.market_customers CASCADE;
DROP TABLE IF EXISTS public.market_stores CASCADE;

-- Marketplace Stores (linked to ERP Organizations)
CREATE TABLE public.market_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product Categories
CREATE TABLE public.market_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.market_stores(id), 
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    icon TEXT,
    parent_id UUID REFERENCES public.market_categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Products
CREATE TABLE public.market_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.market_stores(id),
    category_id UUID REFERENCES public.market_categories(id),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    promo_price DECIMAL(12,2),
    sku TEXT,
    stock_quantity INTEGER DEFAULT 0,
    min_stock_alert INTEGER DEFAULT 5,
    images TEXT[],
    tags TEXT[],
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Customers
CREATE TABLE public.market_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders
CREATE TABLE public.market_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.market_stores(id),
    customer_id UUID NOT NULL REFERENCES public.market_customers(id),
    status TEXT NOT NULL DEFAULT 'novo', -- 'novo', 'aguardando_pagamento', 'pago', 'separando', 'enviado', 'entregue', 'cancelado'
    total_amount DECIMAL(12,2) NOT NULL,
    shipping_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    tracking_code TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order Items
CREATE TABLE public.market_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.market_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.market_products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Coupons
CREATE TABLE public.market_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.market_stores(id),
    code TEXT NOT NULL,
    type TEXT NOT NULL, -- 'percent', 'fixed'
    value DECIMAL(12,2) NOT NULL,
    min_purchase DECIMAL(12,2) DEFAULT 0,
    valid_until TIMESTAMPTZ,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(store_id, code)
);

-- Enable RLS
ALTER TABLE public.market_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_coupons ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Market stores public select" ON public.market_stores FOR SELECT USING (is_active = true);
CREATE POLICY "Market stores admin all" ON public.market_stores FOR ALL USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_ocs', 'root_ocs')
);

CREATE POLICY "Market categories public select" ON public.market_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Market categories admin all" ON public.market_categories FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_ocs', 'root_ocs')
);

CREATE POLICY "Market products public select" ON public.market_products FOR SELECT USING (is_active = true);
CREATE POLICY "Market products admin all" ON public.market_products FOR ALL USING (
    store_id IN (SELECT id FROM public.market_stores WHERE organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
    OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_ocs', 'root_ocs')
);

CREATE POLICY "Market orders admin all" ON public.market_orders FOR ALL USING (
    store_id IN (SELECT id FROM public.market_stores WHERE organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
    OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_ocs', 'root_ocs')
);
