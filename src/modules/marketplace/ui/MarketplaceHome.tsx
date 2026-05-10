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
  Loader2
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
import { motion } from "framer-motion";
import { 
  getMarketplaceProducts, 
  getMarketplaceCategories, 
  MarketplaceProduct, 
  MarketplaceCategory 
} from "../lib/marketplaceApi";

export default function MarketplaceHome() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [prodData, catData] = await Promise.all([
          getMarketplaceProducts(12),
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header do Marketplace */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <ShoppingBag className="w-6 h-6" />
            <span className="hidden sm:inline">OCS Marketplace</span>
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
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">2</Badge>
            </Button>
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
                    <ProductCard key={product.id} product={product} />
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

function ProductCard({ product }: { product: any }) {
  return (
    <Card className="overflow-hidden group border-none shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full bg-white">
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <motion.img 
          whileHover={{ scale: 1.05 }}
          src={product.image} 
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
        <Badge className="absolute bottom-2 left-2 bg-primary/90 text-white text-[10px] uppercase font-bold tracking-wider">
          {product.category}
        </Badge>
      </div>
      <CardHeader className="p-4 pb-0 flex-1">
        <div className="flex items-center gap-1 mb-2">
           <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
           <span className="text-xs font-bold">{product.rating}</span>
           <span className="text-xs text-muted-foreground">({product.reviews})</span>
        </div>
        <CardTitle className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {product.name}
        </CardTitle>
        <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
          <Package className="w-3 h-3" /> Vendido por <span className="font-medium text-slate-900 underline decoration-slate-300">{product.store}</span>
        </div>
      </CardHeader>
      <CardFooter className="p-4 pt-4 flex flex-col items-stretch gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-slate-900">
            {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
        <Button className="w-full rounded-lg shadow-none group-hover:bg-primary/90">
          Adicionar ao Carrinho <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
