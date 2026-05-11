import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingDown, 
  TrendingUp, 
  AlertOctagon, 
  Activity, 
  Users, 
  Clock, 
  Zap,
  Target,
  ArrowRight,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DOW = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

export const JarbasAnalyticsDashboard = () => {
  const [insights, setInsights] = useState<any[]>([]);
  const [productivityData, setProductivityData] = useState<{ name: string; prod: number; target: number }[]>([]);
  const [teamData, setTeamData] = useState<{ team: string; efficiency: number; delay: number; color: string }[]>([]);
  const [metrics, setMetrics] = useState<{ label: string; value: string; trend: string; up: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

      const [insightsRes, prodRes, metricsRes] = await Promise.all([
        supabase.from("jarbas_predictive_insights").select("*").order("created_at", { ascending: false }).limit(9),
        supabase.from("jarbas_productivity_logs").select("recorded_at, on_time_completion_rate, activity_count, entity_id, entity_type, bottleneck_detected").gte("recorded_at", since),
        supabase.from("jarbas_analytics_metrics").select("*").order("created_at", { ascending: false }).limit(50),
      ]);

      setInsights(insightsRes.data ?? []);

      // Produtividade — média diária dos últimos 7 dias
      const buckets: Record<string, { sum: number; n: number }> = {};
      for (const r of prodRes.data ?? []) {
        const d = new Date(r.recorded_at);
        const key = DOW[d.getDay()];
        const v = Number(r.on_time_completion_rate ?? 0) * 100;
        buckets[key] = buckets[key] ? { sum: buckets[key].sum + v, n: buckets[key].n + 1 } : { sum: v, n: 1 };
      }
      const order = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
      setProductivityData(order.map((k) => ({ name: k, prod: buckets[k] ? Math.round(buckets[k].sum / buckets[k].n) : 0, target: 80 })));

      // Equipes — agrupa por entity_id (team)
      const teams: Record<string, { ok: number; total: number }> = {};
      for (const r of prodRes.data ?? []) {
        if (r.entity_type !== "team" || !r.entity_id) continue;
        const t = teams[r.entity_id] ?? { ok: 0, total: 0 };
        t.ok += Number(r.on_time_completion_rate ?? 0);
        t.total += 1;
        teams[r.entity_id] = t;
      }
      const palette = ["#22c55e", "#06b6d4", "#eab308", "#ef4444", "#a855f7"];
      setTeamData(
        Object.entries(teams).slice(0, 5).map(([id, t], i) => {
          const eff = Math.round((t.ok / t.total) * 100);
          return { team: id.slice(0, 4).toUpperCase(), efficiency: eff, delay: 100 - eff, color: palette[i % palette.length] };
        }),
      );

      // KPIs — usa jarbas_analytics_metrics + agregados acima
      const m = metricsRes.data ?? [];
      const find = (n: string) => m.find((x: any) => x.metric_name === n);
      const prodGlobal = (productivityData.reduce((a, b) => a + b.prod, 0) || 0);
      const avgProd = order.length ? Math.round((order.reduce((a, k) => a + (buckets[k] ? buckets[k].sum / buckets[k].n : 0), 0)) / order.length) : 0;
      const delayed = (prodRes.data ?? []).filter((r: any) => r.bottleneck_detected).length;
      const total = (prodRes.data ?? []).length || 1;
      setMetrics([
        { label: "Produtividade Global", value: `${avgProd}%`, trend: "7d", up: avgProd >= 80, icon: Activity } as any,
        { label: "Taxa de Atraso", value: `${Math.round((delayed / total) * 100)}%`, trend: `${delayed}/${total}`, up: delayed === 0, icon: Clock } as any,
        { label: "Eficiência de Equipe", value: teamData.length ? `${Math.round(teamData.reduce((a, t) => a + t.efficiency, 0) / Math.max(teamData.length, 1))}/100` : "—", trend: `${teamData.length} times`, up: true, icon: Users } as any,
        { label: find("economia_projetada")?.metric_name ? "Economia Projetada" : "Insights ativos", value: find("economia_projetada") ? `R$ ${Number(find("economia_projetada")!.metric_value).toLocaleString("pt-BR")}` : `${insightsRes.data?.length ?? 0}`, trend: "live", up: true, icon: Target } as any,
      ]);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Erro ao carregar analytics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#02020a] text-[#00f2ff] p-6 font-mono relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-cyan-500/30 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/50 relative">
              <BarChart3 className="w-8 h-8 text-cyan-400" />
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic">Jarbas Analytics AI</h1>
              <p className="text-xs text-cyan-400/60 font-bold uppercase tracking-[0.2em]">Motor de Predição e Inteligência Operacional</p>
            </div>
          </div>
          
          <div className="flex gap-4">
             <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 flex items-center gap-2">
               <AlertOctagon className="w-3 h-3" /> {insights.filter((i) => i.impact_level === 'critical').length} RISCOS CRÍTICOS
             </Badge>
          </div>
        </header>

        {/* Top Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m: any, i) => (
            <Card key={i} className="bg-cyan-950/20 border-cyan-500/20">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-2">
                  <m.icon className="w-4 h-4 text-cyan-400/60" />
                  <span className={`text-[10px] font-bold ${m.up ? 'text-green-500' : 'text-red-500'}`}>
                    {m.trend}
                  </span>
                </div>
                <p className="text-[10px] uppercase opacity-50 mb-1">{m.label}</p>
                <p className="text-2xl font-bold tracking-tighter">{m.value}</p>
              </CardContent>
            </Card>
          ))}
          {metrics.length === 0 && (
            <Card className="md:col-span-2 lg:col-span-4 bg-cyan-950/10 border-dashed border-cyan-500/20">
              <CardContent className="py-8 text-center text-[11px] opacity-60">
                {loading ? "Carregando métricas reais…" : "Nenhuma métrica registrada ainda em jarbas_analytics_metrics / jarbas_productivity_logs."}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Productivity Chart */}
          <Card className="lg:col-span-2 bg-cyan-950/10 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" /> Fluxo de Produtividade (Semanal)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={productivityData}>
                    <defs>
                      <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#00f2ff10" />
                    <XAxis dataKey="name" stroke="#00f2ff40" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#00f2ff40" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#02020a', border: '1px solid #00f2ff30', fontSize: '10px' }}
                      itemStyle={{ color: '#00f2ff' }}
                    />
                    <Area type="monotone" dataKey="prod" stroke="#00f2ff" fillOpacity={1} fill="url(#colorProd)" />
                    <Area type="monotone" dataKey="target" stroke="#ffffff20" strokeDasharray="5 5" fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Team Efficiency */}
          <Card className="bg-cyan-950/10 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" /> Desempenho por Equipe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {teamData.length === 0 && (
                  <div className="text-center text-[11px] opacity-60 py-6">
                    {loading ? "Carregando…" : "Nenhuma equipe com dados em jarbas_productivity_logs."}
                  </div>
                )}
                {teamData.map((t, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase font-bold">
                      <span>Equipe {t.team}</span>
                      <span className={t.delay > 30 ? 'text-red-500' : 'text-cyan-400'}>
                        {t.delay}% Atrasos
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-cyan-950 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${t.efficiency}%` }}
                        className="h-full bg-cyan-500"
                        transition={{ duration: 1, delay: i * 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {insights[0] && (
                <div className="mt-8 p-4 rounded bg-red-500/5 border border-red-500/20">
                  <p className="text-[10px] text-red-500 font-bold uppercase mb-1 flex items-center gap-2">
                    <AlertOctagon className="w-3 h-3" /> Insight do Jarbas
                  </p>
                  <p className="text-[10px] opacity-70 leading-relaxed italic">"{insights[0].description}"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Predictive Insights Section */}
        <section>
          <h2 className="text-lg font-bold mb-6 uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" /> Insights Preditivos & Riscos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insights.length > 0 ? insights.map((insight) => (
              <Card key={insight.id} className={`bg-cyan-950/20 border-l-4 ${
                insight.impact_level === 'critical' ? 'border-l-red-500 border-red-500/20' : 
                insight.impact_level === 'high' ? 'border-l-orange-500 border-orange-500/20' : 'border-l-yellow-500 border-yellow-500/20'
              }`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="text-[8px] uppercase border-white/10 opacity-60">
                      Probabilidade: {(insight.probability * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <CardTitle className="text-xs font-bold uppercase mt-2">{insight.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[10px] opacity-70 mb-4 leading-relaxed">{insight.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[9px] font-bold text-yellow-500 uppercase">Ação Recomendada</span>
                    <Button variant="ghost" size="sm" className="h-6 text-[8px] text-cyan-400 hover:text-cyan-300 p-0">
                      EXECUTAR <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )) : (
              [1, 2, 3].map((i) => (
                <div key={i} className="p-4 bg-cyan-950/5 border border-dashed border-cyan-500/20 rounded-lg animate-pulse flex flex-col justify-center items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 mb-2" />
                  <div className="h-2 w-24 bg-cyan-500/10 rounded mb-2" />
                  <div className="h-2 w-16 bg-cyan-500/10 rounded" />
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
