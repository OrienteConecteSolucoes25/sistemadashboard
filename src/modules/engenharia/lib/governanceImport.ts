// Stub do importador de Governança. Implementação completa em iteração futura.
import { supabase } from "@/integrations/supabase/client";

export async function importGovernanceSheet(_file: File, kind: "atividades" | "resultados" | "faturamento"): Promise<{ ok: boolean; rows: number; message?: string }> {
  // Persist a placeholder run para permitir que a UI mostre histórico.
  const { data: u } = await supabase.auth.getUser();
  await supabase.from("eng_sync_runs").insert({
    kind: `gov_${kind}`,
    status: "skipped",
    message: "Importer stub — implementação completa pendente",
    ran_by: u.user?.id ?? null,
  } as any);
  return { ok: false, rows: 0, message: "Importação stub — implementação completa pendente." };
}
