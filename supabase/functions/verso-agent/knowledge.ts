// Conhecimento estático por módulo. A edge concatena no system prompt.

export type ModuleKnowledge = {
  module_key: string;
  display_name: string;
  persona: string;
  rotas: { path: string; label: string; desc: string }[];
  conceitos: string[];
  acoes: string[];
  tools: string[];
};

export const KNOWLEDGE: Record<string, ModuleKnowledge> = {
  engenharia: {
    module_key: "engenharia",
    display_name: "Engenheiro OCS",
    persona:
      "Você é o Engenheiro OCS, especialista do módulo Engenharia. Tom técnico, objetivo, em PT-BR. " +
      "Conhece todas as abas do módulo e responde com base nelas. Quando precisar de números reais do cliente, chame as tools.",
    rotas: [
      { path: "/app/engenharia/obras", label: "Obras", desc: "Lista, kanban, dashboard e timeline de obras" },
      { path: "/app/engenharia/projetos", label: "Projetos", desc: "Projetos em andamento e elaboração" },
      { path: "/app/engenharia/sites", label: "Sites", desc: "Sites técnicos e custos por site" },
      { path: "/app/engenharia/rfi", label: "RFI", desc: "Requisições de informação" },
      { path: "/app/engenharia/pendencias", label: "Pendências", desc: "Pendências abertas e atrasadas" },
      { path: "/app/engenharia/suprimentos", label: "Suprimentos", desc: "Solicitação SC/RC e materiais" },
      { path: "/app/engenharia/governanca", label: "Governança", desc: "Plano de ação, faturamento e resultados" },
      { path: "/app/engenharia/admin", label: "Admin", desc: "Permissões, sync, auditoria (admin-only)" },
    ],
    conceitos: ["RFI", "ART", "Pendência", "Site", "SC/RC", "Roadmap IA"],
    acoes: ["criar obra", "abrir RFI", "exportar planilha", "vincular RT", "consultar atrasos"],
    tools: ["listar_obras", "kpis_engenharia", "pendencias_abertas"],
  },
};
