import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Activity, 
  Users, 
  Map as MapIcon, 
  Zap, 
  Bell, 
  Target, 
  ArrowUpRight,
  Maximize2,
  HardHat,
  Construction,
  Cpu,
  Layers
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { useJarbasAmbient } from "../hooks/useJarbasAmbient";
import { supabase } from "@/integrations/supabase/client";

export const JarbasCommandCenter = () => {
  const { setAmbientState, triggerReaction } = useJarbasAmbient();
  const [activeSite, setActiveSite] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [kpis, setKpis] = useState<{ label: string; value: number }[]>([
    { label: "Produtividade Equipes", value: 0 },
    { label: "Conformidade Segurança", value: 0 },
    { label: "Utilização Recursos", value: 0 },
  ]);

  useEffect(() => {
    void (async () => {
      const [sitesRes, logsRes, prodRes, safetyRes] = await Promise.all([
        supabase.from("eng_sites").select("id, codigo, nome, cidade, uf, status, latitude, longitude").eq("is_deleted", false).limit(20),
        supabase.from("jarbas_logs").select("id, command, response, created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("jarbas_productivity_logs").select("on_time_completion_rate").order("recorded_at", { ascending: false }).limit(50),
        supabase.from("jarbas_safety_logs").select("severity").order("created_at", { ascending: false }).limit(50),
      ]);
      const mapped = (sitesRes.data ?? []).map((s: any, i: number) => ({
        id: s.id,
        name: s.nome,
        progress: 0,
        status: (s.status ?? "stable").toLowerCase().includes("crit") ? "critical" : (s.status ?? "stable").toLowerCase().includes("aten") ? "warning" : "stable",
        lat: s.latitude ? `${Number(s.latitude).toFixed(4)}` : "—",
        lng: s.longitude ? `${Number(s.longitude).toFixed(4)}` : "—",
        teams: 0,
        risk: (s.status ?? "Stable"),
        codigo: s.codigo,
        cidade: s.cidade,
        uf: s.uf,
        idx: i,
      }));
      setSites(mapped);
      setEvents(logsRes.data ?? []);
      const avg = (arr: number[]) => (arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) : 0);
      const prod = avg(((prodRes.data ?? []) as any[]).map((r) => Number(r.on_time_completion_rate ?? 0)));
      const safe = (safetyRes.data ?? []).length === 0 ? 100 : Math.max(0, 100 - ((safetyRes.data as any[]).filter((r) => r.severity === "critical").length * 10));
      setKpis([
        { label: "Produtividade Equipes", value: prod },
        { label: "Conformidade Segurança", value: safe },
        { label: "Utilização Recursos", value: Math.min(100, Math.round(((sitesRes.data?.length ?? 0) / 20) * 100)) },
      ]);
    })();

    const timer = setTimeout(() => {
      triggerReaction('voice', { text: "Command Center Online." });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleCriticalAlert = () => {
    setAmbientState('critical');
    triggerReaction('visual', { message: "CRITICAL: Atraso detectado na Torre Norte", severity: 'critical' });
    triggerReaction('voice', { text: "Atenção: A obra Torre Norte apresenta atraso crítico de 14%." });
  };

  return (
    <div className="min-h-screen bg-[#02020a] text-[#00f2ff] p-6 font-mono relative overflow-hidden">
      {/* HUD Scanner Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,242,255,0.05)_0%,transparent_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />

      <div className="relative z-10 max-w-[1600px] mx-auto space-y-6">
        {/* Header HUD */}
        <header className="flex justify-between items-center border-b border-cyan-500/30 pb-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-cyan-500/20 border border-cyan-500/50 rounded animate-pulse">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase italic tracking-tighter">Jarbas Command Center</h1>
              <p className="text-[8px] text-cyan-400/60 uppercase font-bold tracking-[0.4em]">Operational Dominance System v4.0</p>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex gap-4">
               <div className="text-right">
                 <p className="text-[8px] opacity-40 uppercase">Global Uptime</p>
                 <p className="text-xs font-bold">99.998%</p>
               </div>
               <div className="text-right">
                 <p className="text-[8px] opacity-40 uppercase">Active Nodes</p>
                 <p className="text-xs font-bold">1,284</p>
               </div>
            </div>
            <Button 
              onClick={handleCriticalAlert}
              className="bg-red-500 hover:bg-red-600 text-black font-black text-[10px] uppercase h-8"
            >
              Simular Incidente
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-180px)]">
          {/* Left Column: Metrics & Alarms */}
          <div className="col-span-3 space-y-6">
            <Card className="bg-cyan-950/20 border-cyan-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] uppercase font-bold flex items-center gap-2">
                  <Activity className="w-3 h-3 text-cyan-400" /> Indicadores Críticos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {kpis.map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[9px] uppercase">
                      <span>{item.label}</span>
                      <span className="text-cyan-400">{item.value}%</span>
                    </div>
                    <Progress value={item.value} className="h-1 bg-cyan-950" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-cyan-950/20 border-cyan-500/20 flex-1 h-[400px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] uppercase font-bold flex items-center gap-2">
                  <Bell className="w-3 h-3 text-yellow-500" /> Log de Eventos Live
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[320px] pr-4">
                  <div className="space-y-3">
                    {events.length === 0 && (
                      <p className="text-[9px] opacity-50 italic">Sem eventos registrados em jarbas_logs.</p>
                    )}
                    {events.map((ev: any) => (
                      <div key={ev.id} className="text-[9px] p-2 border border-white/5 bg-white/5 rounded">
                        <span className="text-cyan-500 font-bold">[{new Date(ev.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}]</span>{" "}
                        {ev.command ?? ev.response ?? "—"}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Center Column: Operational Map */}
          <div className="col-span-6 space-y-6">
            <Card className="bg-black/40 border-cyan-500/30 h-full relative overflow-hidden group">
              <div className="absolute top-4 left-4 z-20 flex gap-2">
                <Badge className="bg-cyan-500 text-black text-[8px]">GPS_ACTIVE</Badge>
                <Badge variant="outline" className="text-[8px] border-cyan-500/30 text-cyan-400">SAT_LINK_8</Badge>
              </div>
              
              <div className="absolute inset-0 bg-[#0a0a0f] flex items-center justify-center">
                <div className="relative w-full h-full p-8">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,242,255,0.05),transparent_70%)]" />
                  {sites.length === 0 && (
                    <p className="absolute inset-0 flex items-center justify-center text-[10px] opacity-50 italic">Sem sites cadastrados em eng_sites.</p>
                  )}
                  {sites.map((site: any) => (
                    <motion.div
                      key={site.id}
                      whileHover={{ scale: 1.2 }}
                      onClick={() => setActiveSite(site)}
                      className={`absolute cursor-pointer p-1 rounded-full border-2 ${
                        site.status === 'critical' ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                        site.status === 'warning' ? 'border-yellow-500' : 'border-green-500'
                      }`}
                      style={{
                        left: `${15 + ((site.idx * 17) % 70)}%`,
                        top: `${20 + ((site.idx * 23) % 60)}%`
                      }}
                    >
                      <Construction className={`w-4 h-4 ${site.status === 'critical' ? 'text-red-500' : 'text-cyan-400'}`} />
                    </motion.div>
                  ))}

                  {/* UI Overlays on Map */}
                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-md p-4 border border-cyan-500/20 rounded-sm">
                      <p className="text-[10px] uppercase font-bold text-cyan-400 mb-2">Detalhes do Site Selecionado</p>
                      {activeSite ? (
                        <div className="space-y-1">
                          <p className="text-xs font-bold">{activeSite.name}</p>
                          <p className="text-[9px] opacity-60">{activeSite.lat} | {activeSite.lng}</p>
                          <div className="flex gap-4 mt-2">
                             <div><p className="text-[8px] opacity-40">EQUIPES</p><p className="text-xs">{activeSite.teams}</p></div>
                             <div><p className="text-[8px] opacity-40">RISCO</p><p className={`text-xs ${activeSite.risk === 'High' ? 'text-red-500' : 'text-green-500'}`}>{activeSite.risk}</p></div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[9px] italic opacity-40">Selecione um marcador no mapa...</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                       <div className="p-2 border border-cyan-500/20 bg-black/60 rounded flex gap-4">
                          <div className="text-center">
                            <p className="text-[8px] opacity-40">LAT</p>
                            <p className="text-[10px]">23.5505</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[8px] opacity-40">LNG</p>
                            <p className="text-[10px]">46.6333</p>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Teams & Critical Modules */}
          <div className="col-span-3 space-y-6">
             <Card className="bg-cyan-950/20 border-cyan-500/20">
               <CardHeader className="pb-2">
                 <CardTitle className="text-[10px] uppercase font-bold flex items-center gap-2">
                   <Users className="w-3 h-3 text-cyan-400" /> Gestão de Equipes (Live)
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-3">
                 {[
                   { name: "Equipe Alfa", activity: "Ativa", site: "Torre Norte" },
                   { name: "Equipe Beta", activity: "Ativa", site: "Horizonte" },
                   { name: "Manutenção", activity: "Standby", site: "Central" },
                 ].map((team, i) => (
                   <div key={i} className="flex items-center justify-between p-2 border border-white/5 bg-white/5 rounded">
                     <div>
                       <p className="text-[10px] font-bold">{team.name}</p>
                       <p className="text-[8px] opacity-50">{team.site}</p>
                     </div>
                     <Badge className="bg-cyan-500/10 text-cyan-400 text-[8px] border-cyan-500/30">
                       {team.activity}
                     </Badge>
                   </div>
                 ))}
               </CardContent>
             </Card>

             <Card className="bg-cyan-950/20 border-cyan-500/20">
               <CardHeader className="pb-2">
                 <CardTitle className="text-[10px] uppercase font-bold flex items-center gap-2">
                   <Layers className="w-3 h-3 text-cyan-400" /> Módulos do Ecossistema
                 </CardTitle>
               </CardHeader>
               <CardContent className="grid grid-cols-2 gap-2">
                 {[
                   { icon: ShieldAlert, label: "Security" },
                   { icon: Target, label: "Precision" },
                   { icon: Zap, label: "Energy" },
                   { icon: Activity, label: "Health" },
                 ].map((mod, i) => (
                   <div key={i} className="p-3 border border-cyan-500/10 bg-cyan-500/5 rounded text-center flex flex-col items-center gap-2">
                     <mod.icon className="w-4 h-4 text-cyan-400/60" />
                     <span className="text-[8px] font-bold uppercase">{mod.label}</span>
                   </div>
                 ))}
               </CardContent>
             </Card>

             <div className="p-4 border border-red-500/30 bg-red-500/5 rounded relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1 bg-red-500 text-black text-[8px] font-bold">ALERTA_IA</div>
                <p className="text-[10px] font-bold text-red-500 mb-1">RECOMENDAÇÃO JARBAS:</p>
                <p className="text-[9px] leading-relaxed italic opacity-80">
                  "O Site 1 apresenta risco de overflow orçamentário. Recomendo pausa técnica para auditoria visual imediata."
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
