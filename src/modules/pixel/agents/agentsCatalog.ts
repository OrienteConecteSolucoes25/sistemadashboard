// Catálogo de agentes — espelha as keys de supabase/functions/verso-agent/knowledge.ts
import {
  Hammer, Users as UsersIcon, FileBadge, DollarSign,
  HeadphonesIcon, Megaphone, Package2, type LucideIcon,
} from "lucide-react";

export type AgentMeta = {
  module_key: string;
  name: string;
  role: string;
  icon: LucideIcon;
  welcome: string;
  /** Módulo no useUserModules necessário para liberar (null = todos). */
  required_module: string | null;
  /** true = só admin OCS (planos). */
  admin_only?: boolean;
};

export const AGENTS_CATALOG: AgentMeta[] = [
  {
    module_key: "engenharia",
    name: "Engenheiro OCS",
    role: "Especialista do módulo Engenharia",
    icon: Hammer,
    welcome: "Olá! Sou o **Engenheiro OCS**. Posso explicar abas, listar obras, KPIs e pendências do seu módulo. Em que ajudo?",
    required_module: "engenharia",
  },
  {
    module_key: "rhdp",
    name: "Diretora RH/DP OCS",
    role: "Especialista em pessoas e folha",
    icon: UsersIcon,
    welcome: "Oi! Sou a **Diretora de RH/DP**. Posso falar de colaboradores, férias, folha e benefícios. Como posso ajudar?",
    required_module: "rhdp",
  },
  {
    module_key: "crea",
    name: "Analista CREA/ART",
    role: "Especialista em conformidade técnica",
    icon: FileBadge,
    welcome: "Olá! Sou o **Analista CREA/ART**. Pergunte sobre RTs, ARTs, anuidades e obras vinculadas.",
    required_module: "crea",
  },
  {
    module_key: "financeiro",
    name: "Conselheira Financeira",
    role: "Especialista em finanças",
    icon: DollarSign,
    welcome: "Bom te ver! Sou a **Conselheira Financeira**. Posso revisar saldos, contas a pagar e KPIs.",
    required_module: "financeiro",
  },
  {
    module_key: "ti",
    name: "Suporte TI",
    role: "Especialista em tickets e ativos",
    icon: HeadphonesIcon,
    welcome: "Olá! Sou o **Suporte TI**. Pergunte sobre chamados, ativos e incidentes.",
    required_module: "ti",
  },
  {
    module_key: "comunicacao",
    name: "Diretor de Marca",
    role: "Especialista em comunicação",
    icon: Megaphone,
    welcome: "Oi! Sou o **Diretor de Marca**. Posso falar de posts, campanhas, brand kits e métricas.",
    required_module: "comunicacao",
  },
  {
    module_key: "planos",
    name: "Gestor de Planos",
    role: "Especialista em pacotes e preços",
    icon: Package2,
    welcome: "Olá! Sou o **Gestor de Planos**. Posso explicar módulos, integrações e calculadora.",
    required_module: null,
    admin_only: true,
  },
];
