export const STATUS_RT = ["ativo", "inativo", "afastado", "encerrado"] as const;
export const STATUS_RT_LABEL: Record<string, string> = {
  ativo: "Ativo", inativo: "Inativo", afastado: "Afastado", encerrado: "Encerrado",
};

export const MODELOS_CONTRATO = ["clt", "pj"] as const;
export const MODELO_LABEL: Record<string, string> = { clt: "CLT", pj: "PJ" };

export const ANUIDADE = ["paga", "nao_paga"] as const;
export const ANUIDADE_LABEL: Record<string, string> = { paga: "Paga", nao_paga: "Não paga" };

export type RtPessoa = {
  id: string;
  company_id: string;
  nome: string;
  cpf: string;
  uf: string;
  status: string;
  data_inicio: string | null;
  data_termino: string | null;
  termino_indefinido: boolean;
  modelo_contrato: string;
  visto: string;
  rnp: string;
  registro: string;
  observacao: string;
  anuidade: string;
  anuidade_ano: number | null;
  inclusao_ativa: boolean;
  created_at: string;
  updated_at: string;
};

export const UFS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR",
  "PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
] as const;

export const PLANILHA_HEADERS_RT = [
  "Nome", "CPF", "UF", "Status", "Data início", "Data término", "Modelo contrato",
  "Visto", "RNP", "Registro", "Anuidade", "Ano anuidade", "Inclusão ativa", "Observação",
  "Região (login)", "Senha (login)", "Observação (login)",
] as const;

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, "_");

const HEADER_TO_FIELD: Record<string, keyof RtPessoa | "termino_indefinido" | null> = {
  nome: "nome",
  cpf: "cpf",
  uf: "uf", estado: "uf",
  status: "status",
  data_inicio: "data_inicio", inicio: "data_inicio", "data_de_inicio": "data_inicio",
  data_termino: "data_termino", termino: "data_termino", "data_de_termino": "data_termino", fim: "data_termino",
  modelo_contrato: "modelo_contrato", contrato: "modelo_contrato", "modelo_de_contrato": "modelo_contrato",
  visto: "visto",
  rnp: "rnp",
  registro: "registro",
  anuidade: "anuidade",
  ano_anuidade: "anuidade_ano", anuidade_ano: "anuidade_ano", ano: "anuidade_ano",
  inclusao_ativa: "inclusao_ativa", inclusao: "inclusao_ativa", ativa: "inclusao_ativa",
  observacao: "observacao", observacoes: "observacao",
};

export function headerToFieldRt(h: string): keyof RtPessoa | null {
  return (HEADER_TO_FIELD[norm(String(h ?? ""))] as any) ?? null;
}

export function normalizeStatusRt(v: any): string {
  const s = String(v ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!s) return "ativo";
  if (s.startsWith("ativ")) return "ativo";
  if (s.startsWith("inativ")) return "inativo";
  if (s.startsWith("afast")) return "afastado";
  if (s.startsWith("encerr") || s.startsWith("desli")) return "encerrado";
  return s;
}

export function normalizeModelo(v: any): string {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return "clt";
  if (s === "pj" || s.includes("juridic") || s.includes("pessoa jur")) return "pj";
  return "clt";
}

export function normalizeAnuidade(v: any): string {
  const s = String(v ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!s) return "nao_paga";
  if (s.includes("nao") || s.includes("pend") || s === "n") return "nao_paga";
  if (s === "sim" || s === "s" || s.includes("pag") || s.includes("ok")) return "paga";
  return "nao_paga";
}

export function parseDateOrIndef(v: any): { date: string | null; indef: boolean } {
  if (v === null || v === undefined || v === "") return { date: null, indef: false };
  const s = String(v).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (s.includes("indef") || s === "—" || s === "-" || s === "n/a") return { date: null, indef: true };
  // reuse logic
  if (v instanceof Date && !isNaN(v.getTime())) return { date: v.toISOString().slice(0, 10), indef: false };
  if (typeof v === "number") {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return { date: isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10), indef: false };
  }
  const m = String(v).match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let yyyy = m[3]; if (yyyy.length === 2) yyyy = "20" + yyyy;
    return { date: `${yyyy}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`, indef: false };
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(String(v))) return { date: String(v).slice(0, 10), indef: false };
  const d = new Date(String(v));
  return { date: isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10), indef: false };
}

export function fmtDateBr(s: string | null | undefined) {
  if (!s) return "—";
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
}

export function maskCpf(s: string): string {
  const d = String(s ?? "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}
