import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileSignature, FileStack, Users, Building2, KeyRound, ScrollText,
  Award, FileMinus, FolderOpen, MessageSquare, BookOpen, CalendarClock, Bot, Link as LinkIcon, ShieldCheck, HardHat
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserModules } from "@/modules/planos/hooks/useUserModules";
import { useMemo } from "react";

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
];

export default function CreaLayout() {
  const loc = useLocation();
  const { has, ready } = useUserModules();
  const tabs = useMemo(() => ready
    ? allTabs.filter(t => t.moduleKey === "crea.base" || has(t.moduleKey) || has("crea.base"))
    : allTabs, [ready, has]);
  const groups = Array.from(new Set(tabs.map(t => t.group)));

  return (
    <div className="flex gap-0 -m-4 md:-m-6 min-h-[calc(100vh-3rem)] rounded-none overflow-hidden">
      <aside className="w-64 shrink-0 hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-4 py-4 border-b border-sidebar-border flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center">
            <HardHat className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-display font-semibold text-sm leading-none">CREA & ART</div>
            <div className="text-[11px] text-sidebar-foreground/60 mt-0.5">ERP OCS · módulo</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-3">
          {groups.map(group => (
            <div key={group}>
              <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-sidebar-foreground/50">
                {group.toUpperCase()}
              </div>
              <div className="mt-1 space-y-0.5">
                {tabs.filter(t => t.group === group).map(t => {
                  const active = t.end ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
                  return (
                    <NavLink key={t.to} to={t.to} end={t.end}
                      className={cn("flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors",
                        active ? "bg-primary text-primary-foreground font-medium shadow-sm"
                               : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground")}>
                      <t.icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{t.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-sidebar-border text-[10px] text-sidebar-foreground/50">
          Base ativa. Sub-abas conforme plano.
        </div>
      </aside>
      <div className="flex-1 min-w-0 bg-background">
        <nav className="md:hidden flex overflow-x-auto gap-1 border-b px-3 py-2 bg-card">
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
        <div className="p-4 lg:p-6"><Outlet /></div>
      </div>
    </div>
  );
}
