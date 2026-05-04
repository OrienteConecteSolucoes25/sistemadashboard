// Stub das fontes de dados de Governança (planilhas raw).
// Implementação completa fica para iteração futura.
import { supabase } from "@/integrations/supabase/client";

export interface GovSourceMeta {
  kind: "atividades" | "resultados" | "faturamento";
  count: number;
  lastImport: string | null;
}

export async function getGovSourcesStatus(): Promise<GovSourceMeta[]> {
  const out: GovSourceMeta[] = [];
  const tables = [
    { kind: "atividades" as const, t: "eng_gov_atividades_raw" },
    { kind: "resultados" as const, t: "eng_gov_resultados_raw" },
    { kind: "faturamento" as const, t: "eng_gov_faturamento_raw" },
  ];
  for (const { kind, t } of tables) {
    const { count, data } = await supabase
      .from(t as any)
      .select("imported_at", { count: "exact" })
      .order("imported_at", { ascending: false })
      .limit(1);
    out.push({
      kind,
      count: count ?? 0,
      lastImport: (data?.[0] as any)?.imported_at ?? null,
    });
  }
  return out;
}
