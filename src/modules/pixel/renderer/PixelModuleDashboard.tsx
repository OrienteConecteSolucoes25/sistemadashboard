import React from "react";
import { motion } from "framer-motion";
import { 
  Briefcase, 
  Scale, 
  Users, 
  BarChart3, 
  Cpu, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Rocket,
  Presentation
} from "lucide-react";

export type ModuleType = "engineering" | "legal" | "hr" | "finance" | "ti" | "reception" | "showroom" | "project_view";

interface Props {
  type: ModuleType;
  x: number;
  y: number;
}

/**
 * Dashboards flutuantes que mostram dados vivos do ERP no Pixel Office.
 * Integram visualmente os módulos ao escritório pixel.
 */
export const PixelModuleDashboard = ({ type, x, y }: Props) => {
  const getModuleConfig = (t: ModuleType) => {
    switch (t) {
      case "engineering":
        return {
          icon: <Briefcase className="w-3 h-3 text-blue-400" />,
          title: "Engenharia",
          color: "border-blue-500/30",
          bg: "bg-blue-950/80",
          stats: [
            { label: "Projetos Ativos", value: "12" },
            { label: "RFIs Pendentes", value: "5" },
          ]
        };
      case "legal":
        return {
          icon: <Scale className="w-3 h-3 text-amber-400" />,
          title: "Jurídico",
          color: "border-amber-500/30",
          bg: "bg-amber-950/80",
          stats: [
            { label: "Processos", value: "48" },
            { label: "Prazos Hoje", value: "3" },
          ]
        };
      case "hr":
        return {
          icon: <Users className="w-3 h-3 text-emerald-400" />,
          title: "RH & DP",
          color: "border-emerald-500/30",
          bg: "bg-emerald-950/80",
          stats: [
            { label: "Onboarding", value: "2" },
            { label: "Total Colaboradores", value: "142" },
          ]
        };
      case "finance":
        return {
          icon: <BarChart3 className="w-3 h-3 text-purple-400" />,
          title: "Financeiro",
          color: "border-purple-500/30",
          bg: "bg-purple-950/80",
          stats: [
            { label: "Fluxo Mensal", value: "R$ 450k" },
            { label: "Contas a Pagar", value: "8" },
          ]
        };
      case "ti":
        return {
          icon: <Cpu className="w-3 h-3 text-cyan-400" />,
          title: "TI & Suporte",
          color: "border-cyan-500/30",
          bg: "bg-cyan-950/80",
          stats: [
            { label: "Chamados Abertos", value: "4" },
            { label: "Uptime Infra", value: "99.9%" },
          ]
        };
      case "showroom":
        return {
          icon: <Rocket className="w-3 h-3 text-indigo-400" />,
          title: "Showroom OCS",
          color: "border-indigo-500/30",
          bg: "bg-indigo-950/80",
          stats: [
            { label: "Módulos Ativos", value: "15" },
            { label: "Casos de Sucesso", value: "24" },
          ]
        };
      case "project_view":
        return {
          icon: <Presentation className="w-3 h-3 text-sky-400" />,
          title: "Área do Cliente",
          color: "border-sky-500/30",
          bg: "bg-sky-950/80",
          stats: [
            { label: "Progresso Real", value: "85%" },
            { label: "Arquivos Novos", value: "12" },
          ]
        };
      case "reception":
        return {
          icon: <Users className="w-3 h-3 text-slate-400" />,
          title: "Recepção",
          color: "border-slate-500/30",
          bg: "bg-slate-900/80",
          stats: [
            { label: "Visitantes Hoje", value: "5" },
            { label: "Check-ins", value: "3" },
          ]
        };
      default:
        return {
          icon: <FileText className="w-3 h-3 text-slate-400" />,
          title: "Geral",
          color: "border-slate-500/30",
          bg: "bg-slate-900/80",
          stats: [
            { label: "Visitantes", value: "1" },
            { label: "Entregas", value: "3" },
          ]
        };
    }
  };

  const config = getModuleConfig(type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`absolute pointer-events-none p-2 rounded-lg border shadow-2xl backdrop-blur-sm min-w-[120px] ${config.bg} ${config.color}`}
      style={{ left: x, top: y, zIndex: 500 }}
    >
      <div className="flex items-center gap-1.5 mb-1.5 border-b border-white/10 pb-1">
        {config.icon}
        <span className="text-[10px] font-bold text-white uppercase tracking-wider">{config.title}</span>
      </div>
      <div className="space-y-1.5">
        {config.stats.map((stat, i) => (
          <div key={stat.label} className="flex flex-col">
            <span className="text-[8px] text-white/50 leading-none">{stat.label}</span>
            <span className="text-xs font-mono font-bold text-white">{stat.value}</span>
          </div>
        ))}
      </div>
      
      {/* Decorative pulse element */}
      <div className="absolute -top-1 -right-1 flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
      </div>
    </motion.div>
  );
};
