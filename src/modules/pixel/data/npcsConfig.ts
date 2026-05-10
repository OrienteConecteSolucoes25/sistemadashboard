import { useEffect, useRef, useState } from "react";
import { Sparkles, LucideIcon, Zap, ShieldAlert, Cpu, HardHat, Scale, HeartHandshake, FileSignature, ShoppingCart, DollarSign, Bot } from "lucide-react";

export interface NpcData {
  id: string;
  name: string;
  moduleKey: string;
  icon: LucideIcon;
  primaryColor: string;
  secondaryColor: string;
  startX: number;
  welcomeMessage: string;
  role: string;
}

export const NPCS_CONFIG: Record<string, NpcData> = {
  jarbas: {
    id: "jarbas",
    name: "Jarbas OCS",
    moduleKey: "jarbas",
    role: "Motor Operacional Inteligente",
    icon: Zap,
    primaryColor: "#0ea5e9",
    secondaryColor: "#0284c7",
    startX: 90,
    welcomeMessage: "Olá! Sou o **Jarbas OCS**. Estou pronto para orientar suas atividades de campo, ler manuais técnicos e guiar seus procedimentos por voz. O que vamos executar agora?"
  },
  ocs_guard: {
    id: "ocs_guard",
    name: "OCS Guard",
    moduleKey: "ocs_guard",
    role: "Agente de Cibersegurança",
    icon: ShieldAlert,
    primaryColor: "#ef4444",
    secondaryColor: "#b91c1c",
    startX: 80,
    welcomeMessage: "Olá! Sou o **OCS Guard**. Sou seu agente de cibersegurança e governança digital. Como posso proteger sua empresa hoje?"
  },
  ti: {
    id: "ti",
    name: "Agente de TI",
    moduleKey: "ti",
    role: "Suporte e Infraestrutura",
    icon: Cpu,
    primaryColor: "#4f46e5",
    secondaryColor: "#3730a3",
    startX: 10,
    welcomeMessage: "Olá! Sou o **Agente de TI OCS**. Posso te ajudar a abrir chamados, diagnosticar problemas e gerenciar ativos. Qual sua demanda técnica?"
  },
  engenharia: {
    id: "engenharia",
    name: "Engenheiro OCS",
    moduleKey: "engenharia",
    role: "Gestão de Projetos e Obras",
    icon: HardHat,
    primaryColor: "#f59e0b",
    secondaryColor: "#d97706",
    startX: 20,
    welcomeMessage: "Olá! Sou o **Engenheiro OCS**. Posso te ajudar com obras, sites, suprimentos, materiais e gestão de projetos técnicos. Como posso te auxiliar na Engenharia hoje?"
  },
  juridico: {
    id: "juridico",
    name: "Consultor Jurídico",
    moduleKey: "juridico",
    role: "Advocacia e Compliance",
    icon: Scale,
    primaryColor: "#3b82f6",
    secondaryColor: "#2563eb",
    startX: 35,
    welcomeMessage: "Olá! Sou o **Consultor Jurídico OCS**. Estou aqui para ajudar com processos, prazos, documentos e governança jurídica. Como posso te apoiar hoje?"
  },
  rhdp: {
    id: "rhdp",
    name: "Diretora de RH/DP",
    moduleKey: "rhdp",
    role: "Recursos Humanos",
    icon: HeartHandshake,
    primaryColor: "#ec4899",
    secondaryColor: "#db2777",
    startX: 50,
    welcomeMessage: "Olá! Sou a **Diretora de RH/DP OCS**. Posso te ajudar com colaboradores, recrutamento, benefícios, folha de pagamento e solicitações de RH. Como posso te ajudar?"
  },
  crea: {
    id: "crea",
    name: "Analista de CREA",
    moduleKey: "crea",
    role: "Conselho Profissional",
    icon: FileSignature,
    primaryColor: "#10b981",
    secondaryColor: "#059669",
    startX: 65,
    welcomeMessage: "Olá! Sou o **Analista de CREA/ART OCS**. Posso te auxiliar com registros de ART, protocolos, certidões e tratativas junto ao conselho. O que você precisa?"
  },
  marketplace: {
    id: "marketplace",
    name: "Gestor Marketplace",
    moduleKey: "marketplace",
    role: "E-commerce e Vendas",
    icon: ShoppingCart,
    primaryColor: "#16a34a",
    secondaryColor: "#166534",
    startX: 42,
    welcomeMessage: "Olá! Sou o **Gestor do Marketplace**. Posso te ajudar a gerenciar sua loja, cadastrar produtos e acompanhar suas vendas e logística. Como posso impulsionar seu negócio hoje?"
  },
  financeiro: {
    id: "financeiro",
    name: "Conselheira Financeira",
    moduleKey: "financeiro",
    role: "Finanças e Contabilidade",
    icon: DollarSign,
    primaryColor: "#3b82f6",
    secondaryColor: "#1d4ed8",
    startX: 28,
    welcomeMessage: "Olá! Sou a **Conselheira Financeira OCS**. Posso te ajudar a gerenciar suas contas, analisar lucros e planejar suas metas, seja você pessoa física ou jurídica. Qual sua dúvida financeira hoje?"
  }
};
