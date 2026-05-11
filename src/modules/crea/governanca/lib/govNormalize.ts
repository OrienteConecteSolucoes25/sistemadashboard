/**
 * Normalização canônica de campos de ART.
 *
 * Objetivo: dada uma linha vinda de qualquer planilha de qualquer CREA
 * (BA, e futuramente outros), produzir um objeto interno padronizado
 * para que comparação, dedupe e conciliação usem SEMPRE os mesmos
 * campos/valores.
 *
 * Não altera UI, não toca no banco, não tem efeitos colaterais.
 * É reusável por: parser XLSX, parser PDF, importações futuras,
 * conciliação financeira, validações de auditoria.
 */

// ---------- helpers básicos ----------

export function stripAccents(s: string): string {
  return String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normKey(s: string): string {
  return stripAccents(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// ---------- aliases de cabeçalho (estendido, multi-CREA) ----------
//
// Toda chave aqui está em forma canônica (normKey). Para descobrir
// o campo interno de uma coluna `H` da planilha: HEADER_ALIASES[normKey(H)].

export const HEADER_ALIASES: Record<string, string> = {
  // ---- Identificação da ART ----
  "numero": "numero",
  "n art": "numero",
  "no art": "numero",
  "n da art": "numero",
  "numero art": "numero",
  "numero da art": "numero",
  "art": "numero",
  "art numero": "numero",
  "registro art": "numero",
  "codigo art": "numero",

  // ---- UF (CREA emissor) ----
  "uf": "uf",
  "uf crea": "uf",
  "estado": "uf",
  "crea": "uf",

  // ---- Tipo / natureza ----
  "tipo": "tipo",
  "tipo art": "tipo",
  "tipo de art": "tipo",
  "natureza": "natureza",
  "natureza art": "natureza",
  "modalidade": "natureza",
  "participacao tecnica": "participacao_tecnica",
  "forma de registro": "forma_registro",
  "forma registro": "forma_registro",

  // ---- Pessoas / partes ----
  "empresa": "empresa_nome",
  "empresa contratada": "empresa_nome",
  "razao social": "empresa_nome",
  "contratante": "contratante_nome",
  "cliente": "contratante_nome",
  "tomador": "contratante_nome",
  "proprietario": "proprietario",
  "dono da obra": "proprietario",
  "responsavel tecnico": "rt_nome",
  "rt": "rt_nome",
  "engenheiro responsavel": "rt_nome",
  "profissional": "rt_nome",
  "cpf rt": "rt_cpf",
  "cnpj contratante": "contratante_cnpj",
  "cnpj empresa": "empresa_cnpj",

  // ---- Endereço ----
  "endereco": "endereco",
  "endereco da obra": "endereco",
  "logradouro": "endereco_logradouro",
  "numero endereco": "endereco_numero",
  "n logradouro": "endereco_numero",
  "complemento": "endereco_complemento",
  "bairro": "endereco_bairro",
  "cidade": "cidade",
  "municipio": "cidade",
  "cidade obra": "cidade",
  "uf da obra": "uf_obra",
  "uf obra": "uf_obra",
  "estado obra": "uf_obra",
  "cep": "cep",

  // ---- Texto técnico ----
  "observacao": "observacao",
  "observacoes": "observacao",
  "atividades": "atividades_texto",
  "atividade tecnica": "atividades_texto",
  "atividades tecnicas": "atividades_texto",
  "detalhe": "atividades_texto",
  "descricao": "atividades_texto",
  "descricao da obra servico": "atividades_texto",
  "descricao do servico": "atividades_texto",
  "objeto": "atividades_texto",
  "codigo tos": "codigo_tos",
  "tos": "codigo_tos",
  "quantidade": "quantidade",
  "qtde": "quantidade",
  "unidade": "unidade_medida",
  "unidade de medida": "unidade_medida",

  // ---- Valores ----
  "valor taxa": "valor_taxa",
  "taxa": "valor_taxa",
  "taxa art": "valor_taxa",
  "valor da art": "valor_taxa",
  "valor art": "valor_taxa",
  "valor pago": "valor_pago",
  "taxa paga": "valor_pago",
  "valor recebido": "valor_pago",
  "valor contrato": "valor_contrato",
  "valor do contrato": "valor_contrato",
  "valor da obra": "valor_contrato",
  "valor obra": "valor_contrato",
  "centro de custo": "centro_custo",
  "cc": "centro_custo",

  // ---- Datas ----
  "data cadastro": "data_cadastro",
  "cadastro": "data_cadastro",
  "data registro": "data_cadastro",
  "data emissao": "data_cadastro",
  "data pagamento": "data_pagamento",
  "pagamento": "data_pagamento",
  "data vencimento": "data_vencimento",
  "vencimento": "data_vencimento",
  "data baixa": "data_baixa",
  "baixa": "data_baixa",

  // ---- Status ----
  "status analise": "status_analise",
  "status da analise": "status_analise",
  "analise": "status_analise",
  "situacao": "status_analise",
  "situacao art": "status_analise",
  "status baixa": "status_baixa",
  "status financeiro": "status_financeiro",
  "situacao financeira": "status_financeiro",
  "status pagamento": "status_financeiro",

  // ---- Boleto ----
  "boleto": "boleto_numero",
  "n boleto": "boleto_numero",
  "no boleto": "boleto_numero",
  "numero boleto": "boleto_numero",
  "numero do boleto": "boleto_numero",
  "nosso numero": "boleto_numero",
};

/** Resolve cabeçalho bruto → campo canônico (ou undefined se desconhecido). */
export function mapHeader(rawHeader: string): string | undefined {
  return HEADER_ALIASES[normKey(rawHeader)];
}

// ---------- normalizadores canônicos ----------

/** Número da ART: uppercase, sem espaços/pontuação supérflua. Mantém vazio como undefined. */
export function normalizeNumeroArt(v: any): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim().toUpperCase().replace(/\s+/g, "");
  return s.length === 0 ? undefined : s;
}

/** UF do CREA: sempre 2 letras maiúsculas se reconhecida; senão undefined. */
const UFS = new Set([
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
]);
export function normalizeUf(v: any): string | undefined {
  if (v == null) return undefined;
  const s = stripAccents(String(v)).toUpperCase().replace(/[^A-Z]/g, "").trim();
  if (s.length === 0) return undefined;
  if (UFS.has(s)) return s;
  // estado por extenso → sigla
  const map: Record<string, string> = {
    BAHIA:"BA", SAOPAULO:"SP", RIODEJANEIRO:"RJ", MINASGERAIS:"MG",
    PARANA:"PR", SANTACATARINA:"SC", RIOGRANDEDOSUL:"RS",
    PERNAMBUCO:"PE", CEARA:"CE", PARA:"PA", PARAIBA:"PB",
    GOIAS:"GO", DISTRITOFEDERAL:"DF", MARANHAO:"MA", PIAUI:"PI",
    ALAGOAS:"AL", SERGIPE:"SE", RIOGRANDEDONORTE:"RN",
    AMAZONAS:"AM", AMAPA:"AP", ACRE:"AC", RONDONIA:"RO", RORAIMA:"RR",
    MATOGROSSO:"MT", MATOGROSSODOSUL:"MS", TOCANTINS:"TO", ESPIRITOSANTO:"ES",
  };
  return map[s];
}

/** Status análise canônico (igual aos valores aceitos em GOV_STATUS_ANALISE). */
export function normalizeStatusAnalise(v: any): string | undefined {
  if (v == null) return undefined;
  const s = stripAccents(String(v)).toLowerCase().trim();
  if (!s) return undefined;
  if (/aguard.*pag/.test(s)) return "Aguardando Pagamento";
  if (/registr/.test(s)) return "Registrada";
  if (/cancel/.test(s)) return "Cancelada";
  if (/invalid|observ/.test(s)) return "Documento Invalidado/ART com Observação";
  if (/em\s*anali|analise/.test(s)) return "Em Análise";
  if (/inde(f|r)/.test(s)) return "Indeferida";
  return String(v).trim();
}

/** Status financeiro canônico (igual aos valores em GOV_STATUS_FINANCEIRO). */
export function normalizeStatusFinanceiro(v: any): string | undefined {
  if (v == null) return undefined;
  const s = stripAccents(String(v)).toLowerCase().trim();
  if (!s) return undefined;
  if (/^pago|quitad|liquidad/.test(s)) return "Pago";
  if (/parcial/.test(s)) return "Parcial";
  if (/diverg/.test(s)) return "Divergente";
  if (/vencid|atrasad/.test(s)) return "Vencido";
  if (/nao\s*pag|nao\s*paga|aberto|pendent|em\s*aberto/.test(s)) return "Não Paga";
  return String(v).trim();
}

/** Valor monetário BR: aceita "R$ 1.234,56", "1234.56", number, etc. */
export function parseMoneyBR(v: any): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return isFinite(v) ? v : null;
  let s = String(v).replace(/[R$\s]/g, "").trim();
  if (!s) return null;
  // remove sinal solto " - " no fim
  const neg = /^-|-$/.test(s);
  s = s.replace(/^-|-$/g, "");
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = Number(s);
  if (!isFinite(n)) return null;
  return neg ? -n : n;
}

/** Data BR → ISO yyyy-mm-dd. Aceita Date, número (serial Excel já convertido), strings. */
export function parseDateISO(v: any): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (m) {
    let [, dd, mm, yy] = m;
    if (yy.length === 2) yy = (Number(yy) > 70 ? "19" : "20") + yy;
    return `${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return s.slice(0, 10);
  return null;
}

/** Monta endereço único quando vier dividido (logradouro/numero/bairro/complemento). */
export function buildEndereco(parts: {
  endereco?: any; endereco_logradouro?: any; endereco_numero?: any;
  endereco_bairro?: any; endereco_complemento?: any;
}): string | undefined {
  if (parts.endereco && String(parts.endereco).trim()) return String(parts.endereco).trim();
  const a = [parts.endereco_logradouro, parts.endereco_numero, parts.endereco_complemento, parts.endereco_bairro]
    .map((x) => (x == null ? "" : String(x).trim())).filter(Boolean);
  return a.length ? a.join(", ") : undefined;
}

// ---------- normalização completa de uma linha ----------

export type CanonicalArt = {
  numero?: string;
  uf?: string;
  uf_obra?: string;
  tipo?: string;
  natureza?: string;
  empresa_nome?: string;
  contratante_nome?: string;
  proprietario?: string;
  rt_nome?: string;
  endereco?: string;
  cidade?: string;
  cep?: string;
  observacao?: string;
  atividades_texto?: string;
  codigo_tos?: string;
  quantidade?: number | null;
  unidade_medida?: string;
  valor_taxa?: number | null;
  valor_pago?: number | null;
  valor_contrato?: number | null;
  centro_custo?: string;
  data_cadastro?: string | null;
  data_pagamento?: string | null;
  data_vencimento?: string | null;
  data_baixa?: string | null;
  status_analise?: string;
  status_baixa?: string;
  status_financeiro?: string;
  boleto_numero?: string;
  raw: Record<string, any>;
};

const VALOR_FIELDS = new Set(["valor_taxa","valor_pago","valor_contrato","quantidade"]);
const DATE_FIELDS  = new Set(["data_cadastro","data_pagamento","data_vencimento","data_baixa"]);

/**
 * Normaliza uma linha bruta (com nomes de coluna originais) em um
 * objeto canônico CanonicalArt. Não falha em campos desconhecidos
 * (são preservados em `raw`).
 */
export function normalizeArtRow(raw: Record<string, any>): CanonicalArt {
  const out: any = { raw };
  for (const k of Object.keys(raw)) {
    const target = mapHeader(k);
    const v = raw[k];
    if (!target) continue;
    if (DATE_FIELDS.has(target)) out[target] = parseDateISO(v);
    else if (VALOR_FIELDS.has(target)) out[target] = parseMoneyBR(v);
    else out[target] = v == null ? undefined : String(v).trim();
  }
  // Pós-normalização canônica
  if (out.numero != null)             out.numero = normalizeNumeroArt(out.numero);
  if (out.uf != null)                 out.uf = normalizeUf(out.uf) ?? out.uf;
  if (out.uf_obra != null)            out.uf_obra = normalizeUf(out.uf_obra) ?? out.uf_obra;
  if (out.status_analise != null)     out.status_analise = normalizeStatusAnalise(out.status_analise);
  if (out.status_financeiro != null)  out.status_financeiro = normalizeStatusFinanceiro(out.status_financeiro);
  // Endereço composto
  const end = buildEndereco(out);
  if (end) out.endereco = end;
  // Limpa campos de partes do endereço (mantém em raw)
  delete out.endereco_logradouro;
  delete out.endereco_numero;
  delete out.endereco_complemento;
  delete out.endereco_bairro;
  return out as CanonicalArt;
}
