import React from "react";
import { 
  Activity, 
  Ticket, 
  Users, 
  Clock, 
  AlertCircle, 
  BarChart3, 
  ShieldAlert, 
  Laptop, 
  CheckCircle2,
  ChevronUp,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function TiDashboard() {
  const [stats, setStats] = React.useState({
    activeTickets: 0,
    slaRate: "98.4%",
    assetsInUse: 0,
    incidentsToday: 0
  });
  const [ticketsByStatus, setTicketsByStatus] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Active tickets
      const { count: activeCount } = await supabase
        .from('it_tickets')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'resolvido');
      
      // Assets
      const { count: assetCount } = await supabase
        .from('it_assets')
        .select('*', { count: 'exact', head: true });

      // Tickets by category for performance chart
      const { data: catData } = await supabase
        .from('it_tickets')
        .select('category');
      
      const counts: Record<string, number> = {};
      catData?.forEach(t => {
        counts[t.category] = (counts[t.category] || 0) + 1;
      });

      const formattedCats = Object.entries(counts).map(([label, count]) => ({
        label: label.toUpperCase(),
        count,
        progress: Math.min(100, (count / (catData?.length || 1)) * 100)
      }));

      setStats({
        activeTickets: activeCount || 0,
        slaRate: "98.4%",
        assetsInUse: assetCount || 0,
        incidentsToday: 0
      });
      setTicketsByStatus(formattedCats);

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
          <Activity className="w-8 h-8 text-blue-600" /> TI OPERATIONAL CENTER
        </h1>
        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.3em] mt-1">SISTEMA DE MONITORAMENTO EM TEMPO REAL</p>
      </div>

      {/* Top Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Chamados Ativos', value: '42', color: 'text-blue-600', trend: '+12%' },
          { label: 'SLA de Resolução', value: '98.4%', color: 'text-green-600', trend: 'STABLE' },
          { label: 'Ativos em Uso', value: '1,204', color: 'text-slate-800', trend: '+5' },
          { label: 'Incidentes Hoje', value: '03', color: 'text-red-600', trend: '-20%' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm overflow-hidden relative group hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <Badge variant="outline" className="text-[8px] font-black border-slate-100 group-hover:bg-slate-50">{stat.trend}</Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-black tracking-tighter ${stat.color}`}>{stat.value}</span>
                <ChevronUp className="w-4 h-4 text-green-500" />
              </div>
            </CardContent>
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${stat.color.replace('text', 'bg')}/20`}></div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chamados por Status */}
        <Card className="bg-white border-none shadow-sm lg:col-span-2">
          <CardHeader className="pb-2 border-b border-slate-50">
            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" /> PERFORMANCE DE SUPORTE
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {[
                { label: 'Suporte de Acesso', progress: 85, count: 12 },
                { label: 'Falhas de Sistema', progress: 62, count: 8 },
                { label: 'Infraestrutura', progress: 30, count: 4 },
                { label: 'Segurança', progress: 15, count: 2 },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <span>{item.label}</span>
                    <span className="text-blue-600">{item.count} Chamados</span>
                  </div>
                  <Progress value={item.progress} className="h-2 bg-slate-100" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Real-time Alerts */}
        <Card className="bg-slate-900 border-none shadow-2xl text-white">
          <CardHeader className="pb-2 border-b border-white/5">
            <CardTitle className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 animate-pulse" /> CRITICAL MONITOR
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 text-red-500 mb-1">
                  <AlertCircle className="w-3 h-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest">SLA VENCIDO #00234</span>
                </div>
                <p className="text-xs font-medium text-slate-300">Tempo de resolução excedido em 42 min.</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Pico de Acesso: Financeiro</span>
                </div>
                <p className="text-xs font-medium text-slate-300">Volume de requisições 2x acima da média.</p>
              </div>
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 text-green-500 mb-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Backup Concluído</span>
                </div>
                <p className="text-xs font-medium text-slate-300">Sincronização global finalizada com sucesso.</p>
              </div>
            </div>
            
            <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 font-black text-[10px] uppercase tracking-[0.2em] h-12 shadow-lg shadow-blue-500/20">
              ABRIR TERMINAL DE RESPOSTA
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pb-12">
         {/* Gestão de Ativos */}
         <Card className="bg-white border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Laptop className="w-4 h-4" /> GESTÃO DE ATIVOS
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-600">Disponíveis</span>
                  <Badge variant="secondary" className="text-[10px] font-black">128</Badge>
               </div>
               <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-600">Em Manutenção</span>
                  <Badge variant="outline" className="text-[10px] font-black border-red-100 text-red-500">08</Badge>
               </div>
               <div className="flex justify-between items-center py-3">
                  <span className="text-xs font-bold text-slate-600">Para Descarte</span>
                  <span className="text-xs font-black text-slate-400">03</span>
               </div>
            </CardContent>
         </Card>

         {/* Equipe de TI */}
         <Card className="bg-white border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4" /> TÉCNICOS DISPONÍVEIS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               {[
                 { name: 'Ricardo Silva', status: 'Online', tickets: 12 },
                 { name: 'Ana Souza', status: 'Em Chamado', tickets: 15 },
                 { name: 'Marcos Oliver', status: 'Online', tickets: 8 },
               ].map((user, i) => (
                 <div key={i} className="flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full ${user.status === 'Online' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></div>
                   <div className="flex-1">
                     <p className="text-xs font-bold text-slate-700">{user.name}</p>
                     <p className="text-[10px] text-slate-400 uppercase font-bold">{user.status} • {user.tickets} Ativos</p>
                   </div>
                 </div>
               ))}
            </CardContent>
         </Card>

         {/* SLA Médio */}
         <Card className="bg-white border-none shadow-sm overflow-hidden relative">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4" /> SLA MÉDIO DE RESPOSTA
              </CardTitle>
            </CardHeader>
            <CardContent className="py-8 text-center">
               <div className="text-4xl font-black text-blue-600 tracking-tighter">02:14:00</div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">HORAS : MINUTOS : SEGUNDOS</p>
            </CardContent>
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-600/5 rounded-bl-full"></div>
         </Card>
      </div>
    </div>
  );
}
