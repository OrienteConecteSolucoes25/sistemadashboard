import type { CrudConfig } from "@/modules/engenharia/ui/crud/types";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const STATUS_ART = ["nao_iniciada","em_emissao","emitida","paga","registrada","baixada","cancelada"];
const STATUS_PROT = ["aberto","em_exigencia","deferido","indeferido","arquivado"];
const STATUS_GEN = ["ativo","pendente","concluido","cancelado"];

export const ARTS_CFG: CrudConfig = {
  table: "crea_arts", title: "ARTs", description: "Anotações de Responsabilidade Técnica.",
  fields: [
    { key: "numero", label: "Número", type: "text", required: true },
    { key: "uf", label: "UF", type: "select", options: UFS },
    { key: "contratante", label: "Contratante", type: "text" },
    { key: "contratado", label: "Contratado", type: "text" },
    { key: "escopo", label: "Escopo", type: "textarea", inList: false },
    { key: "setor", label: "Setor", type: "text", inList: false },
    { key: "data_emissao", label: "Emissão", type: "date" },
    { key: "data_pagamento", label: "Pagamento", type: "date", inList: false },
    { key: "data_baixa", label: "Baixa", type: "date" },
    { key: "valor", label: "Valor (R$)", type: "number", inList: false },
    { key: "status", label: "Status", type: "select", options: STATUS_ART },
    { key: "link", label: "Link", type: "text", inList: false },
    { key: "observacoes", label: "Observações", type: "textarea", inList: false },
  ],
  searchKeys: ["numero","contratante","contratado","escopo"],
};

export const PROTOCOLOS_CFG: CrudConfig = {
  table: "crea_protocols", title: "Protocolos", description: "Protocolos abertos junto aos CREAs.",
  fields: [
    { key: "numero", label: "Número", type: "text", required: true },
    { key: "uf", label: "UF", type: "select", options: UFS },
    { key: "tipo", label: "Tipo", type: "text" },
    { key: "data_abertura", label: "Abertura", type: "date" },
    { key: "prazo_esperado", label: "Prazo", type: "date" },
    { key: "status", label: "Status", type: "select", options: STATUS_PROT },
    { key: "exigencia", label: "Exigência", type: "textarea", inList: false },
    { key: "tratativa", label: "Tratativa", type: "textarea", inList: false },
    { key: "link", label: "Link", type: "text", inList: false },
    { key: "login_relacionado", label: "Login relacionado", type: "text", inList: false },
  ],
  searchKeys: ["numero","tipo","exigencia","tratativa"],
};

export const CATS_CFG: CrudConfig = {
  table: "crea_cats", title: "CATs", description: "Certidões de Acervo Técnico.",
  fields: [
    { key: "numero", label: "Número", type: "text" },
    { key: "uf", label: "UF", type: "select", options: UFS },
    { key: "tipo", label: "Tipo", type: "text" },
    { key: "status", label: "Status", type: "select", options: STATUS_GEN },
    { key: "data_solicitacao", label: "Solicitação", type: "date" },
    { key: "data_emissao", label: "Emissão", type: "date" },
    { key: "atestado", label: "Atestado", type: "textarea", inList: false },
    { key: "link", label: "Link", type: "text", inList: false },
    { key: "observacoes", label: "Observações", type: "textarea", inList: false },
  ],
  searchKeys: ["numero","tipo","atestado"],
};

export const CERTIDOES_CFG: CrudConfig = {
  table: "crea_certificates", title: "Certidões", description: "Certidões CREA por empresa e RT.",
  fields: [
    { key: "tipo", label: "Tipo", type: "text", required: true },
    { key: "uf", label: "UF", type: "select", options: UFS },
    { key: "numero", label: "Número", type: "text" },
    { key: "data_emissao", label: "Emissão", type: "date" },
    { key: "validade", label: "Validade", type: "date" },
    { key: "status", label: "Status", type: "select", options: STATUS_GEN },
    { key: "link", label: "Link", type: "text", inList: false },
    { key: "observacoes", label: "Observações", type: "textarea", inList: false },
  ],
  searchKeys: ["tipo","numero"],
};

export const BAIXAS_CFG: CrudConfig = {
  table: "crea_deregistrations", title: "Baixas", description: "Baixas de ART, RT e vínculos.",
  fields: [
    { key: "tipo", label: "Tipo", type: "text", required: true },
    { key: "uf", label: "UF", type: "select", options: UFS },
    { key: "data_solicitada", label: "Solicitada", type: "date" },
    { key: "data_concluida", label: "Concluída", type: "date" },
    { key: "status", label: "Status", type: "select", options: ["pendente","em_andamento","concluida","cancelada"] },
    { key: "observacoes", label: "Observações", type: "textarea", inList: false },
  ],
  searchKeys: ["tipo","observacoes"],
};

export const TRATATIVAS_CFG: CrudConfig = {
  table: "crea_treatments", title: "Tratativas", description: "Histórico de comunicação com CREA, engenheiros e empresas.",
  fields: [
    { key: "tipo", label: "Tipo", type: "text" },
    { key: "canal", label: "Canal", type: "select", options: ["email","telefone","whatsapp","portal","presencial"] },
    { key: "data_evento", label: "Data", type: "date" },
    { key: "prazo", label: "Prazo", type: "date" },
    { key: "descricao", label: "Descrição", type: "textarea", required: true, full: true },
    { key: "proximo_passo", label: "Próximo passo", type: "textarea", inList: false },
  ],
  searchKeys: ["tipo","descricao","proximo_passo"],
};

export const PRAZOS_CFG: CrudConfig = {
  table: "crea_deadlines", title: "Prazos", description: "Prazos centralizados do módulo CREA.",
  fields: [
    { key: "tipo", label: "Tipo", type: "text", required: true },
    { key: "prazo", label: "Prazo", type: "date", required: true },
    { key: "status", label: "Status", type: "select", options: ["aberto","cumprido","vencido","cancelado"] },
    { key: "observacoes", label: "Observações", type: "textarea", inList: false },
  ],
  searchKeys: ["tipo","observacoes"],
};

export const RTS_CFG: CrudConfig = {
  table: "crea_responsible_technicians", title: "Responsáveis Técnicos", description: "RTs vinculados às empresas.",
  fields: [
    { key: "empresa_vinculada", label: "Empresa", type: "text", required: true },
    { key: "setor", label: "Setor", type: "text" },
    { key: "status", label: "Status", type: "select", options: STATUS_GEN },
    { key: "inicio_vinculo", label: "Início", type: "date" },
    { key: "fim_vinculo", label: "Fim", type: "date" },
    { key: "observacoes", label: "Observações", type: "textarea", inList: false },
  ],
  searchKeys: ["empresa_vinculada","setor"],
};

export const ENGENHEIROS_CFG: CrudConfig = {
  table: "crea_engineers", title: "Engenheiros", description: "Cadastro de engenheiros responsáveis.",
  fields: [
    { key: "nome", label: "Nome", type: "text", required: true },
    { key: "crea", label: "Nº CREA", type: "text" },
    { key: "uf", label: "UF", type: "select", options: UFS },
    { key: "modalidade", label: "Modalidade", type: "text" },
    { key: "titulo", label: "Título", type: "text" },
    { key: "email", label: "E-mail", type: "text" },
    { key: "telefone", label: "Telefone", type: "text" },
    { key: "status", label: "Status", type: "select", options: STATUS_GEN },
    { key: "cpf_mask", label: "CPF (mascarado)", type: "text", inList: false },
  ],
  searchKeys: ["nome","crea","email"],
};

export const EMPRESAS_CFG: CrudConfig = {
  table: "crea_companies_crea", title: "Empresas e CREAs", description: "Vínculos empresa × CREA por UF.",
  fields: [
    { key: "empresa", label: "Empresa", type: "text", required: true },
    { key: "cnpj", label: "CNPJ", type: "text" },
    { key: "uf", label: "UF", type: "select", options: UFS },
    { key: "registro", label: "Registro", type: "text" },
    { key: "visto", label: "Visto", type: "text", inList: false },
    { key: "status", label: "Status", type: "select", options: STATUS_GEN },
    { key: "validade", label: "Validade", type: "date" },
    { key: "link_portal", label: "Portal", type: "text", inList: false },
    { key: "observacoes", label: "Observações", type: "textarea", inList: false },
  ],
  searchKeys: ["empresa","cnpj","registro"],
};

export const DOCUMENTOS_CFG: CrudConfig = {
  table: "crea_documents", title: "Documentações", description: "Documentos exigidos por escopo / UF / CREA.",
  fields: [
    { key: "nome", label: "Nome", type: "text", required: true },
    { key: "tipo", label: "Tipo", type: "text" },
    { key: "uf", label: "UF", type: "select", options: UFS },
    { key: "escopo", label: "Escopo", type: "text" },
    { key: "obrigatorio", label: "Obrigatório", type: "boolean" },
    { key: "validade", label: "Validade", type: "date" },
    { key: "status", label: "Status", type: "select", options: STATUS_GEN },
    { key: "modelo_url", label: "Modelo (URL)", type: "text", inList: false },
    { key: "anexo_url", label: "Anexo (URL)", type: "text", inList: false },
    { key: "observacoes", label: "Observações", type: "textarea", inList: false },
  ],
  searchKeys: ["nome","tipo","escopo"],
};

export const NORMAS_CFG: CrudConfig = {
  table: "crea_norms", title: "Normas e Regras", description: "DN, PL, resoluções Confea/CREA por UF.",
  fields: [
    { key: "tipo", label: "Tipo", type: "text" },
    { key: "numero", label: "Número", type: "text" },
    { key: "ano", label: "Ano", type: "number" },
    { key: "orgao", label: "Órgão", type: "text" },
    { key: "uf", label: "UF", type: "select", options: ["BR", ...UFS] },
    { key: "tema", label: "Tema", type: "text" },
    { key: "resumo", label: "Resumo", type: "textarea", full: true, inList: false },
    { key: "link", label: "Link", type: "text", inList: false },
    { key: "data_vigencia", label: "Vigência", type: "date" },
    { key: "status", label: "Status", type: "select", options: ["vigente","revogada","substituida"] },
  ],
  searchKeys: ["tipo","numero","tema","resumo"],
};

export const LINKS_CFG: CrudConfig = {
  table: "crea_links_oficiais", title: "Links Oficiais", description: "Portais e links oficiais por UF.",
  fields: [
    { key: "uf", label: "UF", type: "select", options: UFS, required: true },
    { key: "portal_principal", label: "Portal", type: "text" },
    { key: "portal_servicos", label: "Serviços", type: "text" },
    { key: "consulta_art", label: "Consulta ART", type: "text", inList: false },
    { key: "consulta_cat", label: "Consulta CAT", type: "text", inList: false },
    { key: "certidoes", label: "Certidões", type: "text", inList: false },
    { key: "protocolo", label: "Protocolo", type: "text", inList: false },
    { key: "atendimento", label: "Atendimento", type: "text", inList: false },
    { key: "normas", label: "Normas", type: "text", inList: false },
    { key: "observacoes", label: "Observações", type: "textarea", inList: false },
  ],
  searchKeys: ["uf","portal_principal"],
};
