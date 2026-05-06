import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Briefcase, Gift, Inbox,
  ClipboardList, FileSignature, Clock, Plane, FileText, BarChart3, HeartHandshake, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserModules } from "@/modules/planos/hooks/useUserModules";
import { useMemo } from "react";

const allTabs = [
  { to: "/app/rh-dp", label: "Dashboard", icon: LayoutDashboard, end: true, group: "Visão geral", moduleKey: "rhdp.base" },
  // RH
  { to: "/app/rh-dp/colaboradores", label: "Colaboradores", icon: Users, group: "RH", moduleKey: "rhdp.rh.colaboradores" },
  { to: "/app/rh-dp/recrutamento", label: "Recrutamento", icon: Briefcase, group: "RH", moduleKey: "rhdp.rh.recrutamento" },
  { to: "/app/rh-dp/beneficios", label: "Benefícios", icon: Gift, group: "RH", moduleKey: "rhdp.rh.beneficios" },
  { to: "/app/rh-dp/solicitacoes", label: "Solicitações", icon: Inbox, group: "RH", moduleKey: "rhdp.rh.solicitacoes" },
  // DP
  { to: "/app/rh-dp/admissao", label: "Admissão & Documentos", icon: ClipboardList, group: "DP", moduleKey: "rhdp.dp.admissao" },
  { to: "/app/rh-dp/contratos", label: "Contratos", icon: FileSignature, group: "DP", moduleKey: "rhdp.dp.contratos" },
  { to: "/app/rh-dp/ponto", label: "Ponto / HE / BH", icon: Clock, group: "DP", moduleKey: "rhdp.dp.ponto" },
  { to: "/app/rh-dp/ferias", label: "Férias & Provisão", icon: Plane, group: "DP", moduleKey: "rhdp.dp.ferias" },
  { to: "/app/rh-dp/folha", label: "Folha & Holerite", icon: FileText, group: "DP", moduleKey: "rhdp.dp.folha" },
  // BI
  { to: "/app/rh-dp/indicadores", label: "Indicadores", icon: BarChart3, group: "BI", moduleKey: "rhdp.bi.indicadores" },
  // Admin
  { to: "/app/rh-dp/permissoes", label: "Permissões", icon: ShieldCheck, group: "Admin", moduleKey: "rhdp.base" },
];

export default function RhdpLayout() {
  const loc = useLocation();
  const { has, ready } = useUserModules();
  const tabs = useMemo(
    () => ready
      ? allTabs.filter(t => t.moduleKey === "rhdp.base" || has(t.moduleKey) || has("rhdp.base"))
      : allTabs,
    [ready, has]
  );
  const groups = Array.from(new Set(tabs.map((t) => t.group)));

  return (
    <div className="flex gap-0 -m-4 md:-m-6 min-h-[calc(100vh-3rem)] rounded-none overflow-hidden">
      <aside className="w-64 shrink-0 hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-4 py-4 border-b border-sidebar-border flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center">
            <HeartHandshake className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-display font-semibold text-sm leading-none">RH/DP</div>
            <div className="text-[11px] text-sidebar-foreground/60 mt-0.5">ERP OCS · base</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-3">
          {groups.map((group) => (
            <div key={group}>
              <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-sidebar-foreground/50">
                {group.toUpperCase()}
              </div>
              <div className="mt-1 space-y-0.5">
                {tabs.filter((t) => t.group === group).map((t) => {
                  const active = t.end ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
                  return (
                    <NavLink
                      key={t.to}
                      to={t.to}
                      end={t.end}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors",
                        active
                          ? "bg-primary text-primary-foreground font-medium shadow-sm"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
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
          Fase 1 — base. Submódulos liberados via plano.
        </div>
      </aside>

      <div className="flex-1 min-w-0 bg-background">
        <nav className="md:hidden flex overflow-x-auto gap-1 border-b px-3 py-2 bg-card">
          {tabs.map((t) => {
            const active = t.end ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
            return (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-xs rounded whitespace-nowrap",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                <t.icon className="w-3 h-3" />
                {t.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
