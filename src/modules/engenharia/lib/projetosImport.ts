import { parseExcelDate } from "./storage";

export interface Projeto {
  id: string;
  cliente: string; site: string; cidade: string; uf: string;
  responsavel_solicitante: string; projetista: string;
  local_elaboracao: string; escopo_generico: string; escopo: string;
  descricao: string; status: string;
  data_solicitacao: string; prazo_conclusao: string;
  prioridade: string; tempo_previsto: string;
  data_inicio_real: string; data_termino_real: string;
  tempo_real: string; dentro_prazo: string;
  tempo_resposta_previsto: number | null; tempo_resposta_real: number | null;
  diferenca_tempo: number | null; peso: number | null;
  conta: string; delta_horas: number | null;
  observacao: string; link_pasta: string;
}

export const PROJETO_HEADERS = [
  "CLIENTE","SITE","CIDADE","UF","RESPONSÁVEL SOLICITANTE","PROJETISTA",
  "LOCAL DA ELABORAÇÃO","ESCOPO GENÉRICO","ESCOPO","DESCRIÇÃO","STATUS",
  "DATA DE SOLICIT.COORD.","PRAZO DE CONCLUSÃO","PRIORIDADE",
  "TEMPO MÉDIO DE EXECUÇÃO PREVISTO","DATA DE INÍCIO REAL","DATA DE TÉRMINO REAL",
  "TEMPO MÉDIO DE EXECUÇÃO REAL","DENTRO DO PRAZO",
  "TEMPO DE RESPOSTA","TEMPO DE RESPOSTA REAL","DIFERENÇA DE TEMPO",
  "PESO","CONTA","DELTA HORAS","OBSERVAÇÃO","LINK DA PASTA",
] as const;

function k(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

function pick(row: Record<string, unknown>, ...labels: string[]): string {
  const map: Record<string, unknown> = {};
  for (const key of Object.keys(row)) map[k(key)] = row[key];
  for (const l of labels) {
    const v = map[k(l)];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function num(v: string): number | null {
  if (!v) return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function toHHMM(v: unknown): string {
  if (v == null || v === "") return "";
  if (typeof v === "number" && isFinite(v) && v < 1) {
    const totalMin = Math.round(v * 24 * 60);
    const h = Math.floor(totalMin / 60); const m = totalMin % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  const s = String(v).trim();
  const iso = s.match(/T(\d{2}):(\d{2})/);
  if (iso) return `${iso[1]}:${iso[2]}`;
  const hm = s.match(/(\d{1,2}):(\d{2})/);
  if (hm) return `${hm[1].padStart(2, "0")}:${hm[2]}`;
  if (/^\d+$/.test(s)) return `${s.padStart(2, "0")}:00`;
  return s;
}

export function rowToProjeto(row: Record<string, unknown>, id: string): Projeto {
  return {
    id,
    cliente: pick(row, "CLIENTE", "Cliente", "Nome do Cliente"),
    site: pick(row, "SITE", "Site", "SITE/OBRA", "NOME DO SITE", "ID Site", "Localizador"),
    cidade: pick(row, "CIDADE", "Cidade", "Município", "Municipio"),
    uf: pick(row, "UF", "Estado", "ESTADO").toUpperCase(),
    responsavel_solicitante: pick(row, "RESPONSÁVEL SOLICITANTE", "Solicitante", "RESPONSÁVEL", "Responsável"),
    projetista: pick(row, "PROJETISTA", "Desenhista", "Responsável Projeto"),
    local_elaboracao: pick(row, "LOCAL DA ELABORAÇÃO", "Local"),
    escopo_generico: pick(row, "ESCOPO GENÉRICO", "Tipo Genérico", "Categoria"),
    escopo: pick(row, "ESCOPO", "Tipo", "Serviço"),
    descricao: pick(row, "DESCRIÇÃO", "Descricao", "Observações"),
    status: pick(row, "STATUS", "Status do Projeto", "Situação"),
    data_solicitacao: parseExcelDate(pick(row, "DATA DE SOLICIT.COORD.", "Data Solicitação", "Data de Solicitação")),
    prazo_conclusao: parseExcelDate(pick(row, "PRAZO DE CONCLUSÃO", "Prazo Final")),
    prioridade: pick(row, "PRIORIDADE"),
    tempo_previsto: toHHMM(pick(row, "TEMPO MÉDIO DE EXECUÇÃO PREVISTO", "Tempo previsto")),
    data_inicio_real: parseExcelDate(pick(row, "DATA DE INÍCIO REAL", "Início Real")),
    data_termino_real: parseExcelDate(pick(row, "DATA DE TÉRMINO REAL", "Término Real", "Conclusão")),
    tempo_real: toHHMM(pick(row, "TEMPO MÉDIO DE EXECUÇÃO REAL", "Tempo real")),
    dentro_prazo: pick(row, "DENTRO DO PRAZO", "No Prazo"),
    tempo_resposta_previsto: num(pick(row, "TEMPO DE RESPOSTA")),
    tempo_resposta_real: num(pick(row, "TEMPO DE RESPOSTA REAL")),
    diferenca_tempo: num(pick(row, "DIFERENÇA DE TEMPO")),
    peso: num(pick(row, "PESO")),
    conta: pick(row, "CONTA", "Centro de Custo"),
    delta_horas: num(pick(row, "DELTA HORAS")),
    observacao: pick(row, "OBSERVAÇÃO", "Obs", "Notas"),
    link_pasta: pick(row, "LINK DA PASTA", "Link", "URL"),
  };
}

export function hmToHours(s: string): number {
  if (!s) return 0;
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return 0;
  return Number(m[1]) + Number(m[2]) / 60;
}

export function computeDerived(p: Projeto): Projeto {
  const out = { ...p };
  if (!out.dentro_prazo && out.data_termino_real && out.prazo_conclusao) {
    const term = new Date(out.data_termino_real).getTime();
    const prz = new Date(out.prazo_conclusao).getTime();
    out.dentro_prazo = term <= prz ? "DENTRO" : "FORA";
  }
  if (out.tempo_resposta_previsto == null && out.data_solicitacao && out.prazo_conclusao) {
    const a = new Date(out.data_solicitacao).getTime();
    const b = new Date(out.prazo_conclusao).getTime();
    out.tempo_resposta_previsto = Math.round((b - a) / 86400000);
  }
  if (out.tempo_resposta_real == null && out.data_solicitacao && out.data_termino_real) {
    const a = new Date(out.data_solicitacao).getTime();
    const b = new Date(out.data_termino_real).getTime();
    out.tempo_resposta_real = Math.round((b - a) / 86400000);
  }
  if (out.diferenca_tempo == null && out.tempo_resposta_real != null && out.tempo_resposta_previsto != null) {
    out.diferenca_tempo = out.tempo_resposta_real - out.tempo_resposta_previsto;
  }
  if (out.delta_horas == null && out.tempo_previsto && out.tempo_real) {
    out.delta_horas = +(hmToHours(out.tempo_previsto) - hmToHours(out.tempo_real)).toFixed(2);
  }
  return out;
}

export function projetoToExportRow(p: Projeto): Record<string, unknown> {
  return {
    "CLIENTE": p.cliente, "SITE": p.site, "CIDADE": p.cidade, "UF": p.uf,
    "RESPONSÁVEL SOLICITANTE": p.responsavel_solicitante,
    "PROJETISTA": p.projetista, "LOCAL DA ELABORAÇÃO": p.local_elaboracao,
    "ESCOPO GENÉRICO": p.escopo_generico, "ESCOPO": p.escopo,
    "DESCRIÇÃO": p.descricao, "STATUS": p.status,
    "DATA DE SOLICIT.COORD.": p.data_solicitacao, "PRAZO DE CONCLUSÃO": p.prazo_conclusao,
    "PRIORIDADE": p.prioridade, "TEMPO MÉDIO DE EXECUÇÃO PREVISTO": p.tempo_previsto,
    "DATA DE INÍCIO REAL": p.data_inicio_real, "DATA DE TÉRMINO REAL": p.data_termino_real,
    "TEMPO MÉDIO DE EXECUÇÃO REAL": p.tempo_real, "DENTRO DO PRAZO": p.dentro_prazo,
    "TEMPO DE RESPOSTA": p.tempo_resposta_previsto ?? "",
    "TEMPO DE RESPOSTA REAL": p.tempo_resposta_real ?? "",
    "DIFERENÇA DE TEMPO": p.diferenca_tempo ?? "", "PESO": p.peso ?? "",
    "CONTA": p.conta, "DELTA HORAS": p.delta_horas ?? "",
    "OBSERVAÇÃO": p.observacao, "LINK DA PASTA": p.link_pasta,
  };
}

export function emptyProjeto(): Projeto {
  return {
    id: "", cliente: "", site: "", cidade: "", uf: "",
    responsavel_solicitante: "", projetista: "", local_elaboracao: "INTERNO",
    escopo_generico: "", escopo: "", descricao: "",
    status: "NÃO INICIADA", data_solicitacao: "", prazo_conclusao: "", prioridade: "",
    tempo_previsto: "", data_inicio_real: "", data_termino_real: "",
    tempo_real: "", dentro_prazo: "",
    tempo_resposta_previsto: null, tempo_resposta_real: null, diferenca_tempo: null,
    peso: null, conta: "", delta_horas: null, observacao: "", link_pasta: "",
  };
}

export const DEF_CLIENTES = ["HIGHLINE","ATC","IHS","QMC","TBSA","SBA","WINITY","NEOENERGIA","NOVA CORRENTE","CLARO","HUAWEI","REDE BAHIA"];
export const DEF_ESCOPOS_GENERICOS = ["PROJETO SHELTER","CONFERÊNCIA DE PROJETO","PROJETO ASBUILT","CROQUI IMPERM.","CROQUI DO SITE COM FACHADA","CROQUI DO SITE","MAPEAMENTO EV","MAPEAMENTO FD","CONFERÊNCIA PROJETO DE MAP. EV","PROJETO DE MANUTENÇÃO","PROJETO DE PEÇAS","REVISÃO DE PROJETO"];
export const DEF_PROJETISTAS = ["BRUNO VASCONCELLOS","BRENDA GONÇALVES","ESTÉFANE SANTOS"];
export const DEF_SOLICITANTES = ["JOÃO VÍCTOR","MIRLA CALDAS","THAINE LIMA","ARTHUR SAMPAIO","REINAN IBRAIM","BRUNO VASCONCELLOS","ANA PAULA","MATHEUS FREITAS","GABRIELA ARGOLO","GUSTAVO OLIVEIRA","BRENDA GONÇALVES","JECILENY PEIXOTO"];
export const DEF_STATUS = ["CONCLUÍDO", "EM ANDAMENTO", "NÃO INICIADA", "CANCELADA", "ON HOLD"];
export const DEF_LOCAL = ["INTERNO", "EXTERNO"];
export const DEF_PRIORIDADE = ["BAIXA", "MÉDIA", "ALTA", "URGENTE", "OK"];
export const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
