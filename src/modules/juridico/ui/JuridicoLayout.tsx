import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Scale, Clock, FileText, Users, ListChecks, BarChart3, Gavel } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserModules } from "@/modules/planos/hooks/useUserModules";
import { useMemo } from "react";
import { CollapsibleModuleSidebar } from "@/modules/aparencia/ui/CollapsibleModuleSidebar";

const allTabs = [
  { to: "/app/juridico", label: "Dashboard", icon: LayoutDashboard, end: true, group: "Visão geral", moduleKey: "jur.dashboard" },
  { to: "/app/juridico/processos", label: "Processos", icon: Scale, group: "Operação", moduleKey: "jur.processos" },
  { to: "/app/juridico/prazos", label: "Prazos", icon: Clock, group: "Operação", moduleKey: "jur.prazos" },
  { to: "/app/juridico/tarefas", label: "Tarefas", icon: ListChecks, group: "Operação", moduleKey: "jur.tarefas" },
  { to: "/app/juridico/documentos", label: "Documentos", icon: FileText, group: "Acervo", moduleKey: "jur.documentos" },
  { to: "/app/juridico/responsaveis", label: "Responsáveis", icon: Users, group: "Acervo", moduleKey: "jur.responsaveis" },
  { to: "/app/juridico/relatorios", label: "Relatórios", icon: BarChart3, group: "Análise", moduleKey: "jur.relatorios" },
];

const JuridicoLayout = () => {
  const loc = useLocation();
  const { has, ready } = useUserModules();
  const tabs = useMemo(() => ready ? allTabs.filter(t => has(t.moduleKey)) : allTabs, [ready, has]);

  return (
    <div className="flex gap-0 -m-4 md:-m-6 min-h-[calc(100vh-3rem)] rounded-none overflow-hidden">
      <CollapsibleModuleSidebar
        moduleKey="juridico"
        moduleTitle="Jurídico"
        moduleSubtitle="ERP OCS"
        moduleIcon={Gavel}
        tabs={tabs.map(t => ({ to: t.to, label: t.label, icon: t.icon, end: t.end, group: t.group }))}
      />
      <div className="flex-1 min-w-0 bg-background">
        <nav className="md:hidden flex overflow-x-auto gap-1 border-b px-3 py-2 bg-card pl-12">
          {tabs.map((t) => {
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
};

export default JuridicoLayout;
