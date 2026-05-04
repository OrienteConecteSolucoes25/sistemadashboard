import { supabase } from "@/integrations/supabase/client";
import { lsGet, lsSet } from "./storage";
import { fireAudit } from "./audit";
import { scheduleSpSync } from "./sharepointSync";

const KIND_TO_MODULO: Record<string, string> = {
  ocs_solicits: "Solicitações de Engenharia",
  ocs_arts: "ART", ocs_atividades: "Atividades",
  ocs_demandas: "Demandas", ocs_emails: "E-mails",
  ocs_relatorios: "Relatórios", ocs_ligacoes_energia: "Ligações de Energia",
  ocs_rfi: "RFI",
};
function moduloOf(kind: string): string { return KIND_TO_MODULO[kind] ?? kind; }

export interface SharedRecord<T = Record<string, unknown>> {
  id: string; kind: string; data: T;
  created_by: string | null; created_at: string; updated_at: string;
}

const MIGRATED_FLAG = (key: string) => `__migrated_eng_${key}`;
const TABLE = "eng_shared_records" as const;

export async function loadShared<T = Record<string, unknown>>(kind: string, legacyLocalKey?: string): Promise<SharedRecord<T>[]> {
  if (legacyLocalKey && !localStorage.getItem(MIGRATED_FLAG(legacyLocalKey))) {
    const local = lsGet<unknown[]>(legacyLocalKey, []);
    if (Array.isArray(local) && local.length > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      const rows = local.map((item) => ({ kind, data: item as Record<string, unknown>, created_by: user?.id ?? null }));
      await (supabase.from(TABLE as any).insert(rows as any) as any);
    }
    localStorage.setItem(MIGRATED_FLAG(legacyLocalKey), "1");
  }
  const { data, error } = await (supabase.from(TABLE as any).select("*").eq("kind", kind).order("created_at", { ascending: false }) as any);
  if (error) { console.error("loadShared", kind, error); return []; }
  return (data ?? []) as SharedRecord<T>[];
}

export async function insertShared<T extends Record<string, unknown>>(kind: string, data: T): Promise<SharedRecord<T> | null> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: row, error } = await (supabase.from(TABLE as any).insert({ kind, data: data as any, created_by: user?.id ?? null }).select().single() as any);
  if (error) { console.error(error); return null; }
  fireAudit({
    acao: "create", modulo: moduloOf(kind), entidade_tipo: kind,
    entidade_id: (row as SharedRecord<T>).id,
    nome_entidade: String((data as Record<string, unknown>).nome ?? (data as Record<string, unknown>).site ?? (data as Record<string, unknown>).titulo ?? ""),
    dados_depois: data,
  });
  scheduleSpSync(kind);
  return row as SharedRecord<T>;
}

export async function insertSharedMany<T extends Record<string, unknown>>(kind: string, items: T[]): Promise<number> {
  if (!items.length) return 0;
  const { data: { user } } = await supabase.auth.getUser();
  const rows = items.map((d) => ({ kind, data: d, created_by: user?.id ?? null }));
  const { error } = await (supabase.from(TABLE as any).insert(rows as any) as any);
  if (error) { console.error(error); return 0; }
  fireAudit({ acao: "import", modulo: moduloOf(kind), entidade_tipo: kind, observacoes: `Importação em massa: ${rows.length} registro(s)` });
  scheduleSpSync(kind);
  return rows.length;
}

export async function updateShared<T extends Record<string, unknown>>(id: string, data: T): Promise<boolean> {
  const { data: prev } = await (supabase.from(TABLE as any).select("kind,data").eq("id", id).maybeSingle() as any);
  const { error } = await (supabase.from(TABLE as any).update({ data: data as any }).eq("id", id) as any);
  if (error) { console.error(error); return false; }
  if (prev) {
    fireAudit({
      acao: "update", modulo: moduloOf((prev as { kind: string }).kind),
      entidade_tipo: (prev as { kind: string }).kind, entidade_id: id,
      dados_antes: (prev as { data: unknown }).data, dados_depois: data,
    });
    scheduleSpSync((prev as { kind: string }).kind);
  }
  return true;
}

export async function deleteShared(id: string): Promise<boolean> {
  const { data: prev } = await (supabase.from(TABLE as any).select("kind,data").eq("id", id).maybeSingle() as any);
  const { error } = await (supabase.from(TABLE as any).delete().eq("id", id) as any);
  if (error) { console.error(error); return false; }
  if (prev) {
    fireAudit({
      acao: "delete", modulo: moduloOf((prev as { kind: string }).kind),
      entidade_tipo: (prev as { kind: string }).kind, entidade_id: id,
      dados_antes: (prev as { data: unknown }).data,
    });
    scheduleSpSync((prev as { kind: string }).kind);
  }
  return true;
}

export function cacheLocal<T>(key: string, value: T) { lsSet(key, value); }
