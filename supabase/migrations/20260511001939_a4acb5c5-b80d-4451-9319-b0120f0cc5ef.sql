-- Expand market_stores with customization fields
ALTER TABLE public.market_stores 
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS policies TEXT;

-- Expand market_products
ALTER TABLE public.market_products 
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'physical', -- 'physical' or 'digital'
ADD COLUMN IF NOT EXISTS is_highlighted BOOLEAN DEFAULT false;

-- Inventory Movements Table
CREATE TABLE IF NOT EXISTS public.market_inventory_movements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.market_products(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'in', 'out', 'adjustment'
    quantity INTEGER NOT NULL,
    reason TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Store Settings Table (Granular)
CREATE TABLE IF NOT EXISTS public.market_store_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.market_stores(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(store_id, key)
);

-- Customer Addresses
CREATE TABLE IF NOT EXISTS public.market_addresses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES public.market_customers(id) ON DELETE CASCADE,
    label TEXT, -- 'Casa', 'Trabalho'
    street TEXT NOT NULL,
    number TEXT NOT NULL,
    complement TEXT,
    neighborhood TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Internal Messages for Orders
CREATE TABLE IF NOT EXISTS public.market_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.market_orders(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update RLS for isolation
ALTER TABLE public.market_inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_messages ENABLE ROW LEVEL SECURITY;

-- Policies for Stores (Each company manages its own store)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Vendedores gerenciam sua propria loja') THEN
        CREATE POLICY "Vendedores gerenciam sua propria loja" ON public.market_stores
        FOR ALL USING (organization_id::text IN (SELECT company_id::text FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin_ocs');
    END IF;
END $$;

-- Policies for Products (Only own store products)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Vendedores gerenciam seus produtos') THEN
        CREATE POLICY "Vendedores gerenciam seus produtos" ON public.market_products
        FOR ALL USING (store_id IN (SELECT id FROM public.market_stores WHERE organization_id::text IN (SELECT company_id::text FROM public.profiles WHERE id = auth.uid())) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin_ocs');
    END IF;
END $$;
