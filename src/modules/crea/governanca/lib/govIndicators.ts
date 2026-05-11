// ─────────────────────────────────────────────────────────────────
// Governança ART — Indicadores agregados (LEVA 1)
// Função pura: recebe ARTs já normalizadas e devolve séries agregadas.
// NÃO altera registros originais, NÃO faz merge, NÃO sobrescreve nada.
// Chave canônica da ART: company_id + uf_crea + numero_art
// ─────────────────────────────────────────────────────────────────
import type { GovArt } from "./govApi";

export type Bucket = { name: string; value: number };
export type ValueBucket = { name: string; count: number; valor: number };

export type GovIndicators = {
  porUf:           Bucket[];   // 1. ARTs por UF/CREA
  porAno:          Bucket[];   // 3. ARTs por ano
  porMes:          Bucket[];   // 4. ARTs por mês (YYYY-MM)
  porContratante:  Bucket[];   // 2. ARTs por contratante
  porRt:           Bucket[];   // 5. ARTs por responsável técnico
  totais: {
    arts: number;
    comUf: number;
    comAno: number;
    comContratante: number;
    comRt: number;
  };
};

/** Mapas opcionais id→nome para resolver contratante_id e rt_id. */
export type NameMaps = {
  contratantes?: Map<string, string>;
  rts?: Map<string, string>;
};

const SEM = "— sem informação —";

function chaveArt(a: GovArt): string | null {
  const uf = (a.uf ?? "").toString().trim().toUpperCase();
  const num = (a.numero ?? "").toString().trim();
  if (!uf || !num) return null;
  return `${uf}::${num}`;
}

function ano(a: GovArt): string | null {
  if (a.ano) return String(a.ano);
  if (a.data_cadastro) return a.data_cadastro.slice(0, 4);
  return null;
}

function anoMes(a: GovArt): string | null {
  if (a.data_cadastro) return a.data_cadastro.slice(0, 7); // YYYY-MM
  if (a.ano && a.mes) return `${a.ano}-${String(a.mes).padStart(2, "0")}`;
  return null;
}

function bump(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function toBuckets(map: Map<string, number>, sort: "value" | "name" = "value"): Bucket[] {
  const out = Array.from(map, ([name, value]) => ({ name, value }));
  if (sort === "value") out.sort((a, b) => b.value - a.value);
  else out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

/**
 * Calcula indicadores básicos a partir das ARTs já carregadas.
 * Pure function — sem efeitos colaterais.
 */
export function computeIndicators(arts: GovArt[], names: NameMaps = {}): GovIndicators {
  const mUf = new Map<string, number>();
  const mAno = new Map<string, number>();
  const mMes = new Map<string, number>();
  const mContrat = new Map<string, number>();
  const mRt = new Map<string, number>();

  let comUf = 0, comAno = 0, comContratante = 0, comRt = 0;

  for (const a of arts) {
    const uf = (a.uf ?? "").toString().trim().toUpperCase();
    if (uf) { bump(mUf, uf); comUf++; } else bump(mUf, SEM);

    const y = ano(a);
    if (y) { bump(mAno, y); comAno++; } else bump(mAno, SEM);

    const ym = anoMes(a);
    if (ym) bump(mMes, ym); else bump(mMes, SEM);

    if (a.contratante_id) {
      const nome = names.contratantes?.get(a.contratante_id) ?? a.contratante_id;
      bump(mContrat, nome);
      comContratante++;
    } else bump(mContrat, SEM);

    if (a.rt_id) {
      const nome = names.rts?.get(a.rt_id) ?? a.rt_id;
      bump(mRt, nome);
      comRt++;
    } else bump(mRt, SEM);
  }

  return {
    porUf:          toBuckets(mUf),
    porAno:         toBuckets(mAno, "name"),
    porMes:         toBuckets(mMes, "name"),
    porContratante: toBuckets(mContrat),
    porRt:          toBuckets(mRt),
    totais: {
      arts: arts.length,
      comUf, comAno, comContratante, comRt,
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// Detecção de divergências entre ARTs com a MESMA chave canônica
// (mesma UF + mesmo número), vindas de planilhas diferentes.
// Não altera dados — apenas relata o que diverge.
// ─────────────────────────────────────────────────────────────────
export type Divergencia = {
  chave: string;                // "UF::numero"
  campo: "endereco" | "contratante_id" | "rt_id" | "valor_taxa" | "valor_pago" | "valor_contrato" | "cidade";
  valores: (string | number | null)[];
  ocorrencias: number;
};

const CAMPOS_COMPARAR: Divergencia["campo"][] = [
  "endereco", "contratante_id", "rt_id", "cidade",
  "valor_taxa", "valor_pago", "valor_contrato",
];

export function detectarDivergencias(arts: GovArt[]): Divergencia[] {
  const grupos = new Map<string, GovArt[]>();
  for (const a of arts) {
    const k = chaveArt(a);
    if (!k) continue;
    const arr = grupos.get(k) ?? [];
    arr.push(a);
    grupos.set(k, arr);
  }
  const out: Divergencia[] = [];
  for (const [chave, grupo] of grupos) {
    if (grupo.length < 2) continue;
    for (const campo of CAMPOS_COMPARAR) {
      const set = new Set<string>();
      const vals: (string | number | null)[] = [];
      for (const a of grupo) {
        const v = (a as any)[campo];
        const norm = v == null || v === "" ? null : typeof v === "number" ? v : String(v).trim().toLowerCase();
        const key = norm == null ? "∅" : String(norm);
        if (!set.has(key)) { set.add(key); vals.push(v ?? null); }
      }
      if (set.size > 1) out.push({ chave, campo, valores: vals, ocorrencias: grupo.length });
    }
  }
  return out;
}
