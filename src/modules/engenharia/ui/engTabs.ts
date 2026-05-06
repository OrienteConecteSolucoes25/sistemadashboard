import { LayoutDashboard, ShieldCheck, MapPin, FolderKanban, ListTodo, FileQuestion, AlertTriangle, Users, Boxes, FileText, Building2, Zap, Cable, ShoppingCart, FileSignature, Mail, Settings2, Database, Brain, Activity, ShieldAlert, Shield } from "lucide-react";

export type EngTab = {
  to: string;
  label: string;
  icon: any;
  end?: boolean;
  group: "Visão" | "Operação" | "Suprimentos & Doc" | "Sistema";
  /** chave no plan_modules_catalog. Se omitido, item é "sistema" e só admin vê. */
  moduleKey?: string;
  /** se true, sempre visível (não depende de plano). */
  systemOnly?: boolean;
};

export const ENG_TABS: EngTab[] = [
  { to: "/app/engenharia", label: "Dashboard", icon: LayoutDashboard, end: true, group: "Visão", moduleKey: "eng.dashboard" },
  { to: "/app/engenharia/governanca", label: "Governança", icon: ShieldCheck, group: "Visão", moduleKey: "eng.governanca" },

  { to: "/app/engenharia/obras", label: "Obras", icon: MapPin, group: "Operação", moduleKey: "eng.sites" },
  { to: "/app/engenharia/projetos", label: "Projetos", icon: FolderKanban, group: "Operação", moduleKey: "eng.projetos" },
  { to: "/app/engenharia/demandas", label: "Demandas", icon: ListTodo, group: "Operação", moduleKey: "eng.demandas" },
  { to: "/app/engenharia/atividades", label: "Atividades", icon: Activity, group: "Operação", moduleKey: "eng.atividades" },
  { to: "/app/engenharia/rfi", label: "RFI", icon: FileQuestion, group: "Operação", moduleKey: "eng.rfi" },
  { to: "/app/engenharia/pendencias", label: "Pendências", icon: AlertTriangle, group: "Operação", moduleKey: "eng.pendencias" },
  { to: "/app/engenharia/equipes", label: "Equipes", icon: Users, group: "Operação", moduleKey: "eng.equipes" },
  { to: "/app/engenharia/fibra", label: "Fibra (obras)", icon: Cable, group: "Operação", moduleKey: "eng.fibra" },
  { to: "/app/engenharia/energia", label: "Ligações de Energia", icon: Zap, group: "Operação", moduleKey: "eng.energia" },

  { to: "/app/engenharia/materiais", label: "Materiais", icon: Boxes, group: "Suprimentos & Doc", moduleKey: "eng.materiais" },
  { to: "/app/engenharia/suprimentos", label: "Suprimentos", icon: ShoppingCart, group: "Suprimentos & Doc", moduleKey: "eng.suprimentos" },
  { to: "/app/engenharia/art", label: "ART", icon: FileSignature, group: "Suprimentos & Doc", moduleKey: "eng.art" },
  { to: "/app/engenharia/relatorios", label: "Relatórios", icon: FileText, group: "Suprimentos & Doc", moduleKey: "eng.relatorios" },
  { to: "/app/engenharia/emails", label: "E-mails (log)", icon: Mail, group: "Suprimentos & Doc", moduleKey: "eng.emails" },

  { to: "/app/engenharia/integracoes", label: "Integrações", icon: Database, group: "Sistema", systemOnly: true },
  { to: "/app/engenharia/roadmap-ia", label: "Roadmap IA", icon: Brain, group: "Sistema", systemOnly: true },
  { to: "/app/engenharia/configuracoes", label: "Configurações", icon: Settings2, group: "Sistema", systemOnly: true },
  { to: "/app/engenharia/admin", label: "Admin · Engenharia", icon: Shield, group: "Sistema", systemOnly: true },
  { to: "/app/engenharia/rastreabilidade", label: "Rastreabilidade", icon: ShieldAlert, group: "Sistema", systemOnly: true },
];
