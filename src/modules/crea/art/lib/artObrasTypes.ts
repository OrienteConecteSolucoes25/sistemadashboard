export const UFS_BR = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

export const TIPOS_OBRA = ["civil", "eletrica"] as const;
export const TIPOS_OBRA_LABEL: Record<string, string> = {
  civil: "Civil",
  eletrica: "Elétrica",
};

export const STATUS_OBRA = [
  "pendente",
  "em_andamento",
  "aguardando_assinatura",
  "concluida",
  "cancelada",
] as const;
export const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  aguardando_assinatura: "Aguardando assinatura",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export type ArtObra = {
  id: string;
  company_id: string;
  obra: string;
  tipo_obra: string;
  cidade: string;
  uf: string;
  escopo: string;
  cliente: string;
  coordenador: string;
  status: string;
  observacao: string;
  responsavel: string | null;
  data_criacao_art: string | null;
  data_validacao: string | null;
  data_envio_pagamento: string | null;
  data_pasta: string | null;
  created_at: string;
  updated_at: string;
};

/** Cabeçalhos exatos da planilha-modelo (aba "ART"). */
export const PLANILHA_HEADERS = [
  "SITE",
  "CIVIL/ELETRICA",
  "Cidade",
  "UF",
  "Escopo",
  "Cliente",
  "Responsável",
  "STATUS",
  "Data de criação de ART",
  "VALIDADA",
  "ENVIADA P/PAGAMENTO",
  "PASTA",
  "Coordenador",
  "Observações",
] as const;

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, "_");

/** Mapa header normalizado -> campo da tabela */
const HEADER_TO_FIELD: Record<string, keyof ArtObra | null> = {
  site: "obra",
  obra: "obra",
  "civil/eletrica": "tipo_obra",
  tipo: "tipo_obra",
  "tipo_de_obra": "tipo_obra",
  cidade: "cidade",
  uf: "uf",
  escopo: "escopo",
  cliente: "cliente",
  responsavel: "responsavel",
  status: "status",
  "data_de_criacao_de_art": "data_criacao_art",
  "data_criacao_art": "data_criacao_art",
  validada: "data_validacao",
  "data_validacao": "data_validacao",
  "enviada_p/pagamento": "data_envio_pagamento",
  "envio_pagamento": "data_envio_pagamento",
  "data_envio_pagamento": "data_envio_pagamento",
  pasta: "data_pasta",
  "data_pasta": "data_pasta",
  coordenador: "coordenador",
  observacoes: "observacao",
  observacao: "observacao",
};

export function headerToField(h: string): keyof ArtObra | null {
  return HEADER_TO_FIELD[norm(String(h ?? "").replace(/\.$/, ""))] ?? null;
}

/** Normaliza valor de tipo_obra vindo da planilha. */
export function normalizeTipoObra(v: any): string {
  const s = String(v ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!s) return "civil";
  if (s.startsWith("ele")) return "eletrica";
  if (s.startsWith("civ")) return "civil";
  return s;
}

/** Normaliza status vindo da planilha. */
export function normalizeStatus(v: any): string {
  const s = String(v ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!s) return "pendente";
  if (s.includes("conclu")) return "concluida";
  if (s.includes("cancel")) return "cancelada";
  if (s.includes("aguard") && s.includes("assin")) return "aguardando_assinatura";
  if (s.includes("andamento")) return "em_andamento";
  if (s.includes("pend")) return "pendente";
  return s.replace(/\s+/g, "_");
}

/** Converte "dd/mm/yyyy" ou Date/ISO em "yyyy-mm-dd" ou null. */
export function parseDate(v: any): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return null;
    return v.toISOString().slice(0, 10);
  }
  if (typeof v === "number") {
    // serial date Excel
    const ms = Math.round((v - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    let yyyy = m[3]; if (yyyy.length === 2) yyyy = "20" + yyyy;
    return `${yyyy}-${mm}-${dd}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export function fmtDateBr(s: string | null | undefined) {
  if (!s) return "—";
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  return `${m[3]}/${m[2]}/${m[1]}`;
}
