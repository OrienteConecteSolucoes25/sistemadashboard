import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  ShoppingCart, 
  User, 
  Heart, 
  ChevronRight, 
  Star, 
  ArrowRight,
  Filter,
  TrendingUp,
  Package,
  Award,
  Loader2,
  Trash2,
  Plus as PlusIcon,
  Minus,
  CheckCircle2,
  CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getMarketplaceProducts, 
  getMarketplaceCategories, 
  createMarketplaceOrder,
  MarketplaceProduct, 
  MarketplaceCategory,
  MarketplaceStore,
  getMarketplaceStores
} from "../lib/marketplaceApi";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CartItem extends MarketplaceProduct {
  quantity: number;
}

export default function MarketplaceHome() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [activeStore, setActiveStore] = useState<MarketplaceStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Cart, 2: Address, 3: Payment, 4: Success
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const addToCart = (product: MarketplaceProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.promo_price || item.price) * item.quantity, 0);

  const handleCheckout = async () => {
    try {
      setIsProcessing(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Você precisa estar logado para comprar");
        return;
      }

      // No mundo real, aqui buscaríamos o customer_id ou criaríamos um
      const { data: customer } = await supabase
        .from('market_customers' as any)
        .select('id')
        .eq('user_id', userData.user.id)
        .maybeSingle();
      
      let customerId = (customer as any)?.id;
      
      if (!customerId) {
        const { data: newCustomer, error: createError } = await supabase
          .from('market_customers' as any)
          .insert([{ 
            user_id: userData.user.id,
            full_name: userData.user.email?.split('@')[0] || 'Cliente',
            email: userData.user.email
          }])
          .select()
          .single();
        
        if (createError) throw createError;
        customerId = (newCustomer as any).id;
      }

      await createMarketplaceOrder({
        customer_id: customerId,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.promo_price || item.price
        })),
        total_amount: cartTotal,
        payment_method: 'credit_card'
      });

      setCheckoutStep(4);
      setCart([]);
    } catch (error: any) {
      toast.error("Erro ao processar pedido: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const loadAddresses = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: customer } = await supabase
        .from('market_customers' as any)
        .select('id')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (customer) {
        const { data } = await supabase
          .from('market_addresses')
          .select('*')
          .eq('customer_id', (customer as any).id);
        
        setAddresses(data || []);
        if (data?.length) setSelectedAddressId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const params = new URLSearchParams(window.location.search);
        const storeSlug = params.get('loja');
        
        let targetStoreId = undefined;
        if (storeSlug) {
          const { data: storeData } = await supabase
            .from('market_stores')
            .select('*')
            .eq('slug', storeSlug)
            .maybeSingle();
          
          if (storeData) {
            setActiveStore(storeData as MarketplaceStore);
            targetStoreId = (storeData as any).id;
          }
        }

        const [prodData, catData] = await Promise.all([
          getMarketplaceProducts(24, targetStoreId),
          getMarketplaceCategories()
        ]);
        
        setProducts(prodData);
        setCategories(catData);
      } catch (error) {
        console.error("Erro ao carregar marketplace:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      className="min-h-screen bg-slate-50 flex flex-col"
      style={{ '--primary': activeStore?.primary_color || '#3b82f6' } as React.CSSProperties}
    >
      {/* Header do Marketplace */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-xl text-primary cursor-pointer" onClick={() => window.location.search = ''}>
            {activeStore?.logo_url ? (
              <img src={activeStore.logo_url} alt={activeStore.name} className="h-8 w-auto" />
            ) : (
              <ShoppingBag className="w-6 h-6" />
            )}
            <span className="hidden sm:inline">{activeStore?.name || "OCS Marketplace"}</span>
          </div>

          <div className="flex-1 max-w-2xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="O que você está procurando hoje?" 
              className="w-full pl-10 h-10 bg-slate-100 border-none focus-visible:ring-primary" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Heart className="w-5 h-5" />
            </Button>
            
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {cart.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-primary">
                      {cart.reduce((s, i) => s + i.quantity, 0)}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md bg-white flex flex-col p-0">
                <SheetHeader className="p-6 border-b">
                  <SheetTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" /> Seu Carrinho
                  </SheetTitle>
                  <SheetDescription>
                    Você tem {cart.length} itens no carrinho.
                  </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 p-6">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
                        <ShoppingBag className="w-10 h-10 text-slate-200" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">Carrinho vazio</h3>
                        <p className="text-sm text-muted-foreground">Adicione produtos para começar.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {cart.map((item) => (
                        <div key={item.id} className="flex gap-4 group">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                            <img src={item.images?.[0]} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 truncate">{item.name}</h4>
                            <p className="text-xs text-muted-foreground mb-2 italic">Vendido por OCS Store</p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-black">
                                {((item.promo_price || item.price) * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </span>
                              <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => updateQuantity(item.id, -1)}>
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => updateQuantity(item.id, 1)}>
                                  <PlusIcon className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {cart.length > 0 && (
                  <div className="p-6 border-t bg-slate-50/50 space-y-4">
                    <div className="flex justify-between items-center font-bold text-slate-900">
                      <span>Total Estimado</span>
                      <span className="text-xl">
                        {cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <Button className="w-full h-12 text-md font-bold" onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); setCheckoutStep(1); loadAddresses(); }}>
                      Finalizar Compra
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-12">
        {/* Banner Principal */}
        <section className="container mx-auto px-4 py-6">
          <div className="relative h-[200px] md:h-[400px] rounded-2xl overflow-hidden bg-gradient-to-r from-primary to-blue-600 flex items-center px-8 md:px-16">
            <div className="relative z-10 text-white max-w-md space-y-4">
              <Badge className="bg-white/20 text-white border-none backdrop-blur-md">Oferta da Semana</Badge>
              <h1 className="text-3xl md:text-5xl font-bold leading-tight">Tecnologia com 30% OFF</h1>
              <p className="text-blue-100 hidden md:block text-lg">Os melhores gadgets e eletrônicos com entrega rápida para todo o Brasil.</p>
              <Button size="lg" variant="secondary" className="font-bold">
                Ver Ofertas <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
            <div className="absolute right-0 bottom-0 top-0 w-1/2 hidden lg:block opacity-20">
               {/* Decoração ou Imagem de fundo */}
               <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80')] bg-cover bg-center" />
            </div>
          </div>
        </section>

        {/* Categorias Rápidas */}
        <section className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" /> Categorias Populares
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <motion.button 
                whileHover={{ y: -5 }}
                key={cat.id || i} 
                className="bg-white p-4 rounded-xl border hover:shadow-md transition-all flex flex-col items-center gap-3 group"
              >
                <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">{cat.icon || "📦"}</span>
                <span className="text-sm font-medium">{cat.name}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Produtos em Destaque */}
        <section className="container mx-auto px-4 py-8">
          <Tabs defaultValue="destaque" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b pb-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Sugestões para Você
              </h2>
              <TabsList className="bg-transparent h-auto p-0 gap-2">
                <TabsTrigger value="destaque" className="rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-white">Em Alta</TabsTrigger>
                <TabsTrigger value="novidades" className="rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-white">Novidades</TabsTrigger>
                <TabsTrigger value="ofertas" className="rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-white">Melhores Ofertas</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="destaque" className="mt-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-muted-foreground animate-pulse font-medium">Sincronizando catálogo...</p>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onAddToCart={() => addToCart(product)} />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center border-2 border-dashed rounded-xl bg-slate-50/50">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-slate-900">Nenhum produto encontrado</h3>
                  <p className="text-muted-foreground">Tente buscar por outro termo ou categoria.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="novidades" className="mt-0">
               <div className="py-20 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                 Carregando novos produtos...
               </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Checkout Modal */}
        <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
          <DialogContent className="sm:max-w-[500px] bg-white p-0 overflow-hidden">
            <AnimatePresence mode="wait">
              {checkoutStep === 1 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6 space-y-6"
                >
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">Checkout OCS</DialogTitle>
                    <DialogDescription>Confirme os detalhes do seu pedido antes de prosseguir.</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-bold">{cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Frete</span>
                        <span className="text-green-600 font-bold uppercase text-[10px]">Simulado</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between">
                        <span className="font-black uppercase tracking-widest text-xs">Total</span>
                        <span className="font-black text-xl text-primary">{cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCheckoutOpen(false)} className="font-bold uppercase text-[10px] tracking-widest">Cancelar</Button>
                    <Button onClick={() => setCheckoutStep(2)} className="flex-1 font-bold uppercase text-[10px] tracking-widest">
                      Próximo: Endereço
                    </Button>
                  </DialogFooter>
                </motion.div>
              )}

              {checkoutStep === 2 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6 space-y-6"
                >
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Endereço de Entrega</DialogTitle>
                    <DialogDescription>Selecione onde deseja receber seus produtos.</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3">
                    {addresses.length > 0 ? (
                      addresses.map((addr) => (
                        <div 
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                        >
                          <p className="font-bold text-sm">{addr.label || 'Endereço'}</p>
                          <p className="text-xs text-muted-foreground">{addr.street}, {addr.number} - {addr.city}/{addr.state}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 border-2 border-dashed rounded-xl">
                        <p className="text-sm text-muted-foreground">Nenhum endereço cadastrado.</p>
                        <Button variant="link" size="sm" className="mt-2">Adicionar Novo</Button>
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setCheckoutStep(1)} className="font-bold uppercase text-[10px]">Voltar</Button>
                    <Button 
                      onClick={() => setCheckoutStep(3)} 
                      disabled={!selectedAddressId && addresses.length > 0} 
                      className="flex-1 font-bold uppercase text-[10px]"
                    >
                      Próximo: Pagamento
                    </Button>
                  </DialogFooter>
                </motion.div>
              )}

              {checkoutStep === 4 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6 space-y-6"
                >
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Pagamento</DialogTitle>
                    <DialogDescription>Simulação de pagamento para o Marketplace OCS.</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border-2 border-primary bg-primary/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-primary" />
                        <span className="font-bold text-sm text-slate-800">Cartão de Crédito (Simulado)</span>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center italic">
                      * Nenhum valor real será cobrado nesta etapa de desenvolvimento.
                    </p>
                  </div>

                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setCheckoutStep(2)} className="font-bold uppercase text-[10px]">Voltar</Button>
                    <Button onClick={handleCheckout} disabled={isProcessing} className="flex-1 font-bold uppercase text-[10px]">
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Finalizar Pedido"}
                    </Button>
                  </DialogFooter>
                </motion.div>
              )}

              {checkoutStep === 3 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-12 flex flex-col items-center text-center gap-6"
                >
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Pedido Confirmado!</h2>
                    <p className="text-slate-500 font-medium mt-2">Seu pedido foi processado com sucesso e a loja já foi notificada.</p>
                  </div>
                  <Button className="w-full h-12 font-bold uppercase text-[10px] tracking-widest" onClick={() => setIsCheckoutOpen(false)}>
                    Voltar para a Loja
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>

        {/* Seção Vendedor */}
        <section className="container mx-auto px-4 py-12">
          <div className="bg-slate-900 rounded-2xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 space-y-6 max-w-xl">
               <h2 className="text-3xl font-bold leading-tight">Comece a vender no maior ecossistema de microempresas.</h2>
               <p className="text-slate-400">Integre sua loja física ou digital ao ERP OCS e venda para milhares de clientes com automação de estoque e financeiro.</p>
               <div className="flex flex-wrap gap-4">
                  <Button variant="default" size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                    Abrir minha loja
                  </Button>
                  <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
                    Saber mais
                  </Button>
               </div>
            </div>
            <div className="relative z-10 grid grid-cols-2 gap-4">
               {[
                 { label: "Vendas mensais", val: "R$ 4.2M+", icon: Award },
                 { label: "Lojas ativas", val: "850+", icon: Package }
               ].map((stat, i) => (
                 <div key={i} className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                   <stat.icon className="w-8 h-8 text-primary mb-3" />
                   <div className="text-2xl font-bold">{stat.val}</div>
                   <div className="text-xs text-slate-400 uppercase tracking-wider">{stat.label}</div>
                 </div>
               ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer simples */}
      <footer className="bg-white border-t py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">© 2024 OCS Marketplace. Uma solução Oriente Conecte Soluções.</p>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({ product, onAddToCart }: { product: MarketplaceProduct, onAddToCart: () => void }) {
  const price = product.promo_price || product.price;
  const originalPrice = product.promo_price ? product.price : null;
  const image = product.images?.[0] || "https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400&q=80";

  return (
    <Card className="overflow-hidden group border-none shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full bg-white">
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <motion.img 
          whileHover={{ scale: 1.05 }}
          src={image} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-500" 
        />
        <Button 
          variant="secondary" 
          size="icon" 
          className="absolute top-2 right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm"
        >
          <Heart className="w-4 h-4 text-rose-500" />
        </Button>
        {originalPrice && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white text-[10px] uppercase font-bold tracking-wider">
            Oferta
          </Badge>
        )}
      </div>
      <CardHeader className="p-4 pb-0 flex-1">
        <div className="flex items-center gap-1 mb-2">
           <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
           <span className="text-xs font-bold">5.0</span>
           <span className="text-xs text-muted-foreground">(0)</span>
        </div>
        <CardTitle className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {product.name}
        </CardTitle>
        <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
          <Package className="w-3 h-3" /> Vendido por <span className="font-medium text-slate-900 underline decoration-slate-300">{product.market_stores?.name || "Loja OCS"}</span>
        </div>
      </CardHeader>
      <CardFooter className="p-4 pt-4 flex flex-col items-stretch gap-3">
        <div className="flex flex-col gap-0.5">
          {originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {originalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          )}
          <span className="text-lg font-bold text-slate-900">
            {price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
        <Button className="w-full rounded-lg shadow-none group-hover:bg-primary/90" onClick={onAddToCart}>
          Adicionar ao Carrinho <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
