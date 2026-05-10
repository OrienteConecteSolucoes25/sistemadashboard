import * as XLSX from "xlsx";

/** Mapa flexível de cabeçalhos do CREA/SITAC → campos do crea_gov_arts. */
const HEADER_MAP: Record<string, string> = {
  // Identificação
  "numero": "numero", "número": "numero", "n° art": "numero", "no art": "numero", "art": "numero",
  "uf": "uf",
  "tipo": "tipo",
  "natureza": "natureza",
  "participacao tecnica": "participacao_tecnica", "participação técnica": "participacao_tecnica",
  "forma de registro": "forma_registro",
  // Pessoas / partes
  "empresa": "empresa_nome",
  "contratante": "contratante_nome",
  "proprietario": "proprietario", "proprietário": "proprietario",
  "responsavel tecnico": "rt_nome", "responsável técnico": "rt_nome", "rt": "rt_nome",
  // Endereço
  "endereco": "endereco", "endereço": "endereco",
  "cidade": "cidade", "municipio": "cidade", "município": "cidade",
  "uf da obra": "uf_obra",
  "cep": "cep",
  // Texto
  "observacao": "observacao", "observação": "observacao",
  "atividades": "atividades_texto", "detalhe": "atividades_texto", "descrição da obra/serviço": "atividades_texto",
  "codigo tos": "codigo_tos", "código tos": "codigo_tos", "tos": "codigo_tos",
  "quantidade": "quantidade",
  "unidade": "unidade_medida", "unidade de medida": "unidade_medida",
  // Valores
  "valor taxa": "valor_taxa", "taxa": "valor_taxa", "valor da art": "valor_taxa",
  "valor pago": "valor_pago",
  "valor contrato": "valor_contrato", "valor do contrato": "valor_contrato",
  "centro de custo": "centro_custo",
  // Datas
  "data cadastro": "data_cadastro", "cadastro": "data_cadastro",
  "data pagamento": "data_pagamento", "pagamento": "data_pagamento",
  "data vencimento": "data_vencimento", "vencimento": "data_vencimento",
  "data baixa": "data_baixa", "baixa": "data_baixa",
  // Status
  "status analise": "status_analise", "análise": "status_analise", "status análise": "status_analise",
  "status baixa": "status_baixa",
  "status financeiro": "status_financeiro",
  // Boleto
  "boleto": "boleto_numero", "n° boleto": "boleto_numero", "no boleto": "boleto_numero",
};

function norm(s: string): string {
  return String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function parseDateBR(v: any): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    // serial Excel
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y.toString().padStart(4, "0")}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (m) {
    let [, dd, mm, yy] = m;
    if (yy.length === 2) yy = (Number(yy) > 70 ? "19" : "20") + yy;
    return `${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return s.slice(0, 10);
  return null;
}

function parseNumberBR(v: any): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return v;
  let s = String(v).replace(/[R$\s]/g, "");
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = Number(s);
  return isFinite(n) ? n : null;
}

export type ParsedArtRow = {
  numero?: string;
  uf?: string;
  tipo?: string; natureza?: string; participacao_tecnica?: string; forma_registro?: string;
  empresa_nome?: string; contratante_nome?: string; rt_nome?: string;
  proprietario?: string; endereco?: string; cidade?: string; uf_obra?: string; cep?: string;
  observacao?: string; atividades_texto?: string; codigo_tos?: string;
  quantidade?: number | null; unidade_medida?: string;
  valor_taxa?: number | null; valor_pago?: number | null; valor_contrato?: number | null;
  centro_custo?: string;
  data_cadastro?: string | null; data_pagamento?: string | null;
  data_vencimento?: string | null; data_baixa?: string | null;
  status_analise?: string; status_baixa?: string; status_financeiro?: string;
  boleto_numero?: string;
  raw: Record<string, any>;
};

export type ParseResult = {
  rows: ParsedArtRow[];
  unmappedHeaders: string[];
  totalLines: number;
  validLines: number;
};

export async function parseArtFile(file: File): Promise<ParseResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return { rows: [], unmappedHeaders: [], totalLines: 0, validLines: 0 };
  const json: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: null, raw: false });

  const out: ParsedArtRow[] = [];
  const unmapped = new Set<string>();
  for (const r of json) {
    const row: ParsedArtRow = { raw: r };
    for (const k of Object.keys(r)) {
      const target = HEADER_MAP[norm(k)];
      const v = r[k];
      if (!target) { if (v != null && String(v).trim() !== "") unmapped.add(k); continue; }
      if (target.startsWith("data_")) (row as any)[target] = parseDateBR(v);
      else if (target.startsWith("valor_") || target === "quantidade") (row as any)[target] = parseNumberBR(v);
      else (row as any)[target] = v != null ? String(v).trim() : undefined;
    }
    if (row.numero || row.atividades_texto || row.contratante_nome) out.push(row);
  }
  return { rows: out, unmappedHeaders: Array.from(unmapped), totalLines: json.length, validLines: out.length };
}

/** Hash determinístico simples para dedupe (sha-1 truncado via SubtleCrypto). */
export async function hashArt(uf: string | undefined, numero: string | undefined, cadastro: string | null | undefined, empresa: string | undefined): Promise<string> {
  const s = `${uf ?? ""}|${numero ?? ""}|${cadastro ?? ""}|${(empresa ?? "").toLowerCase()}`;
  const buf = new TextEncoder().encode(s);
  const h = await crypto.subtle.digest("SHA-1", buf);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
