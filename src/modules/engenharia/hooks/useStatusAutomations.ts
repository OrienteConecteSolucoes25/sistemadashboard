import { useCallback } from "react";
import { updateShared, insertShared } from "@/modules/engenharia/lib/sharedStore";
import { runStatusFlows } from "@/modules/engenharia/lib/automations/statusFlows";
import { ensureSiteByCodigo } from "@/modules/engenharia/lib/automations/siteAutocreate";
import { supabase } from "@/integrations/supabase/client";

/**
 * Wrapper de update/insert para tabelas eng_*. Após a mutação, dispara
 * `runStatusFlows` para gerar tarefas de follow-up e notificações internas.
 * Também garante criação automática de Site quando o registro referencia
 * um `site_codigo` inexistente.
 */
export function useStatusAutomations() {
  const updateWithFlows = useCallback(async (table: string, id: string, next: Record<string, any>) => {
    const { data: prev } = await (supabase.from(table as any).select("*").eq("id", id).maybeSingle() as any);
    const { error } = await (supabase.from(table as any).update(next as any).eq("id", id) as any);
    if (error) return { ok: false, error };
    await runStatusFlows(table, prev, { ...(prev ?? {}), ...next, id });
    return { ok: true };
  }, []);

  const insertWithFlows = useCallback(async (table: string, payload: Record<string, any>) => {
    // autocreate de site se vier site_codigo
    if (payload.site_codigo && !payload.site_id) {
      const id = await ensureSiteByCodigo(payload.site_codigo, payload.site_nome);
      if (id) payload.site_id = id;
      delete payload.site_codigo;
      delete payload.site_nome;
    }
    const { data, error } = await (supabase.from(table as any).insert(payload as any).select().single() as any);
    if (error) return { ok: false, error };
    await runStatusFlows(table, null, data);
    return { ok: true, data };
  }, []);

  // Wrappers p/ shared_records
  const updateSharedWithFlows = useCallback(async (id: string, kind: string, next: Record<string, any>, prev?: Record<string, any>) => {
    const ok = await updateShared(id, next as any);
    if (ok) await runStatusFlows(`shared:${kind}`, prev ?? null, next);
    return ok;
  }, []);

  const insertSharedWithFlows = useCallback(async (kind: string, data: Record<string, any>) => {
    const row = await insertShared(kind, data as any);
    if (row) await runStatusFlows(`shared:${kind}`, null, data);
    return row;
  }, []);

  return { updateWithFlows, insertWithFlows, updateSharedWithFlows, insertSharedWithFlows };
}
