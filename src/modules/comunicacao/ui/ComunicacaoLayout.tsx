import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useComunicacaoAccess } from "../hooks/useComunicacaoAccess";
import {
  LayoutDashboard, Palette, FileText, MessageSquare, Image as ImageIcon, Calendar, Megaphone,
  Mail, Bell, Lightbulb, ListChecks, Layers, BarChart3, ShieldCheck, Sparkles, FileSignature,
  Package, BookOpen, ExternalLink, Building2, Workflow
} from "lucide-react";
import { CollapsibleModuleSidebar } from "@/modules/aparencia/ui/CollapsibleModuleSidebar";
import { ActiveBrandKitProvider } from "../hooks/useActiveBrandKit";
import { BrandKitSelector } from "./BrandKitSelector";
import { DiretorAgentChat } from "./DiretorAgentChat";

const tabs = [
  { to: "/app/comunicacao", label: "Dashboard", icon: LayoutDashboard, end: true, group: "Visão" },
  { to: "/app/comunicacao/calendario", label: "Calendário Editorial", icon: Calendar, group: "Visão" },

  { to: "/app/comunicacao/marca", label: "Clientes & Marcas", icon: Building2, group: "Marca" },
  { to: "/app/comunicacao/design-studio", label: "Design Studio", icon: Palette, group: "Marca" },
  { to: "/app/comunicacao/imagens-ia", label: "Galeria IA", icon: Sparkles, group: "Marca" },
  { to: "/app/comunicacao/canva", label: "Canva Pro", icon: ExternalLink, group: "Marca" },

  { to: "/app/comunicacao/posts", label: "Gerador de Posts", icon: MessageSquare, group: "Conteúdo IA" },
  { to: "/app/comunicacao/legendas", label: "Gerador de Legendas", icon: FileText, group: "Conteúdo IA" },
  { to: "/app/comunicacao/textos", label: "Gerador de Textos", icon: BookOpen, group: "Conteúdo IA" },
  { to: "/app/comunicacao/carrosseis", label: "Gerador de Carrossel", icon: Layers, group: "Conteúdo IA" },
  { to: "/app/comunicacao/newsletters", label: "Newsletter Builder", icon: Mail, group: "Conteúdo IA" },
  { to: "/app/comunicacao/interna", label: "Comunicação Interna", icon: Bell, group: "Conteúdo IA" },

  { to: "/app/comunicacao/campanhas", label: "Campanhas", icon: Megaphone, group: "Estratégia" },
  { to: "/app/comunicacao/produto", label: "Product Mgmt", icon: Package, group: "Estratégia" },
  { to: "/app/comunicacao/ideias", label: "Banco de Ideias", icon: Lightbulb, group: "Estratégia" },
  { to: "/app/comunicacao/prompts", label: "Banco de Prompts", icon: FileSignature, group: "Estratégia" },

  { to: "/app/comunicacao/aprovacoes", label: "Aprovações", icon: ListChecks, group: "Operação" },
  { to: "/app/comunicacao/publicacoes", label: "Publicações", icon: BarChart3, group: "Operação" },
  { to: "/app/comunicacao/fluxos", label: "Fluxos (n8n)", icon: Workflow, group: "Operação" },
  { to: "/app/comunicacao/integracoes", label: "Integrações Sociais", icon: ExternalLink, group: "Operação" },
  { to: "/app/comunicacao/metricas", label: "Métricas & Insights IA", icon: BarChart3, group: "Operação" },
  { to: "/app/comunicacao/auditoria", label: "Auditoria", icon: ShieldCheck, group: "Operação" },
];

export default function ComunicacaoLayout() {
  const { hasAccess, loading } = useComunicacaoAccess();
  const loc = useLocation();
  if (loading) return null;
  if (!hasAccess) return <Navigate to="/app" replace />;

  return (
    <ActiveBrandKitProvider>
      <div className="flex gap-0 -m-4 md:-m-6 min-h-[calc(100vh-3rem)] rounded-none overflow-hidden">
        <CollapsibleModuleSidebar
          moduleKey="comunicacao"
          moduleTitle="Comunicação OCS"
          moduleSubtitle="ERP OCS · módulo"
          moduleIcon={MessageSquare}
          tabs={tabs}
        />
        <main className="flex-1 min-w-0 overflow-auto bg-background flex flex-col">
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b px-4 md:px-6 py-2 flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground truncate">
              {loc.pathname.split("/").pop() || "dashboard"}
            </div>
            <BrandKitSelector />
          </div>
          <div className="p-4 md:p-6 flex-1">
            <Outlet />
          </div>
        </main>
        <DiretorAgentChat />
      </div>
    </ActiveBrandKitProvider>
  );
}
