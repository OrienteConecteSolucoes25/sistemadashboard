import React, { useState, useEffect } from 'react';
import { jarbasCore } from '../../jarbas/core/jarbasCore';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  Store, 
  ShoppingCart, 
  Users, 
  Building2, 
  Ticket, 
  BarChart3, 
  Settings, 
  MessageSquare, 
  ArrowLeft,
  Search,
  Plus,
  Filter,
  MoreVertical,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAcl } from "@/acl/AclProvider";
import { supabase } from "@/integrations/supabase/client";
import MarketplaceHome from "./MarketplaceHome";
import { getMarketplaceProducts, MarketplaceProduct } from "../lib/marketplaceApi";


// Sub-componentes do Marketplace Admin
const MarketplaceDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: "Vendas Totais", value: "R$ 45.230,00", change: "+12.5%", icon: BarChart3, color: "text-blue-600" },
        { label: "Pedidos", value: "124", change: "+8%", icon: ShoppingCart, color: "text-green-600" },
        { label: "Produtos Ativos", value: "48", change: "0%", icon: Package, color: "text-purple-600" },
        { label: "Clientes", value: "892", change: "+24%", icon: Users, color: "text-orange-600" },
      ].map((stat, i) => (
        <Card key={i} className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                <p className="text-xs text-green-600 font-medium mt-1">{stat.change} <span className="text-muted-foreground">vs mês anterior</span></p>
              </div>
              <div className={`p-3 rounded-xl bg-slate-50 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Pedidos Recentes</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary">Ver todos</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-50 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs">
                    #12{i}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Cliente Teste {i}</p>
                    <p className="text-xs text-muted-foreground">Há {i + 1} hora(s)</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">R$ {(Math.random() * 500 + 100).toFixed(2)}</p>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="text-[10px] h-5">Pendente</Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-[8px] uppercase text-cyan-500 border border-cyan-500/20"
                      onClick={() => {
                        jarbasCore.registerEvent({
                          module: 'marketplace',
                          type: 'order_review',
                          title: 'Revisão de Pedido Pendente',
                          description: `O Jarbas identificou um pedido de R$ ${(Math.random() * 500 + 100).toFixed(2)} que requer atenção operacional.`,
                          severity: 'medium'
                        });
                      }}
                    >
                      Audit Jarbas
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Estoque Baixo</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary text-xs">Repor estoque</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-slate-100" />
                  <div>
                    <p className="text-sm font-medium">Produto Exemplo {i}</p>
                    <p className="text-xs text-red-500 font-medium">{i + 2} unidades restantes</p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

const ProductsTab = () => {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getMarketplaceProducts(50);
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar produtos..." className="pl-10 h-10 bg-slate-50 border-none" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-10">
              <Filter className="w-4 h-4 mr-2" /> Filtros
            </Button>
            <Button size="sm" className="h-10 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> Novo Produto
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-6 border-b pb-0 overflow-x-auto no-scrollbar">
          {["Todos", "Ativos", "Inativos", "Sem Estoque"].map((tab, i) => (
            <button 
              key={i} 
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${i === 0 ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando catálogo...</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Produto</th>
                  <th className="px-6 py-4 font-medium">Categoria</th>
                  <th className="px-6 py-4 font-medium">Preço</th>
                  <th className="px-6 py-4 font-medium">Estoque</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.length > 0 ? products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-100 overflow-hidden">
                          {product.images?.[0] && <img src={product.images[0]} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{product.name}</p>
                          <p className="text-[10px] text-muted-foreground">SKU: {product.sku || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{product.market_categories?.name || "Geral"}</td>
                    <td className="px-6 py-4 font-medium">{product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.stock_quantity}</span>
                        <Badge variant="outline" className="text-[9px] h-4">Min: {product.min_stock_alert}</Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={product.is_active ? "bg-green-50 text-green-700 border-none" : "bg-red-50 text-red-700 border-none"}>
                        {product.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground italic">Nenhum produto cadastrado</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const OrdersTab = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('market_orders' as any)
          .select('*, market_customers(full_name, email)')
          .order('created_at', { ascending: false });
        if (!error) setOrders(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardHeader className="border-b bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Gestão de Pedidos</CardTitle>
          <div className="flex gap-2">
             <Button variant="outline" size="sm" className="h-9">Exportar CSV</Button>
             <Button variant="outline" size="sm" className="h-9"><Filter className="w-4 h-4 mr-2" /> Filtros</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase font-bold text-muted-foreground bg-slate-50/30">
                <tr>
                  <th className="px-6 py-4">ID Pedido</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length > 0 ? orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/30">
                    <td className="px-6 py-4 font-bold text-primary">#{order.id.split('-')[0].toUpperCase()}</td>
                    <td className="px-6 py-4">
                       <div className="font-medium">{order.market_customers?.full_name}</div>
                       <div className="text-[10px] text-muted-foreground">{order.market_customers?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                       <Badge className={order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                         {order.status === 'pending' ? 'Pendente' : order.status === 'completed' ? 'Concluído' : order.status}
                       </Badge>
                    </td>
                    <td className="px-6 py-4 font-bold">{order.total_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="px-6 py-4 text-right">
                       <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="p-20 text-center text-muted-foreground italic">Nenhum pedido encontrado</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const CustomersTab = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase.from('market_customers' as any).select('*');
        if (!error) setCustomers(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Clientes do Marketplace</CardTitle>
          <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Novo Cliente</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase font-bold text-muted-foreground bg-slate-50/30">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">E-mail</th>
                  <th className="px-6 py-4">Data Cadastro</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.length > 0 ? customers.map((c) => (
                  <tr key={c.id}>
                    <td className="px-6 py-4 font-medium">{c.full_name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{c.email}</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                       <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="p-20 text-center text-muted-foreground italic">Nenhum cliente cadastrado</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function MarketplaceAdmin() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showVitrine, setShowVitrine] = useState(false);
  const { can } = useAcl();
  
  // Efeito para checar se a URL pede a vitrine
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'vitrine') {
      setShowVitrine(true);
    }
  }, []);

  if (showVitrine) {
    return (
      <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
        <Button 
          variant="secondary" 
          size="sm" 
          className="fixed top-4 left-4 z-[110] shadow-lg border bg-white/80 backdrop-blur-md"
          onClick={() => {
            setShowVitrine(false);
            // Limpa a URL
            window.history.replaceState({}, '', window.location.pathname);
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Painel
        </Button>
        <MarketplaceHome />
      </div>
    );
  }

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "marketplace.dashboard.visualizar" },
    { id: "produtos", label: "Produtos", icon: Package, permission: "marketplace.produtos.visualizar" },
    { id: "categorias", label: "Categorias", icon: Tags, permission: "marketplace.produtos.visualizar" },
    { id: "pedidos", label: "Pedidos", icon: ShoppingCart, permission: "marketplace.pedidos.visualizar" },
    { id: "clientes", label: "Clientes", icon: Users, permission: "marketplace.clientes.visualizar" },
    { id: "vendedores", label: "Vendedores", icon: Building2, permission: "marketplace.dashboard.visualizar" },
    { id: "estoque", label: "Estoque", icon: BarChart3, permission: "marketplace.estoque.visualizar" },
    { id: "cupons", label: "Cupons & Promo", icon: Ticket, permission: "marketplace.cupons.editar" },
    { id: "atendimento", label: "Atendimento", icon: MessageSquare, permission: "marketplace.pedidos.visualizar" },
    { id: "configuracoes", label: "Configurações", icon: Settings, permission: "marketplace.configuracoes.editar" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* Header Superior */}
      <div className="bg-white border-b px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-40">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marketplace / Loja</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestão comercial e e-commerce multiempresa</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="border-primary text-primary hover:bg-primary/5 h-10"
            onClick={() => setShowVitrine(true)}
          >
            <ExternalLink className="w-4 h-4 mr-2" /> Ver Vitrine Pública
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Interna */}
        <aside className="w-64 bg-white border-r hidden lg:flex flex-col p-4 gap-1">
          <ScrollArea className="flex-1">
            <div className="space-y-1">
              {menuItems.map((item) => {
                // Se can for undefined (auth loading), mostramos como se tivesse permissão ou lidamos no AppLayout
                const hasPermission = can ? can(item.permission) : true;
                
                if (!hasPermission) return null;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTab === item.id 
                        ? "bg-primary text-white shadow-md shadow-primary/20" 
                        : "text-muted-foreground hover:bg-slate-50 hover:text-foreground"
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${activeTab === item.id ? "text-white" : "text-slate-400"}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </aside>

        {/* Área de Conteúdo */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === "dashboard" && <MarketplaceDashboard />}
          {activeTab === "produtos" && <ProductsTab />}
          {activeTab === "categorias" && (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
              <Tags className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Categorias & Tags</h3>
              <p className="text-muted-foreground max-w-xs mx-auto mt-2">Organize seu catálogo por nichos, subcategorias e grupos de produtos.</p>
              <Button variant="outline" className="mt-6">Criar primeira categoria</Button>
            </div>
          )}
          {activeTab === "pedidos" && <OrdersTab />}
          {activeTab === "clientes" && <CustomersTab />}
          {activeTab === "categorias" && (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
              <Tags className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Categorias & Tags</h3>
              <p className="text-muted-foreground max-w-xs mx-auto mt-2">Organize seu catálogo por nichos, subcategorias e grupos de produtos.</p>
              <Button variant="outline" className="mt-6">Criar primeira categoria</Button>
            </div>
          )}
          {!["dashboard", "produtos", "categorias", "pedidos", "clientes"].includes(activeTab) && (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-slate-300 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold">Módulo em Configuração</h3>
              <p className="text-muted-foreground max-w-xs mx-auto mt-2">A aba {activeTab} está sendo integrada ao ERP OCS. Em breve disponível.</p>
              <Button variant="ghost" className="mt-6" onClick={() => setActiveTab("dashboard")}>Voltar ao Início</Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
