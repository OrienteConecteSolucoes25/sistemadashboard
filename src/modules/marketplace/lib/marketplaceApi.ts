import { supabase } from "@/integrations/supabase/client";
import { jarbasCore } from "../../jarbas/core/jarbasCore";

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

export interface MarketplaceCustomer {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
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

export async function getMarketplaceCustomers() {
  const { data, error } = await supabase
    .from('market_customers' as any)
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as unknown as MarketplaceCustomer[];
}

export async function createMarketplaceProduct(product: Partial<MarketplaceProduct>) {
  const { data, error } = await supabase
    .from('market_products')
    .insert([product as any])
    .select()
    .single();
  
  if (error) throw error;
  return data as MarketplaceProduct;
}

export async function updateMarketplaceProduct(id: string, updates: Partial<MarketplaceProduct>) {
  const { data, error } = await supabase
    .from('market_products')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as MarketplaceProduct;
}

export async function deleteMarketplaceProduct(id: string) {
  const { error } = await supabase
    .from('market_products')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

export async function createMarketplaceOrder(orderData: {
  customer_id: string;
  items: { product_id: string; quantity: number; unit_price: number }[];
  total_amount: number;
  payment_method?: string;
}) {
  const { data: order, error: orderError } = await supabase
    .from('market_orders' as any)
    .insert([{
      customer_id: orderData.customer_id,
      total_amount: orderData.total_amount,
      status: 'pending',
      payment_method: orderData.payment_method || 'credit_card'
    }])
    .select()
    .single();

  if (orderError) throw orderError;

  const itemsToInsert = orderData.items.map(item => ({
    order_id: (order as any).id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.unit_price * item.quantity
  }));

  const { error: itemsError } = await supabase
    .from('market_order_items' as any)
    .insert(itemsToInsert);

  if (itemsError) throw itemsError;

  // Notificar Jarbas sobre a nova venda
  jarbasCore.registerEvent({
    module: "marketplace",
    type: "new_order",
    title: `Venda Realizada: R$ ${orderData.total_amount.toFixed(2)}`,
    description: `Um novo pedido foi gerado no Marketplace. Cliente ID: ${orderData.customer_id}`,
    severity: "low"
  });

  return order;
}

