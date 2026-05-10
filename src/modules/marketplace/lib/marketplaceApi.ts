import { supabase } from "@/integrations/supabase/client";

export interface MarketplaceStore {
  id: string;
  organization_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  settings: any;
  is_active: boolean;
  created_at: string;
}

export interface MarketplaceProduct {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  promo_price: number | null;
  sku: string | null;
  stock_quantity: number;
  min_stock_alert: number;
  images: string[] | null;
  tags: string[] | null;
  is_featured: boolean;
  is_active: boolean;
  market_stores?: { name: string };
  market_categories?: { name: string };
}

export interface MarketplaceCategory {
  id: string;
  store_id: string | null;
  name: string;
  slug: string;
  icon: string | null;
  parent_id: string | null;
  is_active: boolean;
}

export async function getMarketplaceProducts(limit = 12, storeId?: string) {
  let query = supabase
    .from('market_products')
    .select('*, market_stores(name), market_categories(name)')
    .eq('is_active', true);
  
  if (storeId) {
    query = query.eq('store_id', storeId);
  }
  
  const { data, error } = await query.limit(limit);
  if (error) throw error;
  return data as MarketplaceProduct[];
}

export async function getMarketplaceCategories() {
  const { data, error } = await supabase
    .from('market_categories')
    .select('*')
    .eq('is_active', true);
  
  if (error) throw error;
  return data as MarketplaceCategory[];
}

export async function getMarketplaceStores() {
  const { data, error } = await supabase
    .from('market_stores')
    .select('*')
    .eq('is_active', true);
  
  if (error) throw error;
  return data as MarketplaceStore[];
}
