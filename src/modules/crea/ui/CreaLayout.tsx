import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileSignature, FileStack, Users, Building2, KeyRound, ScrollText,
  Award, FileMinus, FolderOpen, MessageSquare, BookOpen, CalendarClock, Bot, Link as LinkIcon, ShieldCheck, HardHat, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserModules } from "@/modules/planos/hooks/useUserModules";
import { useMemo } from "react";
import { CollapsibleModuleSidebar } from "@/modules/aparencia/ui/CollapsibleModuleSidebar";

const allTabs = [
  { to: "/app/crea", label: "Dashboard", icon: LayoutDashboard, end: true, group: "Visão geral", moduleKey: "crea.base" },
  { to: "/app/crea/arts", label: "ARTs", icon: FileSignature, group: "Operação", moduleKey: "crea.arts" },
  { to: "/app/crea/protocolos", label: "Protocolos", icon: FileStack, group: "Operação", moduleKey: "crea.protocolos" },
  { to: "/app/crea/cats", label: "CATs / Acervo", icon: Award, group: "Operação", moduleKey: "crea.cats" },
  { to: "/app/crea/certidoes", label: "Certidões", icon: ScrollText, group: "Operação", moduleKey: "crea.certidoes" },
  { to: "/app/crea/baixas", label: "Baixas", icon: FileMinus, group: "Operação", moduleKey: "crea.baixas" },
  { to: "/app/crea/tratativas", label: "Tratativas", icon: MessageSquare, group: "Operação", moduleKey: "crea.tratativas" },
  { to: "/app/crea/prazos", label: "Prazos", icon: CalendarClock, group: "Operação", moduleKey: "crea.prazos" },
  { to: "/app/crea/rts", label: "Responsáveis Técnicos", icon: Users, group: "Cadastros", moduleKey: "crea.rts" },
  { to: "/app/crea/empresas", label: "Empresas e CREAs", icon: Building2, group: "Cadastros", moduleKey: "crea.empresas" },
  { to: "/app/crea/documentos", label: "Documentações", icon: FolderOpen, group: "Cadastros", moduleKey: "crea.documentos" },
  { to: "/app/crea/credenciais", label: "Credenciais", icon: KeyRound, group: "Segurança", moduleKey: "crea.credenciais" },
  { to: "/app/crea/normas", label: "Normas e Regras", icon: BookOpen, group: "Conhecimento", moduleKey: "crea.normas" },
  { to: "/app/crea/links", label: "Links Oficiais", icon: LinkIcon, group: "Conhecimento", moduleKey: "crea.links" },
  { to: "/app/crea/assistente", label: "Assistente IA", icon: Bot, group: "Conhecimento", moduleKey: "crea.assistente" },
  { to: "/app/crea/auditoria", label: "Auditoria", icon: ShieldCheck, group: "Admin", moduleKey: "crea.auditoria" },
  { to: "/app/crea/admin", label: "Admin", icon: Settings, group: "Admin", moduleKey: "crea.base" },
];

export default function CreaLayout() {
  const loc = useLocation();
  const { has, ready } = useUserModules();
  const tabs = useMemo(() => ready
    ? allTabs.filter(t => t.moduleKey === "crea.base" || has(t.moduleKey) || has("crea.base"))
    : allTabs, [ready, has]);

  return (
    <div className="flex gap-0 -m-4 md:-m-6 min-h-[calc(100vh-3rem)] rounded-none overflow-hidden">
      <CollapsibleModuleSidebar
        moduleKey="crea"
        moduleTitle="CREA & ART"
        moduleSubtitle="ERP OCS · módulo"
        moduleIcon={HardHat}
        tabs={tabs.map(t => ({ to: t.to, label: t.label, icon: t.icon, end: t.end, group: t.group }))}
      />
      <div className="flex-1 min-w-0 bg-background">
        <nav className="md:hidden flex overflow-x-auto gap-1 border-b px-3 py-2 bg-card pl-12">
          {tabs.map(t => {
            const active = t.end ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
            return (
              <NavLink key={t.to} to={t.to} end={t.end}
                className={cn("flex items-center gap-1 px-2 py-1 text-xs rounded whitespace-nowrap",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                <t.icon className="w-3 h-3" />{t.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 lg:p-6 min-w-0"><Outlet /></div>
      </div>
    </div>
  );
}
