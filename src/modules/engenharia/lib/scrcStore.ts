import { supabase } from "@/integrations/supabase/client";

const TABLE = "eng_solicitacao_sc_rc" as const;

export interface ScRcRow {
  id: string; solicit_id: string;
  tipo_documento: "SC" | "RC" | string;
  numero_documento: string;
  categoria?: string | null; conta_financeira?: string | null;
  centro_custo?: string | null; observacao?: string | null;
  status?: string | null; created_by?: string | null;
  data_solicitacao?: string | null;
  item_descricao?: string | null;
  created_at: string; updated_at: string;
}

export const SCRC_STATUS = [
  "SOLICITADO","EM COTAÇÃO","AGUARDANDO APROV. COORD.","AGUARDANDO APROV. GERÊNCIA",
  "REMANEJAMENTO","EM FABRICAÇÃO","EM SEPARAÇÃO","EM ROTA","DISPONÍVEL PARA RETIRA",
  "ENTREGUE","PENDENTE","PARALISADO","CANCELADO",
] as const;

export async function updateScRcStatus(id: string, status: string) {
  const { error } = await (supabase.from(TABLE as any).update({ status } as any).eq("id", id) as any);
  if (error) throw error;
}

export async function updateScRc(id: string, patch: Partial<ScRcRow>) {
  const { error } = await (supabase.from(TABLE as any).update(patch as any).eq("id", id) as any);
  if (error) throw error;
}

export async function listScRcAll(): Promise<ScRcRow[]> {
  const { data, error } = await (supabase.from(TABLE as any).select("*").order("created_at", { ascending: false }) as any);
  if (error) throw error;
  return (data ?? []) as ScRcRow[];
}

export async function listScRcBySolicit(solicitIds: string[]): Promise<ScRcRow[]> {
  if (!solicitIds.length) return [];
  const { data, error } = await (supabase.from(TABLE as any).select("*").in("solicit_id", solicitIds).order("created_at", { ascending: false }) as any);
  if (error) throw error;
  return (data ?? []) as ScRcRow[];
}

export async function createScRc(input: Omit<ScRcRow, "id" | "created_at" | "updated_at" | "created_by">) {
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await (supabase.from(TABLE as any).insert({ ...input, created_by: u.user?.id ?? null } as any).select().single() as any);
  if (error) throw error;
  return data as ScRcRow;
}

export async function deleteScRcMany(ids: string[]) {
  if (!ids.length) return;
  const { error } = await (supabase.from(TABLE as any).delete().in("id", ids) as any);
  if (error) throw error;
}
