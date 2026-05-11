import { supabase } from "@/integrations/supabase/client";
import type { Empresa } from "./empresasTypes";

const sb: any = supabase;

export async function listEmpresas(companyId: string): Promise<Empresa[]> {
  const { data, error } = await sb
    .from("crea_empresas")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_deleted", false)
    .order("nome_fantasia", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Empresa[];
}

export async function createEmpresa(input: Partial<Empresa> & { company_id: string }) {
  const { data, error } = await sb.from("crea_empresas").insert(input).select("*").single();
  if (error) throw error;
  return data as Empresa;
}

export async function updateEmpresa(id: string, patch: Partial<Empresa>) {
  const { data, error } = await sb.from("crea_empresas").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data as Empresa;
}

export async function bulkInsertEmpresas(rows: Array<Partial<Empresa> & { company_id: string }>) {
  if (rows.length === 0) return 0;
  const chunk = 200;
  let n = 0;
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    const { error } = await sb.from("crea_empresas").insert(slice);
    if (error) throw error;
    n += slice.length;
  }
  return n;
}

export async function softDeleteEmpresa(id: string, reason: string) {
  const { data, error } = await sb.rpc("crea_soft_delete", {
    _table: "crea_empresas", _id: id, _reason: reason,
  });
  if (error) return { ok: false as const, error: error.message };
  return (data ?? { ok: false, error: "unknown" }) as { ok: boolean; error?: string };
}
