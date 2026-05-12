import { supabase } from "@/integrations/supabase/client";
import { GovFilters } from "./govTypes";

const sb: any = supabase;

/** Linha unificada para Visão Executiva (origina-se de qualquer das 3 tabelas). */
export type GovUnifiedRow = {
  id: string;
  source: "servicos" | "art_bloco" | "relatorio_crea" | "arts_todas";
  numero: string | null;
  uf: string | null;
  cidade: string | null;
  nome_obra: string | null;
  rt_nome: string | null;
  contratante: string | null;
  empresa: string | null;
  status: string | null;
  /** Valores separados — NÃO somar entre si. */
  valor_art: number | null;
  valor_pago: number | null;
  valor_contrato: number | null;
  atividade_servico: string | null;
  data: string | null; // ISO yyyy-mm-dd
  raw: any;
};

function toDate(v: any): string | null {
  if (!v) return null;
  const s = String(v);
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const b = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (b) {
    let [, dd, mm, yy] = b;
    if (yy.length === 2) yy = (Number(yy) > 70 ? "19" : "20") + yy;
    return `${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return null;
}

/** Canoniza nome de pessoa: tira acentos, uppercase, colapsa espaços. */
export function canonPessoa(v: any): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/\s+/g, " ");
}

/** Canoniza nome de contratante: agrupa todos que começam com "HIGHLINE" em um único nome. */
export function canonContratante(v: any): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const norm = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  if (/^HIGHLINE\b/.test(norm) || norm.startsWith("HIGHLINE")) return "HIGHLINE";
  return s;
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

const UFS_BR = new Set([
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
]);
function pickUF(...vals: any[]): string | null {
  for (const v of vals) {
    const s = String(v ?? "").trim();
    if (!s) continue;
    if (/^[A-Za-z]{2}$/.test(s) && UFS_BR.has(s.toUpperCase())) return s.toUpperCase();
    const m2 = s.match(/\/\s*([A-Za-z]{2})\b/);
    if (m2 && UFS_BR.has(m2[1].toUpperCase())) return m2[1].toUpperCase();
    const matches = s.toUpperCase().match(/\b[A-Z]{2}\b/g) ?? [];
    for (const m of matches) if (UFS_BR.has(m)) return m;
  }
  return null;
}
function pickCidade(...vals: any[]): string | null {
  for (const v of vals) {
    const s = String(v ?? "").trim();
    if (s) return s;
  }
  return null;
}

export async function fetchGovUnified(companyId: string, f: GovFilters): Promise<GovUnifiedRow[]> {
  const [serv, bloco, rel, todas] = await Promise.all([
    fetchAll("crea_gov_servicos", companyId).catch(() => []),
    fetchAll("crea_gov_art_bloco", companyId).catch(() => []),
    fetchAll("crea_gov_relatorio_crea", companyId).catch(() => []),
    fetchAll("crea_gov_arts_todas", companyId).catch(() => []),
  ]);

  const rows: GovUnifiedRow[] = [];

  serv.forEach((r: any) => rows.push({
    id: r.id, source: "servicos",
    numero: r.numero ?? null,
    uf: pickUF(r.uf_obra, r.uf_contrato),
    cidade: pickCidade(r.cidade_obra, r.cidade_contrato),
    nome_obra: r.endereco ?? null,
    rt_nome: canonPessoa(r.responsavel_tecnico),
    contratante: canonContratante(r.contratante),
    empresa: r.empresa ?? null,
    status: r.analise ?? r.baixa ?? null,
    valor_art: toNumber(r.valor_art),
    valor_pago: toNumber(r.valor_pago),
    valor_contrato: toNumber(r.valor_contrato),
    atividade_servico: r.atividade_servico ?? r.ativ_tec_descricao ?? null,
    data: toDate(r.cadastro) ?? toDate(r.pagamento),
    raw: r,
  }));

  bloco.forEach((r: any) => {
    const end = r.endereco_obra ?? r.endereco_contrato ?? null;
    rows.push({
      id: r.id, source: "art_bloco",
      numero: r.numero_art ?? null,
      uf: pickUF(r.uf_obra, r.uf_contrato, end),
      cidade: pickCidade(r.cidade_obra, r.cidade_contrato),
      nome_obra: end,
      rt_nome: canonPessoa(r.responsavel_tecnico),
      contratante: canonContratante(r.contratante),
      empresa: null,
      status: r.situacao ?? r.atendido ?? null,
      valor_art: toNumber(r.valor_art),
      valor_pago: toNumber(r.valor_pago),
      valor_contrato: toNumber(r.valor_contrato),
      atividade_servico: r.ativ_tec_descricao ?? null,
      data: toDate(r.data_inicio) ?? toDate(r.celebrado_em) ?? toDate(r.data_solicitacao),
      raw: r,
    });
  });

  rel.forEach((r: any) => {
    const end = r.enderecos ?? null;
    const uf = end ? (String(end).match(/\/\s*([A-Z]{2})\b/)?.[1] ?? null) : null;
    const cidade = end ? (String(end).match(/-\s*([A-Za-zÀ-ú\s]+)\s*\/\s*[A-Z]{2}/)?.[1]?.trim() ?? null) : null;
    rows.push({
      id: r.id, source: "relatorio_crea",
      numero: r.art ?? r.numero ?? null,
      uf,
      cidade,
      nome_obra: end,
      rt_nome: null,
      contratante: canonContratante(r.contratante),
      empresa: r.proprietario ?? null,
      status: r.tipo ?? r.pagamento ?? null,
      valor_art: null,
      valor_pago: toNumber(r.taxa_paga),
      valor_contrato: toNumber(r.valor_contrato),
      atividade_servico: r.atividade_servico ?? r.atividades ?? null,
      data: toDate(r.data_inicio) ?? toDate(r.cadastro),
      raw: r,
    });
  });

  todas.forEach((r: any) => {
    const end = r.endereco ?? null;
    const uf = end ? (String(end).match(/\/\s*([A-Z]{2})\b/)?.[1] ?? null) : null;
    const cidade = end ? (String(end).match(/-\s*([A-Za-zÀ-ú\s]+)\s*\/\s*[A-Z]{2}/)?.[1]?.trim() ?? null) : null;
    rows.push({
      id: r.id, source: "arts_todas",
      numero: r.numero ?? null,
      uf, cidade,
      nome_obra: end,
      rt_nome: null,
      contratante: canonContratante(r.contratante),
      empresa: r.empresa ?? null,
      status: r.analise ?? r.baixa ?? null,
      valor_art: null, valor_pago: null, valor_contrato: null,
      atividade_servico: r.detalhe ?? null,
      data: toDate(r.cadastro) ?? toDate(r.pagamento),
      raw: r,
    });
  });

  const filtered = rows.filter((r) =>
    matchesText(r, f) &&
    inYearMonth(r.data, f.ano, f.mes) &&
    inDateRange(r.data, f.data_de, f.data_ate)
  );
  return mergeByArt(filtered);
}

/** Normaliza número de ART para chave de cruzamento. */
function normArt(v: any): string | null {
  if (v == null) return null;
  const s = String(v).toUpperCase().replace(/[^0-9A-Z]/g, "");
  return s || null;
}

/**
 * Cruza linhas das 4 sub-abas pelo número da ART (Número = Número da ART = ART).
 * Linhas com mesmo número viram UMA ART, complementando campos faltantes.
 * Valores (R$) NÃO são somados entre fontes — usa-se o maior valor não-nulo.
 */
function mergeByArt(rows: GovUnifiedRow[]): GovUnifiedRow[] {
  const groups = new Map<string, GovUnifiedRow[]>();
  const orphans: GovUnifiedRow[] = [];
  for (const r of rows) {
    const k = normArt(r.numero);
    if (!k) { orphans.push(r); continue; }
    const arr = groups.get(k) ?? [];
    arr.push(r);
    groups.set(k, arr);
  }
  const merged: GovUnifiedRow[] = [];
  const pickFirst = <T,>(arr: GovUnifiedRow[], f: (r: GovUnifiedRow) => T | null | undefined): T | null => {
    for (const r of arr) { const v = f(r); if (v != null && v !== "") return v as T; }
    return null;
  };
  const pickMaxNum = (arr: GovUnifiedRow[], f: (r: GovUnifiedRow) => number | null): number | null => {
    let best: number | null = null;
    for (const r of arr) { const v = f(r); if (v != null && (best == null || v > best)) best = v; }
    return best;
  };
  // Prioriza fontes com mais dados estruturados
  const order: Record<GovUnifiedRow["source"], number> = { servicos: 0, art_bloco: 1, relatorio_crea: 2, arts_todas: 3 };
  groups.forEach((arr) => {
    const sorted = [...arr].sort((a, b) => order[a.source] - order[b.source]);
    const base = sorted[0];
    merged.push({
      ...base,
      numero: pickFirst(sorted, (r) => r.numero) ?? base.numero,
      uf: pickFirst(sorted, (r) => r.uf),
      cidade: pickFirst(sorted, (r) => r.cidade),
      nome_obra: pickFirst(sorted, (r) => r.nome_obra),
      rt_nome: pickFirst(sorted, (r) => r.rt_nome),
      contratante: pickFirst(sorted, (r) => r.contratante),
      empresa: pickFirst(sorted, (r) => r.empresa),
      status: pickFirst(sorted, (r) => r.status),
      valor_art: pickMaxNum(sorted, (r) => r.valor_art),
      valor_pago: pickMaxNum(sorted, (r) => r.valor_pago),
      valor_contrato: pickMaxNum(sorted, (r) => r.valor_contrato),
      atividade_servico: pickFirst(sorted, (r) => r.atividade_servico),
      data: pickFirst(sorted, (r) => r.data),
      raw: { merged: sorted.map((r) => ({ source: r.source, id: r.id, raw: r.raw })) },
    });
  });
  return [...merged, ...orphans];
}

export function unifiedKpis(rows: GovUnifiedRow[]) {
  const total = rows.length;
  const valor_art = rows.reduce((s, r) => s + (r.valor_art ?? 0), 0);
  const valor_contrato = rows.reduce((s, r) => s + (r.valor_contrato ?? 0), 0);
  const valor_pago = rows.reduce((s, r) => s + (r.valor_pago ?? 0), 0);
  const ufs = new Set(rows.map((r) => r.uf).filter(Boolean)).size;
  const rts = new Set(rows.map((r) => r.rt_nome).filter(Boolean)).size;
  const contratantes = new Set(rows.map((r) => r.contratante).filter(Boolean)).size;
  const cidades = new Set(rows.map((r) => r.cidade).filter(Boolean)).size;
  return { total, valor_art, valor_contrato, valor_pago, ufs, rts, contratantes, cidades };
}

export function groupCount<T>(arr: T[], key: (x: T) => string | null | undefined): { name: string; value: number }[] {
  const m = new Map<string, number>();
  arr.forEach((x) => {
    const k = (key(x) ?? "").toString().trim();
    if (!k) return; // ignora vazios para não inflar "—"
    m.set(k, (m.get(k) ?? 0) + 1);
  });
  return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export function groupSum<T>(arr: T[], key: (x: T) => string | null | undefined, val: (x: T) => number): { name: string; value: number }[] {
  const m = new Map<string, number>();
  arr.forEach((x) => {
    const k = (key(x) ?? "").toString().trim();
    if (!k) return;
    m.set(k, (m.get(k) ?? 0) + (val(x) || 0));
  });
  return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name));
}
