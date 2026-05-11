import { supabase } from "@/integrations/supabase/client";
import { GovFilters } from "./govTypes";
import { deriveStatusFinanceiroArt, pendenteArt, divergenciaArt } from "./govNormalize";

export type GovArt = {
  id: string;
  numero: string;
  uf: string | null;
  tipo: string | null;
  natureza: string | null;
  cidade: string | null;
  uf_obra: string | null;
  endereco: string | null;
  observacao: string | null;
  proprietario: string | null;
  contratante_id: string | null;
  rt_id: string | null;
  empresa_id: string | null;
  valor_taxa: number | null;
  valor_pago: number | null;
  valor_contrato: number | null;
  data_cadastro: string | null;
  data_pagamento: string | null;
  data_vencimento: string | null;
  data_baixa: string | null;
  ano: number | null;
  mes: number | null;
  status_analise: string | null;
  status_baixa: string | null;
  status_financeiro: string | null;
  boleto_numero: string | null;
  centro_custo: string | null;
};

function applyFilters<T extends ReturnType<typeof supabase.from>>(q: any, f: GovFilters) {
  if (f.uf) q = q.eq("uf", f.uf);
  if (f.ano) q = q.eq("ano", f.ano);
  if (f.mes) q = q.eq("mes", f.mes);
  if (f.empresa_id) q = q.eq("empresa_id", f.empresa_id);
  if (f.rt_id) q = q.eq("rt_id", f.rt_id);
  if (f.contratante_id) q = q.eq("contratante_id", f.contratante_id);
  if (f.setor_id) q = q.eq("setor_principal_id", f.setor_id);
  if (f.escopo_id) q = q.eq("escopo_id", f.escopo_id);
  if (f.status_analise) q = q.eq("status_analise", f.status_analise);
  if (f.status_financeiro) q = q.eq("status_financeiro", f.status_financeiro);
  if (f.tipo) q = q.eq("tipo", f.tipo);
  if (f.natureza) q = q.eq("natureza", f.natureza);
  if (f.cidade) q = q.ilike("cidade", `%${f.cidade}%`);
  if (f.uf_obra) q = q.eq("uf_obra", f.uf_obra);
  if (f.numero) q = q.ilike("numero", `%${f.numero}%`);
  if (f.boleto) q = q.ilike("boleto_numero", `%${f.boleto}%`);
  if (f.centro_custo) q = q.eq("centro_custo", f.centro_custo);
  if (f.cadastro_de) q = q.gte("data_cadastro", f.cadastro_de);
  if (f.cadastro_ate) q = q.lte("data_cadastro", f.cadastro_ate);
  if (f.pagamento_de) q = q.gte("data_pagamento", f.pagamento_de);
  if (f.pagamento_ate) q = q.lte("data_pagamento", f.pagamento_ate);
  if (f.vencimento_de) q = q.gte("data_vencimento", f.vencimento_de);
  if (f.vencimento_ate) q = q.lte("data_vencimento", f.vencimento_ate);
  if (f.valor_min != null) q = q.gte("valor_taxa", f.valor_min);
  if (f.valor_max != null) q = q.lte("valor_taxa", f.valor_max);
  return q;
}

const ART_COLS = "id,numero,uf,tipo,natureza,participacao_tecnica,forma_registro,cidade,uf_obra,endereco,observacao,proprietario,contratante_id,rt_id,empresa_id,valor_taxa,valor_pago,valor_contrato,data_cadastro,data_pagamento,data_vencimento,data_baixa,ano,mes,status_analise,status_baixa,status_financeiro,boleto_numero,centro_custo,atividades_texto,codigo_tos,quantidade,unidade_medida";

// Paginação automática para evitar truncamento silencioso quando há
// muitas ARTs (CREA-BA + outros CREAs futuros). Mantém assinatura
// retrocompatível: 3º parâmetro vira o "cap" total (default 10000).
export async function fetchArts(companyId: string, filters: GovFilters, cap = 10000): Promise<GovArt[]> {
  const PAGE = 1000;
  const rows: GovArt[] = [];
  let from = 0;
  while (rows.length < cap) {
    const to = Math.min(from + PAGE, cap) - 1;
    let q = supabase
      .from("crea_gov_arts")
      .select(ART_COLS)
      .eq("company_id", companyId)
      .eq("is_deleted", false)
      .order("data_cadastro", { ascending: false, nullsFirst: false })
      .range(from, to);
    q = applyFilters(q, filters);
    const { data, error } = await q;
    if (error) throw error;
    const batch = (data ?? []) as GovArt[];
    rows.push(...batch);
    if (batch.length < to - from + 1) break; // acabou
    from = to + 1;
  }
  // Marcador opcional para o UI exibir aviso de truncamento
  (rows as any).__truncated = rows.length >= cap;
  return rows;
}

export type GovKpis = {
  total: number;
  registradas: number;
  aguardando_pgto: number;
  vencidas: number;
  baixadas: number;
  canceladas: number;
  valor_emitido: number;
  valor_pago: number;
  valor_pendente: number;
  valor_contratos: number;
  ticket_medio_taxa: number;
  ticket_medio_contrato: number;
  // Novos (canônicos por-linha) — opcionais para retrocompat
  pagas?: number;
  parciais?: number;
  divergentes?: number;
  nao_pagas?: number;
  valor_divergente?: number; // soma de |pago - taxa| onde pago > taxa
};

export function computeKpis(arts: GovArt[]): GovKpis {
  return computeKpisInternal(arts);
}

function computeKpisInternal(arts: GovArt[]): GovKpis {
  const k: GovKpis = {
    total: arts.length, registradas: 0, aguardando_pgto: 0, vencidas: 0, baixadas: 0, canceladas: 0,
    valor_emitido: 0, valor_pago: 0, valor_pendente: 0, valor_contratos: 0,
    ticket_medio_taxa: 0, ticket_medio_contrato: 0,
    pagas: 0, parciais: 0, divergentes: 0, nao_pagas: 0, valor_divergente: 0,
  };
  let nTaxa = 0, nContrato = 0;
  for (const a of arts) {
    const sa = (a.status_analise ?? "").toLowerCase();
    if (sa.includes("registrada")) k.registradas++;
    if (sa.includes("cancelada") || sa.includes("invalid")) k.canceladas++;
    if (a.data_baixa) k.baixadas++;

    if (a.valor_taxa) { k.valor_emitido += Number(a.valor_taxa); nTaxa++; }
    if (a.valor_pago) k.valor_pago += Number(a.valor_pago);
    if (a.valor_contrato) { k.valor_contratos += Number(a.valor_contrato); nContrato++; }

    // Pendente por-linha (não global) — não compensa entre ARTs
    k.valor_pendente += pendenteArt(a);

    // Status financeiro canônico por ART
    const st = deriveStatusFinanceiroArt(a);
    if (st === "Pago") k.pagas!++;
    else if (st === "Parcial") k.parciais!++;
    else if (st === "Divergente") {
      k.divergentes!++;
      const diff = divergenciaArt(a);
      if (diff > 0) k.valor_divergente! += diff;
    }
    else if (st === "Vencido") k.vencidas++;
    else if (st === "Não Paga") k.nao_pagas!++;

    // Mantém compat: aguardando_pgto = não-pagas + parciais + vencidas
    if (st === "Não Paga" || st === "Parcial" || st === "Vencido") k.aguardando_pgto++;
  }
  k.ticket_medio_taxa = nTaxa ? k.valor_emitido / nTaxa : 0;
  k.ticket_medio_contrato = nContrato ? k.valor_contratos / nContrato : 0;
  return k;
}


export function groupBy<T>(arr: T[], key: (x: T) => string): { name: string; value: number }[] {
  const m = new Map<string, number>();
  for (const x of arr) {
    const k = key(x) || "—";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export function sumBy<T>(arr: T[], key: (x: T) => string, val: (x: T) => number): { name: string; value: number }[] {
  const m = new Map<string, number>();
  for (const x of arr) {
    const k = key(x) || "—";
    m.set(k, (m.get(k) ?? 0) + (val(x) || 0));
  }
  return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

// ---------- Pagamentos / Conciliação ----------
export type GovPagamento = {
  id: string;
  uf: string | null;
  numero_boleto: string | null;
  valor: number | null;
  data_pagamento: string | null;
  data_vencimento: string | null;
  sacado: string | null;
  conciliado_art_id: string | null;
  status: string;
};

export async function fetchPagamentos(companyId: string, status?: string): Promise<GovPagamento[]> {
  let q = supabase
    .from("crea_gov_pagamentos")
    .select("id,uf,numero_boleto,valor,data_pagamento,data_vencimento,sacado,conciliado_art_id,status")
    .eq("company_id", companyId)
    .eq("is_deleted", false)
    .order("data_pagamento", { ascending: false, nullsFirst: false })
    .limit(2000);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as GovPagamento[];
}

export type GovConciliacao = {
  id: string;
  art_id: string | null;
  pagamento_id: string | null;
  origem: string;
  score: number | null;
  motivo: string | null;
  status: string;
  created_at: string;
  art?: { numero: string; uf: string | null; valor_taxa: number | null } | null;
  pagamento?: { numero_boleto: string | null; valor: number | null; sacado: string | null; data_pagamento: string | null } | null;
};

export async function fetchConciliacoes(companyId: string, status?: string): Promise<GovConciliacao[]> {
  let q = supabase
    .from("crea_gov_conciliacoes")
    .select("id,art_id,pagamento_id,origem,score,motivo,status,created_at,art:art_id(numero,uf,valor_taxa),pagamento:pagamento_id(numero_boleto,valor,sacado,data_pagamento)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(2000);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as any as GovConciliacao[];
}

export async function runAutoConciliacao(companyId: string) {
  const { data, error } = await supabase.rpc("crea_gov_conciliate_run" as any, { _company: companyId });
  if (error) throw error;
  return data as { ok: boolean; matched?: number; divergent?: number; fallback?: number; error?: string };
}

export async function manualConciliar(pagamentoId: string, artId: string, motivo: string) {
  const { data, error } = await supabase.rpc("crea_gov_conciliate_manual" as any, {
    _pagamento: pagamentoId, _art: artId, _motivo: motivo,
  });
  if (error) throw error;
  return data as { ok: boolean; status?: string; error?: string };
}

export async function unlinkConciliacao(conciliacaoId: string, motivo: string) {
  const { data, error } = await supabase.rpc("crea_gov_conciliate_unlink" as any, {
    _conciliacao: conciliacaoId, _motivo: motivo,
  });
  if (error) throw error;
  return data as { ok: boolean; error?: string };
}

// ---------- Alertas ----------
export type GovAlerta = {
  id: string;
  company_id: string;
  tipo: string;
  criticidade: string;
  status: string;
  responsavel_id: string | null;
  art_id: string | null;
  pagamento_id: string | null;
  prazo: string | null;
  observacoes: string | null;
  historico: any;
  created_at: string;
  updated_at: string;
  art?: { numero: string; uf: string | null } | null;
};

export async function fetchAlertas(companyId: string, status?: string): Promise<GovAlerta[]> {
  let q = supabase
    .from("crea_gov_alertas")
    .select("id,company_id,tipo,criticidade,status,responsavel_id,art_id,pagamento_id,prazo,observacoes,historico,created_at,updated_at,art:art_id(numero,uf)")
    .eq("company_id", companyId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(2000);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as any as GovAlerta[];
}

export async function upsertAlerta(companyId: string, hit: {
  tipo: string; criticidade: string; art_id?: string | null; pagamento_id?: string | null;
  observacoes?: string | null; prazo?: string | null;
}): Promise<void> {
  // Evita duplicar alertas abertos para mesma combinação tipo+art/pagamento
  const filterCol = hit.art_id ? "art_id" : "pagamento_id";
  const filterVal = hit.art_id ?? hit.pagamento_id ?? null;
  if (filterVal) {
    const { data: existing } = await supabase
      .from("crea_gov_alertas")
      .select("id").eq("company_id", companyId).eq("tipo", hit.tipo).eq("status", "aberto")
      .eq(filterCol, filterVal).eq("is_deleted", false).limit(1);
    if (existing && existing.length > 0) return;
  }
  const { error } = await supabase.from("crea_gov_alertas").insert({
    company_id: companyId, tipo: hit.tipo, criticidade: hit.criticidade,
    art_id: hit.art_id ?? null, pagamento_id: hit.pagamento_id ?? null,
    observacoes: hit.observacoes ?? null, prazo: hit.prazo ?? null,
  });
  if (error) throw error;
}

export async function updateAlerta(id: string, patch: Partial<{
  status: string; responsavel_id: string | null; observacoes: string | null; prazo: string | null;
}>, note?: string): Promise<void> {
  const updates: any = { ...patch, updated_at: new Date().toISOString() };
  if (note) {
    const { data: cur } = await supabase.from("crea_gov_alertas").select("historico").eq("id", id).maybeSingle();
    const hist = Array.isArray(cur?.historico) ? cur!.historico : [];
    updates.historico = [...hist, { at: new Date().toISOString(), note, patch }];
  }
  const { error } = await supabase.from("crea_gov_alertas").update(updates).eq("id", id);
  if (error) throw error;
}

export async function searchArtsByNumero(companyId: string, query: string, limit = 20): Promise<GovArt[]> {
  const { data, error } = await supabase
    .from("crea_gov_arts")
    .select("id,numero,uf,tipo,natureza,cidade,uf_obra,endereco,observacao,proprietario,contratante_id,rt_id,empresa_id,valor_taxa,valor_pago,valor_contrato,data_cadastro,data_pagamento,data_vencimento,data_baixa,ano,mes,status_analise,status_baixa,status_financeiro,boleto_numero,centro_custo")
    .eq("company_id", companyId)
    .eq("is_deleted", false)
    .ilike("numero", `%${query}%`)
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as GovArt[];
}
