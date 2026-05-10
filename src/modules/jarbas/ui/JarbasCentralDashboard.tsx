import React from "react";
import { 
  Activity, 
  AlertTriangle, 
  BrainCircuit, 
  TrendingUp, 
  ShieldAlert,
  Zap,
  LayoutDashboard,
  MessageSquareCode
} from "lucide-react";
import { jarbasCore } from "../core/jarbasCore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useJarbasDashboard } from "../hooks/useJarbasDashboard";

export const JarbasCentralDashboard = () => {
  const { events, insights, status, alerts } = useJarbasDashboard();

  return (
    <div className="min-h-screen bg-[#050510] text-[#00f2ff] p-6 font-mono selection:bg-cyan-500/30">
      {/* Header Estilo HUD */}
      <div className="flex justify-between items-center mb-8 border-b border-cyan-500/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <BrainCircuit className="w-10 h-10 animate-pulse text-cyan-400" />
            <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">Jarbas Central AI Core</h1>
            <p className="text-[10px] text-cyan-400/60 font-bold uppercase tracking-[0.2em]">Consciência Operacional Global Ativa</p>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <div className="text-[10px] uppercase opacity-50">Health Score</div>
            <div className="text-2xl font-bold">{status.healthScore}%</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase opacity-50">Alertas Ativos</div>
            <div className="text-2xl font-bold text-amber-500">{status.activeAlerts}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lado Esquerdo - Monitoramento em Tempo Real */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4" /> MONITORAMENTO GLOBAL
          </h2>
          {events.map((event) => (
            <motion.div 
              key={event.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className={`p-4 rounded border ${
                event.severity === "critical" ? "border-red-500/50 bg-red-500/5" : "border-cyan-500/30 bg-cyan-500/5"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" className="text-[8px] uppercase border-cyan-500/50 text-cyan-400">
                  {event.module}
                </Badge>
                <span className="text-[8px] opacity-40">{new Date(event.timestamp).toLocaleTimeString()}</span>
              </div>
              <h3 className="text-xs font-bold mb-1 uppercase tracking-wider">{event.title}</h3>
              <p className="text-[10px] opacity-70 leading-relaxed">{event.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Centro - Insights & Recomendações */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4" /> MOTOR DE RECOMENDAÇÃO
          </h2>
          {insights.map((insight) => (
            <Card key={insight.id} className="bg-cyan-950/20 border-cyan-500/30 text-[#00f2ff]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase flex items-center justify-between">
                  {insight.title}
                  <Badge className="bg-cyan-500 text-black text-[8px]">{(insight.confidence * 100).toFixed(0)}% Confiança</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[10px] mb-3 opacity-80">{insight.description}</p>
                <div className="bg-cyan-500/10 p-2 rounded border border-cyan-500/20">
                  <span className="text-[9px] uppercase font-bold text-cyan-400 block mb-1">Recomendação do Jarbas:</span>
                  <p className="text-[10px] italic">{insight.recommendation}</p>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Modo Executivo Preview */}
          <div className="p-4 rounded-lg bg-indigo-950/20 border border-indigo-500/30 mt-8">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquareCode className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Modo Executivo</span>
            </div>
            <div className="text-[11px] space-y-2 opacity-90 leading-relaxed">
              <p className="border-l-2 border-indigo-500 pl-2">"Senhor Gestor, detectei 3 obras com risco de atraso significativo."</p>
              <p className="border-l-2 border-indigo-500 pl-2">"O custo operacional da Torre Norte subiu 18% em relação ao planejado."</p>
            </div>
          </div>
        </div>

        {/* Lado Direito - Consciência Operacional & Alertas */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
            <ShieldAlert className="w-4 h-4" /> CONSCIÊNCIA OPERACIONAL
          </h2>
          <div className="p-4 rounded border border-amber-500/30 bg-amber-500/5 mb-6">
            <h3 className="text-[10px] uppercase font-bold text-amber-500 mb-2">Sumário Crítico</h3>
            <p className="text-xs leading-relaxed">{status.summary}</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] uppercase font-bold opacity-50 mb-2">Alertas de Orquestração</h3>
            {alerts.map((alert) => (
              <div key={alert.id} className="flex gap-3 items-start p-3 bg-slate-900/40 border border-white/5 rounded">
                <AlertTriangle className={`w-4 h-4 mt-1 ${alert.severity === "critical" ? "text-red-500" : "text-amber-500"}`} />
                <div>
                  <div className="text-[9px] uppercase font-bold opacity-60 mb-1">{alert.module}</div>
                  <div className="text-[11px] leading-tight">{alert.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Estilo Sistema Operacional */}
      <div className="fixed bottom-0 left-0 right-0 p-2 px-6 flex justify-between items-center text-[8px] uppercase tracking-widest opacity-40 bg-black/40 backdrop-blur-md">
        <span>OCS-OS // JARBAS-V2.0.4-STABLE</span>
        <div className="flex gap-4">
          <span>MEM_ALLOC: 412MB</span>
          <span>THREADS: 24</span>
          <span>AI_LOAD: 12.4%</span>
        </div>
      </div>
    </div>
  );
};
