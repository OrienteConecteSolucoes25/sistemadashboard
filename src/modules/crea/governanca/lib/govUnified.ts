import { supabase } from "@/integrations/supabase/client";
import { GovFilters } from "./govTypes";

const sb: any = supabase;

/** Linha unificada para Visão Executiva (origina-se de qualquer das 3 tabelas). */
export type GovUnifiedRow = {
  id: string;
  source: "servicos" | "art_bloco" | "relatorio_crea";
  numero: string | null;
  uf: string | null;
  cidade: string | null;
  nome_obra: string | null;
  rt_nome: string | null;
  contratante: string | null;
  empresa: string | null;
  status: string | null;
  valor: number | null;
  data: string | null; // ISO yyyy-mm-dd
  raw: any;
};

const ilike = (s: string) => `%${s.trim()}%`;

function toDate(v: any): string | null {
  if (!v) return null;
  const s = String(v);
  // tenta ISO primeiro
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // dd/mm/yyyy
  const b = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (b) {
    let [, dd, mm, yy] = b;
    if (yy.length === 2) yy = (Number(yy) > 70 ? "19" : "20") + yy;
    return `${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return null;
}

function toNumber(v: any): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return v;
  let s = String(v).replace(/[R$\s]/g, "");
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = Number(s);
  return isFinite(n) ? n : null;
}

function inDateRange(d: string | null, de?: string, ate?: string) {
  if (!d) return !de && !ate;
  if (de && d < de) return false;
  if (ate && d > ate) return false;
  return true;
}

function inYearMonth(d: string | null, ano?: number, mes?: number) {
  if (!ano && !mes) return true;
  if (!d) return false;
  const y = Number(d.slice(0, 4));
  const m = Number(d.slice(5, 7));
  if (ano && y !== ano) return false;
  if (mes && m !== mes) return false;
  return true;
}

function matchesText(row: GovUnifiedRow, f: GovFilters) {
  const lc = (s: any) => String(s ?? "").toLowerCase();
  if (f.uf && !lc(row.uf).includes(f.uf.toLowerCase())) return false;
  if (f.cidade && !lc(row.cidade).includes(f.cidade.toLowerCase())) return false;
  if (f.nome_obra && !lc(row.nome_obra).includes(f.nome_obra.toLowerCase())) return false;
  if (f.rt_nome && !lc(row.rt_nome).includes(f.rt_nome.toLowerCase())) return false;
  if (f.numero && !lc(row.numero).includes(f.numero.toLowerCase())) return false;
  return true;
}

async function fetchAll(table: string, companyId: string): Promise<any[]> {
  const out: any[] = [];
  let from = 0;
  const size = 1000;
  while (true) {
    const { data, error } = await sb
      .from(table).select("*")
      .eq("company_id", companyId).eq("is_deleted", false)
      .range(from, from + size - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < size) break;
    from += size;
  }
  return out;
}

export async function fetchGovUnified(companyId: string, f: GovFilters): Promise<GovUnifiedRow[]> {
  const [serv, bloco, rel] = await Promise.all([
    fetchAll("crea_gov_servicos", companyId).catch(() => []),
    fetchAll("crea_gov_art_bloco", companyId).catch(() => []),
    fetchAll("crea_gov_relatorio_crea", companyId).catch(() => []),
  ]);

  const rows: GovUnifiedRow[] = [];

  serv.forEach((r: any) => rows.push({
    id: r.id, source: "servicos",
    numero: r.numero ?? null,
    uf: null,
    cidade: null,
    nome_obra: r.endereco ?? null,
    rt_nome: null,
    contratante: r.contratante ?? null,
    empresa: r.empresa ?? null,
    status: r.analise ?? r.baixa ?? null,
    valor: null,
    data: toDate(r.cadastro) ?? toDate(r.pagamento),
    raw: r,
  }));

  bloco.forEach((r: any) => {
    const end = r.endereco_obra ?? r.endereco_contrato ?? null;
    const cidade = end ? (String(end).match(/-\s*([A-Za-zÀ-ú\s]+)\s*\/\s*[A-Z]{2}/)?.[1]?.trim() ?? null) : null;
    const uf = end ? (String(end).match(/\/\s*([A-Z]{2})\b/)?.[1] ?? null) : null;
    rows.push({
      id: r.id, source: "art_bloco",
      numero: r.numero_art ?? null,
      uf,
      cidade,
      nome_obra: end,
      rt_nome: r.responsavel_tecnico ?? null,
      contratante: r.contratante ?? null,
      empresa: null,
      status: r.situacao ?? r.atendido ?? null,
      valor: toNumber(r.valor_art ?? r.valor_pago ?? r.valor_contrato),
      data: toDate(r.data_inicio) ?? toDate(r.celebrado_em) ?? toDate(r.data_solicitacao),
      raw: r,
    });
  });

  rel.forEach((r: any) => {
    const end = r.enderecos ?? null;
    const cidade = end ? (String(end).match(/-\s*([A-Za-zÀ-ú\s]+)\s*\/\s*[A-Z]{2}/)?.[1]?.trim() ?? null) : null;
    const uf = end ? (String(end).match(/\/\s*([A-Z]{2})\b/)?.[1] ?? null) : null;
    rows.push({
      id: r.id, source: "relatorio_crea",
      numero: r.art ?? r.numero ?? null,
      uf,
      cidade,
      nome_obra: end,
      rt_nome: null,
      contratante: r.contratante ?? null,
      empresa: r.proprietario ?? null,
      status: r.tipo ?? r.pagamento ?? null,
      valor: toNumber(r.valor_contrato),
      data: toDate(r.data_inicio) ?? toDate(r.cadastro),
      raw: r,
    });
  });

  return rows.filter((r) =>
    matchesText(r, f) &&
    inYearMonth(r.data, f.ano, f.mes) &&
    inDateRange(r.data, f.data_de, f.data_ate)
  );
}

export function unifiedKpis(rows: GovUnifiedRow[]) {
  const total = rows.length;
  const valor = rows.reduce((s, r) => s + (r.valor ?? 0), 0);
  const ufs = new Set(rows.map((r) => r.uf).filter(Boolean)).size;
  const rts = new Set(rows.map((r) => r.rt_nome).filter(Boolean)).size;
  const contratantes = new Set(rows.map((r) => r.contratante).filter(Boolean)).size;
  return { total, valor, ufs, rts, contratantes };
}

export function groupCount<T>(arr: T[], key: (x: T) => string): { name: string; value: number }[] {
  const m = new Map<string, number>();
  arr.forEach((x) => {
    const k = key(x) || "—";
    m.set(k, (m.get(k) ?? 0) + 1);
  });
  return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export function groupSum<T>(arr: T[], key: (x: T) => string, val: (x: T) => number): { name: string; value: number }[] {
  const m = new Map<string, number>();
  arr.forEach((x) => {
    const k = key(x) || "—";
    m.set(k, (m.get(k) ?? 0) + (val(x) || 0));
  });
  return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name));
}
