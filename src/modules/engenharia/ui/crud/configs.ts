import type { CrudConfig } from "./types";

const STATUS_PADRAO = ["aberta", "em_andamento", "concluida", "cancelada"];
const PRIORIDADES = ["alta", "media", "baixa"];

export const SITES_CONFIG: CrudConfig = {
  table: "eng_sites",
  title: "Sites",
  description: "Locais de obra / instalação.",
  fields: [
    { key: "codigo", label: "Código", type: "text" },
    { key: "nome", label: "Nome", type: "text", required: true },
    { key: "cidade", label: "Cidade", type: "text" },
    { key: "uf", label: "UF", type: "text" },
    { key: "status", label: "Status", type: "select", options: ["em_aprovacao", "ativo", "concluido", "pausado"] },
    { key: "responsavel", label: "Responsável", type: "text" },
    { key: "latitude", label: "Latitude", type: "number", inList: false },
    { key: "longitude", label: "Longitude", type: "number", inList: false },
  ],
};

export const PROJETOS_CONFIG: CrudConfig = {
  table: "eng_projetos",
  title: "Projetos",
  description: "Projetos de engenharia.",
  fields: [
    { key: "nome", label: "Nome", type: "text", required: true },
    { key: "cliente", label: "Cliente", type: "text" },
    { key: "status", label: "Status", type: "select", options: ["em_andamento", "concluido", "pausado", "cancelado"] },
  ],
};

export const DEMANDAS_CONFIG: CrudConfig = {
  table: "eng_demandas",
  title: "Demandas",
  description: "Demandas técnicas e de campo.",
  fields: [
    { key: "titulo", label: "Título", type: "text", required: true },
    { key: "descricao", label: "Descrição", type: "textarea" },
    { key: "responsavel", label: "Responsável", type: "text" },
    { key: "prioridade", label: "Prioridade", type: "select", options: PRIORIDADES },
    { key: "status", label: "Status", type: "select", options: STATUS_PADRAO },
    { key: "prazo", label: "Prazo", type: "date" },
  ],
};

export const ATIVIDADES_CONFIG: CrudConfig = {
  table: "eng_atividades",
  title: "Atividades",
  description: "Atividades dos projetos.",
  fields: [
    { key: "titulo", label: "Título", type: "text", required: true },
    { key: "descricao", label: "Descrição", type: "textarea" },
    { key: "responsavel", label: "Responsável", type: "text" },
    { key: "status", label: "Status", type: "select", options: STATUS_PADRAO },
    { key: "prazo", label: "Prazo", type: "date" },
  ],
};

export const RFI_CONFIG: CrudConfig = {
  table: "eng_rfi",
  title: "RFI",
  description: "Pedidos de informação técnica.",
  fields: [
    { key: "numero", label: "Número", type: "text" },
    { key: "assunto", label: "Assunto", type: "text", required: true },
    { key: "descricao", label: "Descrição", type: "textarea" },
    { key: "status", label: "Status", type: "select", options: ["aberta", "respondida", "fechada"] },
    { key: "prazo", label: "Prazo", type: "date" },
  ],
};

export const PENDENCIAS_CONFIG: CrudConfig = {
  table: "eng_pendencias",
  title: "Pendências",
  description: "Itens em aberto exigindo ação.",
  fields: [
    { key: "titulo", label: "Título", type: "text", required: true },
    { key: "responsavel", label: "Responsável", type: "text" },
    { key: "prioridade", label: "Prioridade", type: "select", options: PRIORIDADES },
    { key: "status", label: "Status", type: "select", options: STATUS_PADRAO },
    { key: "prazo", label: "Prazo", type: "date" },
  ],
};

export const EQUIPES_CONFIG: CrudConfig = {
  table: "eng_equipes",
  title: "Equipes",
  description: "Equipes técnicas e alocação.",
  fields: [
    { key: "nome", label: "Nome", type: "text", required: true },
    { key: "lider", label: "Líder", type: "text" },
    { key: "status", label: "Status", type: "select", options: ["ativa", "inativa", "alocada"] },
  ],
};

export const FIBRA_CONFIG: CrudConfig = {
  table: "eng_fibra_obras",
  title: "Fibra (obras)",
  description: "Obras de fibra óptica.",
  fields: [
    { key: "nome", label: "Nome", type: "text", required: true },
    { key: "status", label: "Status", type: "select", options: ["planejada", "em_execucao", "concluida"] },
  ],
};

export const ENERGIA_CONFIG: CrudConfig = {
  table: "eng_ligacoes_energia",
  title: "Ligações de Energia",
  description: "Pedidos de ligação junto às concessionárias.",
  fields: [
    { key: "protocolo", label: "Protocolo", type: "text" },
    { key: "concessionaria", label: "Concessionária", type: "text" },
    { key: "status", label: "Status", type: "select", options: ["solicitada", "em_analise", "aprovada", "ligada", "rejeitada"] },
    { key: "data_solicitacao", label: "Data solicitação", type: "date" },
    { key: "data_ligacao", label: "Data ligação", type: "date" },
  ],
};

export const MATERIAIS_CONFIG: CrudConfig = {
  table: "eng_materiais",
  title: "Materiais",
  description: "Estoque e reservas por site.",
  fields: [
    { key: "descricao", label: "Descrição", type: "text", required: true },
    { key: "unidade", label: "Unidade", type: "text" },
    { key: "estoque", label: "Estoque", type: "number" },
    { key: "reservado", label: "Reservado", type: "number" },
  ],
};

export const SUPRIMENTOS_CONFIG: CrudConfig = {
  table: "eng_suprimentos",
  title: "Suprimentos",
  description: "Solicitações de compras.",
  fields: [
    { key: "numero", label: "Número", type: "text" },
    { key: "descricao", label: "Descrição", type: "textarea" },
    { key: "solicitante", label: "Solicitante", type: "text" },
    { key: "responsavel", label: "Responsável (compras)", type: "text" },
    { key: "status", label: "Status", type: "select", options: ["aberta", "em_cotacao", "comprada", "recebida", "cancelada"] },
    { key: "prazo", label: "Prazo", type: "date" },
  ],
};

export const ART_CONFIG: CrudConfig = {
  table: "eng_art",
  title: "ART",
  description: "Anotações de Responsabilidade Técnica.",
  fields: [
    { key: "numero", label: "Número", type: "text" },
    { key: "responsavel_tecnico", label: "Responsável técnico", type: "text" },
    { key: "data_emissao", label: "Data emissão", type: "date" },
    { key: "valor", label: "Valor", type: "number" },
    { key: "status", label: "Status", type: "select", options: ["emitida", "paga", "cancelada"] },
  ],
};

export const RELATORIOS_CONFIG: CrudConfig = {
  table: "eng_relatorios",
  title: "Relatórios",
  description: "Diários, técnicos e inspeções.",
  fields: [
    { key: "titulo", label: "Título", type: "text", required: true },
    { key: "tipo", label: "Tipo", type: "select", options: ["diario", "tecnico", "inspecao", "outro"] },
    { key: "autor", label: "Autor", type: "text" },
    { key: "data", label: "Data", type: "date" },
  ],
};

export const EMAILS_CONFIG: CrudConfig = {
  table: "eng_emails_log",
  title: "E-mails (log)",
  description: "Log de e-mails enviados pelo sistema.",
  fields: [
    { key: "destinatario", label: "Destinatário", type: "text" },
    { key: "assunto", label: "Assunto", type: "text" },
    { key: "status", label: "Status", type: "select", options: ["enviado", "falhou", "pendente"] },
  ],
};

export const INTEGRACOES_CONFIG: CrudConfig = {
  table: "eng_integracoes",
  title: "Integrações",
  description: "Configuração de integrações externas.",
  fields: [
    { key: "chave", label: "Chave", type: "text", required: true },
    { key: "descricao", label: "Descrição", type: "textarea" },
    { key: "ativa", label: "Ativa", type: "boolean" },
  ],
};

export const ROADMAP_CONFIG: CrudConfig = {
  table: "eng_roadmap_ia",
  title: "Roadmap IA",
  description: "Iniciativas de inteligência artificial.",
  fields: [
    { key: "titulo", label: "Título", type: "text", required: true },
    { key: "descricao", label: "Descrição", type: "textarea" },
    { key: "area", label: "Área", type: "text" },
    { key: "prioridade", label: "Prioridade", type: "select", options: PRIORIDADES },
    { key: "status", label: "Status", type: "select", options: ["idea", "validando", "em_dev", "em_producao", "descartada"] },
  ],
};

export const FIELD_OPTIONS_CONFIG: CrudConfig = {
  table: "eng_field_options",
  title: "Configurações (opções de campos)",
  description: "Opções de listas usadas no sistema.",
  orderBy: { column: "field_key", ascending: true },
  fields: [
    { key: "field_key", label: "Chave do campo", type: "text", required: true, placeholder: "ex: rfi_status" },
    { key: "value", label: "Valor", type: "text", required: true },
    { key: "label", label: "Rótulo", type: "text" },
    { key: "ordem", label: "Ordem", type: "number" },
    { key: "ativo", label: "Ativo", type: "boolean" },
  ],
};
