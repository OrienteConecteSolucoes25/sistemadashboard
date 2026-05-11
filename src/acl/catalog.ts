/**
 * Catálogo central de módulos / abas / sub-abas do ERP OCS.
 *
 * Toda nova aba ou sub-aba criada em qualquer módulo precisa ser registrada
 * aqui — o ADM → Visibilidade lê este arquivo, sincroniza as entradas em
 * `acl_permissions_catalog` e passa a permitir que o admin libere a permissão
 * por usuário.
 *
 * Convenção de chave:
 *   - Acesso ao módulo:  `<modulo>.acessar`
 *   - Aba dentro do módulo: `<modulo>.<aba>.visualizar` (+ `.editar`, `.excluir` quando faz sentido)
 *   - Sub-aba: `<modulo>.<aba>.<subaba>.visualizar`
 */

export type CatalogEntry = {
  key: string;
  module: string;
  resource: string;     // "_modulo" | "<aba>" | "<aba>.<subaba>"
  action: string;       // "acessar" | "visualizar" | "editar" | "excluir" | "gerenciar" | ...
  label: string;
  description?: string;
  ordem: number;
};

type ModuleDef = {
  module: string;
  label: string;
  ordem: number;
  /** Tabs visíveis no módulo (cada uma vira `module.tab.visualizar`). */
  tabs: { key: string; label: string; actions?: string[]; subTabs?: { key: string; label: string; actions?: string[] }[] }[];
};

const DEFAULT_TAB_ACTIONS = ["visualizar"];

const MODULES: ModuleDef[] = [
  { module: "visao_geral", label: "Visão Geral", ordem: 10, tabs: [] },
  { module: "pixel_office", label: "Soluções-Verso", ordem: 20, tabs: [] },
  { module: "jarbas", label: "Jarbas", ordem: 30, tabs: [] },
  { module: "ti", label: "TI & Suporte", ordem: 40, tabs: [] },
  { module: "compliance", label: "Compliance", ordem: 50, tabs: [] },
  {
    module: "engenharia", label: "Engenharia", ordem: 60,
    tabs: [
      { key: "dashboard", label: "Dashboard" },
      { key: "governanca", label: "Governança" },
      { key: "projetos", label: "Projetos / Elaboração" },
      { key: "fibra", label: "Fibra" },
      { key: "suprimentos", label: "Suprimentos" },
      { key: "obras", label: "Obras" },
      { key: "atividades", label: "Atividades" },
      { key: "demandas", label: "Demandas" },
      { key: "rfi", label: "RFI" },
      { key: "pendencias", label: "Pendências" },
      { key: "energia", label: "Energia" },
      { key: "art", label: "ART" },
      { key: "fornecedores", label: "Fornecedores" },
      { key: "sites_deluxe", label: "Sites Deluxe" },
      { key: "materiais_deluxe", label: "Materiais Deluxe" },
      { key: "relatorios", label: "Relatórios" },
      { key: "emails", label: "E-mails" },
      { key: "integracoes", label: "Integrações" },
      { key: "roadmap", label: "Roadmap" },
      { key: "configuracoes", label: "Configurações" },
      { key: "rastreabilidade", label: "Rastreabilidade" },
      { key: "admin", label: "Admin" },
    ],
  },
  {
    module: "juridico", label: "Jurídico", ordem: 70,
    tabs: [
      { key: "dashboard", label: "Dashboard" },
      { key: "processos", label: "Processos" },
      { key: "prazos", label: "Prazos" },
      { key: "documentos", label: "Documentos" },
      { key: "responsaveis", label: "Responsáveis" },
      { key: "tarefas", label: "Tarefas" },
      { key: "relatorios", label: "Relatórios" },
    ],
  },
  {
    module: "rhdp", label: "RH/DP", ordem: 80,
    tabs: [
      { key: "dashboard", label: "Dashboard" },
      { key: "colaboradores", label: "Colaboradores" },
      { key: "folha", label: "Folha" },
      { key: "beneficios", label: "Benefícios" },
      { key: "ferias", label: "Férias" },
      { key: "solicitacoes", label: "Solicitações" },
      { key: "recrutamento", label: "Recrutamento" },
      { key: "indicadores", label: "Indicadores" },
    ],
  },
  {
    module: "crea", label: "CREA & ART", ordem: 90,
    tabs: [
      { key: "dashboard", label: "Dashboard" },
      { key: "arts", label: "ARTs", actions: ["visualizar","criar","editar","excluir"] },
      { key: "cats", label: "CATs / Acervo" },
      { key: "certidoes", label: "Certidões" },
      { key: "baixas", label: "Baixas" },
      { key: "rts", label: "Responsáveis Técnicos", subTabs: [
        { key: "pessoas", label: "Pessoas" },
        { key: "logins", label: "Login" },
      ]},
      { key: "empresas", label: "Empresas" },
      { key: "documentos", label: "Documentações" },
      { key: "normas", label: "Normas e Regras" },
      { key: "assistente", label: "Assistente IA" },
      { key: "governanca", label: "Governança ART" },
      { key: "credenciais", label: "Credenciais", actions: ["visualizar","gerenciar"] },
      { key: "admin", label: "Admin" },
    ],
  },
  {
    module: "comunicacao", label: "Comunicação OCS", ordem: 100,
    tabs: [
      { key: "dashboard", label: "Dashboard" },
      { key: "campanhas", label: "Campanhas" },
      { key: "canais", label: "Canais" },
      { key: "integracoes_sociais", label: "Integrações Sociais" },
      { key: "relatorios", label: "Relatórios" },
    ],
  },
  {
    module: "planos", label: "Planos", ordem: 110,
    tabs: [
      { key: "empresas", label: "Empresas" },
      { key: "calculadora", label: "Calculadora" },
      { key: "visao_geral", label: "Visão Geral" },
      { key: "minha_empresa", label: "Minha Empresa" },
    ],
  },
  {
    module: "aparencia", label: "Aparência & Marca", ordem: 120,
    tabs: [
      { key: "tema", label: "Tema" },
      { key: "branding", label: "Branding" },
    ],
  },
  {
    module: "adm", label: "ADM — Visibilidade", ordem: 130,
    tabs: [
      { key: "permissoes", label: "Permissões" },
      { key: "marca_empresa", label: "Marca por empresa" },
    ],
  },
  {
    module: "marketplace", label: "Marketplace", ordem: 140,
    tabs: [
      { key: "dashboard", label: "Dashboard" },
      { key: "solucoes", label: "Soluções" },
    ],
  },
];

export function buildCatalog(): CatalogEntry[] {
  const out: CatalogEntry[] = [];
  for (const m of MODULES) {
    out.push({
      key: `${m.module}.acessar`,
      module: m.module,
      resource: "_modulo",
      action: "acessar",
      label: `${m.label} — Acessar`,
      description: `Acesso ao módulo ${m.label}.`,
      ordem: m.ordem,
    });
    let i = 0;
    for (const t of m.tabs) {
      const actions = t.actions ?? DEFAULT_TAB_ACTIONS;
      for (const action of actions) {
        out.push({
          key: `${m.module}.${t.key}.${action}`,
          module: m.module,
          resource: t.key,
          action,
          label: `${t.label} — ${capitalize(action)}`,
          description: `Aba "${t.label}" do módulo ${m.label}.`,
          ordem: m.ordem + ++i,
        });
      }
      if (t.subTabs) {
        for (const st of t.subTabs) {
          const subActions = st.actions ?? DEFAULT_TAB_ACTIONS;
          for (const action of subActions) {
            out.push({
              key: `${m.module}.${t.key}.${st.key}.${action}`,
              module: m.module,
              resource: `${t.key}.${st.key}`,
              action,
              label: `${t.label} › ${st.label} — ${capitalize(action)}`,
              description: `Sub-aba "${st.label}" dentro de "${t.label}" (${m.label}).`,
              ordem: m.ordem + ++i,
            });
          }
        }
      }
    }
  }
  return out;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
