import { supabase } from "@/integrations/supabase/client";
import type { ArtObra } from "./artObrasTypes";

const sb: any = supabase;

export async function listObras(companyId: string): Promise<ArtObra[]> {
  const { data, error } = await sb
    .from("crea_art_obras")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ArtObra[];
}

export async function createObra(input: Partial<ArtObra> & { company_id: string }) {
  const { data, error } = await sb.from("crea_art_obras").insert(input).select("*").single();
  if (error) throw error;
  return data as ArtObra;
}

export async function updateObra(id: string, patch: Partial<ArtObra>) {
  const { data, error } = await sb.from("crea_art_obras").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data as ArtObra;
}

export async function bulkInsertObras(rows: Array<Partial<ArtObra> & { company_id: string }>) {
  if (rows.length === 0) return 0;
  const chunk = 200;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    const { error } = await sb.from("crea_art_obras").insert(slice);
    if (error) throw error;
    inserted += slice.length;
  }
  return inserted;
}

/** Soft-delete via RPC crea_soft_delete (senha não é exigida nessa RPC, apenas motivo). */
export async function softDeleteObra(id: string, reason: string) {
  const { data, error } = await sb.rpc("crea_soft_delete", {
    _table: "crea_art_obras",
    _id: id,
    _reason: reason,
  });
  if (error) return { ok: false as const, error: error.message };
  return (data ?? { ok: false, error: "unknown" }) as { ok: boolean; error?: string };
}
