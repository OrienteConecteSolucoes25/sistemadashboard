import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useComunicacaoAccess } from "../hooks/useComunicacaoAccess";
import {
  LayoutDashboard, Palette, FileText, MessageSquare, Image as ImageIcon, Calendar, Megaphone,
  Mail, Bell, Lightbulb, ListChecks, Layers, BarChart3, ShieldCheck, Sparkles, FileSignature,
  Package, BookOpen, ExternalLink
} from "lucide-react";
import { CollapsibleModuleSidebar } from "@/modules/aparencia/ui/CollapsibleModuleSidebar";

const tabs = [
  { to: "/app/comunicacao", label: "Dashboard", icon: LayoutDashboard, end: true, group: "Visão" },
  { to: "/app/comunicacao/calendario", label: "Calendário Editorial", icon: Calendar, group: "Visão" },

  { to: "/app/comunicacao/posts", label: "Gerador de Posts", icon: MessageSquare, group: "Conteúdo IA" },
  { to: "/app/comunicacao/legendas", label: "Gerador de Legendas", icon: FileText, group: "Conteúdo IA" },
  { to: "/app/comunicacao/textos", label: "Gerador de Textos", icon: BookOpen, group: "Conteúdo IA" },
  { to: "/app/comunicacao/carrosseis", label: "Gerador de Carrossel", icon: Layers, group: "Conteúdo IA" },
  { to: "/app/comunicacao/newsletters", label: "Newsletter Builder", icon: Mail, group: "Conteúdo IA" },
  { to: "/app/comunicacao/interna", label: "Comunicação Interna", icon: Bell, group: "Conteúdo IA" },

  { to: "/app/comunicacao/design-studio", label: "Design Studio", icon: Palette, group: "Design" },
  { to: "/app/comunicacao/imagens-ia", label: "Galeria IA", icon: Sparkles, group: "Design" },
  { to: "/app/comunicacao/canva", label: "Canva Pro", icon: ExternalLink, group: "Design" },

  { to: "/app/comunicacao/campanhas", label: "Campanhas", icon: Megaphone, group: "Estratégia" },
  { to: "/app/comunicacao/produto", label: "Product Mgmt", icon: Package, group: "Estratégia" },
  { to: "/app/comunicacao/ideias", label: "Banco de Ideias", icon: Lightbulb, group: "Estratégia" },
  { to: "/app/comunicacao/prompts", label: "Banco de Prompts", icon: FileSignature, group: "Estratégia" },

  { to: "/app/comunicacao/aprovacoes", label: "Aprovações", icon: ListChecks, group: "Operação" },
  { to: "/app/comunicacao/publicacoes", label: "Publicações", icon: BarChart3, group: "Operação" },
  { to: "/app/comunicacao/marca", label: "Brand Kits", icon: Palette, group: "Operação" },
  { to: "/app/comunicacao/auditoria", label: "Auditoria", icon: ShieldCheck, group: "Operação" },
];

export default function ComunicacaoLayout() {
  const { hasAccess, loading } = useComunicacaoAccess();
  if (loading) return null;
  if (!hasAccess) return <Navigate to="/app" replace />;

  return (
    <div className="flex gap-0 -m-4 md:-m-6 min-h-[calc(100vh-3rem)] rounded-none overflow-hidden">
      <CollapsibleModuleSidebar
        moduleKey="comunicacao"
        moduleTitle="Comunicação OCS"
        moduleSubtitle="ERP OCS · módulo"
        moduleIcon={MessageSquare}
        tabs={tabs}
      />
      <main className="flex-1 min-w-0 overflow-auto p-4 md:p-6 bg-background">
        <Outlet />
      </main>
    </div>
  );
}
