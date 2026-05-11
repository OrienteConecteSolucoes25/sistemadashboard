import { supabase } from "@/integrations/supabase/client";
import type { RtPessoa } from "./rtsTypes";

const sb: any = supabase;

export async function listRts(companyId: string): Promise<RtPessoa[]> {
  const { data, error } = await sb
    .from("crea_rts_pessoas")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as RtPessoa[];
}

export async function createRt(input: Partial<RtPessoa> & { company_id: string }) {
  const { data, error } = await sb.from("crea_rts_pessoas").insert(input).select("*").single();
  if (error) throw error;
  return data as RtPessoa;
}

export async function updateRt(id: string, patch: Partial<RtPessoa>) {
  const { data, error } = await sb.from("crea_rts_pessoas").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data as RtPessoa;
}

export async function bulkInsertRts(rows: Array<Partial<RtPessoa> & { company_id: string }>) {
  if (rows.length === 0) return 0;
  const chunk = 200;
  let n = 0;
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    const { error } = await sb.from("crea_rts_pessoas").insert(slice);
    if (error) throw error;
    n += slice.length;
  }
  return n;
}

export async function softDeleteRt(id: string, reason: string) {
  const { data, error } = await sb.rpc("crea_soft_delete", {
    _table: "crea_rts_pessoas", _id: id, _reason: reason,
  });
  if (error) return { ok: false as const, error: error.message };
  return (data ?? { ok: false, error: "unknown" }) as { ok: boolean; error?: string };
}
