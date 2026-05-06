import { Navigate, Outlet, NavLink, useLocation } from "react-router-dom";
import { useComunicacaoAccess } from "../hooks/useComunicacaoAccess";
import {
  LayoutDashboard, Palette, FileText, MessageSquare, Image as ImageIcon, Calendar, Megaphone,
  Mail, Bell, Lightbulb, ListChecks, Layers, BarChart3, ShieldCheck, Sparkles, FileSignature,
  Package, BookOpen, ExternalLink
} from "lucide-react";

const groups = [
  { label: "Visão", items: [
    { to: "", icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: "calendario", icon: Calendar, label: "Calendário Editorial" },
  ]},
  { label: "Conteúdo IA", items: [
    { to: "posts", icon: MessageSquare, label: "Gerador de Posts" },
    { to: "legendas", icon: FileText, label: "Gerador de Legendas" },
    { to: "textos", icon: BookOpen, label: "Gerador de Textos" },
    { to: "carrosseis", icon: Layers, label: "Gerador de Carrossel" },
    { to: "newsletters", icon: Mail, label: "Newsletter Builder" },
    { to: "interna", icon: Bell, label: "Comunicação Interna" },
  ]},
  { label: "Design", items: [
    { to: "design-studio", icon: Palette, label: "Design Studio" },
    { to: "imagens-ia", icon: Sparkles, label: "Galeria IA" },
    { to: "canva", icon: ExternalLink, label: "Canva Pro" },
  ]},
  { label: "Estratégia", items: [
    { to: "campanhas", icon: Megaphone, label: "Campanhas" },
    { to: "produto", icon: Package, label: "Product Mgmt" },
    { to: "ideias", icon: Lightbulb, label: "Banco de Ideias" },
    { to: "prompts", icon: FileSignature, label: "Banco de Prompts" },
  ]},
  { label: "Operação", items: [
    { to: "aprovacoes", icon: ListChecks, label: "Aprovações" },
    { to: "publicacoes", icon: BarChart3, label: "Publicações" },
    { to: "marca", icon: Palette, label: "Brand Kits" },
    { to: "auditoria", icon: ShieldCheck, label: "Auditoria" },
  ]},
];

export default function ComunicacaoLayout() {
  const { hasAccess, loading } = useComunicacaoAccess();
  const loc = useLocation();
  if (loading) return null;
  if (!hasAccess) return <Navigate to="/app" replace />;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] -m-4 md:-m-6">
      <aside className="w-60 bg-[#1a1f26] text-white flex flex-col p-3 gap-3 overflow-y-auto">
        <div className="px-2 py-3">
          <div className="text-xs uppercase opacity-60">Módulo</div>
          <div className="font-display font-bold text-lg">Comunicação IA</div>
        </div>
        {groups.map((g) => (
          <div key={g.label} className="space-y-1">
            <div className="px-2 text-[10px] uppercase tracking-wider opacity-50">{g.label}</div>
            {g.items.map((it) => {
              const to = `/app/comunicacao${it.to ? "/" + it.to : ""}`;
              const active = it.end ? loc.pathname === to : loc.pathname.startsWith(to);
              const Icon = it.icon;
              return (
                <NavLink
                  key={it.to}
                  to={to}
                  end={it.end}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition ${
                    active ? "bg-[#2BBDC0] text-black font-medium" : "hover:bg-white/5 text-white/80"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {it.label}
                </NavLink>
              );
            })}
          </div>
        ))}
      </aside>
      <main className="flex-1 overflow-auto p-4 md:p-6 bg-background">
        <Outlet />
      </main>
    </div>
  );
}
