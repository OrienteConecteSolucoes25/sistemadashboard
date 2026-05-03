import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Scale, Clock, FileText, Users, ListChecks, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const tabs = [
  { to: "/app/juridico", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/juridico/processos", label: "Processos", icon: Scale },
  { to: "/app/juridico/prazos", label: "Prazos", icon: Clock },
  { to: "/app/juridico/documentos", label: "Documentos", icon: FileText },
  { to: "/app/juridico/responsaveis", label: "Responsáveis", icon: Users },
  { to: "/app/juridico/tarefas", label: "Tarefas", icon: ListChecks },
  { to: "/app/juridico/relatorios", label: "Relatórios", icon: BarChart3 },
];

const JuridicoLayout = () => {
  const loc = useLocation();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Jurídico</h1>
          <p className="text-sm text-muted-foreground">
            Estrutura inicial — dados mockados, sem produção.
          </p>
        </div>
        <Badge variant="outline">etapa 1 / mock</Badge>
      </div>

      <nav className="flex flex-wrap gap-1 border-b">
        {tabs.map((t) => {
          const active = t.end ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
          return (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={`flex items-center gap-2 px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
                active
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </NavLink>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
};

export default JuridicoLayout;
