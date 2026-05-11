/**
 * Cruzamento lógico (não-destrutivo) entre ARTs vindas de importações diferentes.
 *
 * Chave principal canônica: company_id + uf_crea + numero_art
 * Chaves auxiliares: numero_boleto, cpf_cnpj_contratante, nome_contratante,
 *                    responsavel_tecnico, cidade, valor_art, valor_pago, data_cadastro
 *
 * Estas funções NÃO alteram dados — apenas agrupam e relacionam registros já
 * existentes, expondo equivalência entre importações de origem diferente.
 */

import { normalizeUf, normalizeNumeroArt } from "./govNormalize";

export interface CrossrefArt {
  id: string;
  company_id?: string | null;
  uf?: string | null;
  numero?: string | null;
  arquivo_origem_id?: string | null;
  boleto_numero?: string | null;
  contratante_id?: string | null;
  proprietario?: string | null;
  rt_id?: string | null;
  cidade?: string | null;
  valor_taxa?: number | string | null;
  valor_pago?: number | string | null;
  data_cadastro?: string | null;
  data_pagamento?: string | null;
  data_baixa?: string | null;
}

/**
 * Constrói a chave canônica de equivalência entre ARTs.
 * Retorna `null` quando faltam dados mínimos (uf ou número).
 */
export function buildArtKey(art: {
  company_id?: string | null;
  uf?: string | null;
  numero?: string | null;
}): string | null {
  const uf = normalizeUf(art.uf);
  const num = normalizeNumeroArt(art.numero);
  if (!uf || !num) return null;
  const cid = (art.company_id ?? "").toString().trim();
  return `${cid}::${uf}::${num}`;
}

/**
 * Agrupa ARTs por chave canônica (company_id + uf + numero).
 * O array original NÃO é alterado.
 */
export function groupArtsByKey<T extends CrossrefArt>(arts: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const a of arts) {
    const key = buildArtKey(a);
    if (!key) continue;
    const arr = map.get(key) ?? [];
    arr.push(a);
    map.set(key, arr);
  }
  return map;
}

export interface CrossrefStats {
  totalArts: number;
  uniqueKeys: number;
  artsComEquivalencia: number;     // ARTs que aparecem em 2+ importações
  artsSemChave: number;            // ARTs sem uf ou numero (não cruzáveis)
  importacoesEnvolvidas: number;   // Nº de arquivos_origem distintos
}

/**
 * Estatísticas rápidas do cruzamento — útil para badges/KPIs sem novas telas.
 */
export function crossrefStats<T extends CrossrefArt>(arts: T[]): CrossrefStats {
  const grupos = groupArtsByKey(arts);
  const importacoes = new Set<string>();
  let comEq = 0;
  let semChave = 0;

  for (const a of arts) {
    if (!buildArtKey(a)) semChave++;
    if (a.arquivo_origem_id) importacoes.add(a.arquivo_origem_id);
  }
  for (const [, arr] of grupos) {
    const origens = new Set(arr.map(x => x.arquivo_origem_id).filter(Boolean));
    if (origens.size >= 2) comEq += arr.length;
  }

  return {
    totalArts: arts.length,
    uniqueKeys: grupos.size,
    artsComEquivalencia: comEq,
    artsSemChave: semChave,
    importacoesEnvolvidas: importacoes.size,
  };
}

/**
 * Para uma ART específica, retorna IDs de outras ARTs equivalentes (mesma chave canônica).
 */
export function findEquivalents<T extends CrossrefArt>(art: T, all: T[]): T[] {
  const key = buildArtKey(art);
  if (!key) return [];
  return all.filter(a => a.id !== art.id && buildArtKey(a) === key);
}
