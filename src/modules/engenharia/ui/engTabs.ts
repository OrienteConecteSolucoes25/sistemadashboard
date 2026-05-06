import { LayoutDashboard, ShieldCheck, MapPin, FolderKanban, ListTodo, FileQuestion, AlertTriangle, Users, Boxes, FileText, Building2, Zap, Cable, ShoppingCart, FileSignature, Mail, Settings2, Database, Brain, Activity, ShieldAlert } from "lucide-react";

export type EngTab = {
  to: string;
  label: string;
  icon: any;
  end?: boolean;
  group: "Visão" | "Operação" | "Suprimentos & Doc" | "Sistema";
};

export const ENG_TABS: EngTab[] = [
  { to: "/app/engenharia", label: "Dashboard", icon: LayoutDashboard, end: true, group: "Visão" },
  { to: "/app/engenharia/governanca", label: "Governança", icon: ShieldCheck, group: "Visão" },

  { to: "/app/engenharia/sites", label: "Sites", icon: MapPin, group: "Operação" },
  { to: "/app/engenharia/projetos", label: "Projetos", icon: FolderKanban, group: "Operação" },
  { to: "/app/engenharia/demandas", label: "Demandas", icon: ListTodo, group: "Operação" },
  { to: "/app/engenharia/atividades", label: "Atividades", icon: Activity, group: "Operação" },
  { to: "/app/engenharia/rfi", label: "RFI", icon: FileQuestion, group: "Operação" },
  { to: "/app/engenharia/pendencias", label: "Pendências", icon: AlertTriangle, group: "Operação" },
  { to: "/app/engenharia/equipes", label: "Equipes", icon: Users, group: "Operação" },
  { to: "/app/engenharia/fibra", label: "Fibra (obras)", icon: Cable, group: "Operação" },
  { to: "/app/engenharia/energia", label: "Ligações de Energia", icon: Zap, group: "Operação" },

  { to: "/app/engenharia/materiais", label: "Materiais", icon: Boxes, group: "Suprimentos & Doc" },
  { to: "/app/engenharia/suprimentos", label: "Suprimentos", icon: ShoppingCart, group: "Suprimentos & Doc" },
  { to: "/app/engenharia/art", label: "ART", icon: FileSignature, group: "Suprimentos & Doc" },
  { to: "/app/engenharia/relatorios", label: "Relatórios", icon: FileText, group: "Suprimentos & Doc" },
  { to: "/app/engenharia/emails", label: "E-mails (log)", icon: Mail, group: "Suprimentos & Doc" },

  { to: "/app/engenharia/integracoes", label: "Integrações", icon: Database, group: "Sistema" },
  { to: "/app/engenharia/roadmap-ia", label: "Roadmap IA", icon: Brain, group: "Sistema" },
  { to: "/app/engenharia/configuracoes", label: "Configurações", icon: Settings2, group: "Sistema" },
  { to: "/app/engenharia/admin", label: "Admin · Engenharia", icon: Shield, group: "Sistema" },
  { to: "/app/engenharia/rastreabilidade", label: "Rastreabilidade", icon: ShieldAlert, group: "Sistema" },
];
