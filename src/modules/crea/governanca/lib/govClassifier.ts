import { supabase } from "@/integrations/supabase/client";

export type ClassifierRule = {
  id: string;
  palavra: string;
  is_regex: boolean;
  setor_id: string | null;
  tag_id: string | null;
  escopo_id: string | null;
  peso: number;
  ativa: boolean;
};

export type ClassifyResult = {
  setor_id?: string;
  setor_score?: number;
  tag_ids: string[];
  escopo_id?: string;
  escopo_score?: number;
  matches: { rule_id: string; palavra: string; peso: number }[];
};

export function classifyText(text: string, rules: ClassifierRule[]): ClassifyResult {
  const t = (text || "").toLowerCase();
  const matches: ClassifyResult["matches"] = [];
  const setorScore = new Map<string, number>();
  const escopoScore = new Map<string, number>();
  const tagSet = new Set<string>();

  for (const r of rules) {
    if (!r.ativa) continue;
    const w = r.palavra.toLowerCase();
    let hit = false;
    if (r.is_regex) {
      try { hit = new RegExp(r.palavra, "i").test(text || ""); } catch { hit = false; }
    } else {
      hit = !!w && t.includes(w);
    }
    if (!hit) continue;
    matches.push({ rule_id: r.id, palavra: r.palavra, peso: r.peso });
    if (r.setor_id) setorScore.set(r.setor_id, (setorScore.get(r.setor_id) ?? 0) + r.peso);
    if (r.escopo_id) escopoScore.set(r.escopo_id, (escopoScore.get(r.escopo_id) ?? 0) + r.peso);
    if (r.tag_id) tagSet.add(r.tag_id);
  }

  const top = (m: Map<string, number>) => {
    let bestId: string | undefined; let bestScore = 0;
    for (const [id, s] of m) if (s > bestScore) { bestScore = s; bestId = id; }
    return { id: bestId, score: bestScore };
  };
  const s = top(setorScore);
  const e = top(escopoScore);
  return {
    setor_id: s.id, setor_score: s.score,
    escopo_id: e.id, escopo_score: e.score,
    tag_ids: Array.from(tagSet),
    matches,
  };
}

export async function loadRules(companyId: string): Promise<ClassifierRule[]> {
  const { data, error } = await (supabase as any)
    .from("crea_gov_classificacao_regras")
    .select("id,palavra,is_regex,setor_id,tag_id,escopo_id,peso,ativa")
    .eq("company_id", companyId)
    .eq("ativa", true);
  if (error) throw error;
  return (data ?? []) as ClassifierRule[];
}

export async function classifyArtsBulk(companyId: string, artIds: string[]) {
  const sb: any = supabase;
  const rules = await loadRules(companyId);
  const { data: arts } = await sb.from("crea_gov_arts")
    .select("id,observacao,atividades_texto,codigo_tos,setor_principal_id,escopo_id")
    .in("id", artIds);
  const updates: any[] = [];
  const tagInserts: any[] = [];
  for (const a of (arts ?? [])) {
    const text = `${a.observacao ?? ""} ${a.atividades_texto ?? ""} ${a.codigo_tos ?? ""}`;
    const r = classifyText(text, rules);
    updates.push({ id: a.id, setor_ia_sugerido_id: r.setor_id ?? null, escopo_ia_sugerido_id: r.escopo_id ?? null });
    for (const tid of r.tag_ids) tagInserts.push({ art_id: a.id, tag_id: tid });
  }
  // batch updates
  for (const u of updates) {
    await sb.from("crea_gov_arts").update({
      setor_ia_sugerido_id: u.setor_ia_sugerido_id,
      escopo_ia_sugerido_id: u.escopo_ia_sugerido_id,
    }).eq("id", u.id);
  }
  if (tagInserts.length) {
    await sb.from("crea_gov_art_tags").upsert(tagInserts, { onConflict: "art_id,tag_id", ignoreDuplicates: true });
  }
  return { processed: updates.length, tags: tagInserts.length };
}
