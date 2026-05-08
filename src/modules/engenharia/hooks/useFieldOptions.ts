import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function normalizeFieldKey(label: string): string {
  return (label || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const ALIAS: Record<string, string> = {
  clientes: "cliente",
  escopos: "escopo",
  categorias: "categoria",
  coordenadores: "coordenador",
  compradores: "comprador",
  prioridades: "prioridade",
  tipos: "tipo",
  tipo_de_solicitacao: "tipo",
  status_solicitacao: "status",
  status_da_solicitacao: "status",
  centros_de_custo: "centro_custo",
  centro_de_custo: "centro_custo",
  slas: "sla",
};

export function resolveFieldKey(labelOrKey: string): string {
  const k = normalizeFieldKey(labelOrKey);
  return ALIAS[k] ?? k;
}

export type FieldOption = { value: string; meta: Record<string, any> };

export function useFieldOptions(labelOrKey: string) {
  const fieldKey = resolveFieldKey(labelOrKey);
  const [items, setItems] = useState<FieldOption[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!fieldKey) { setItems([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("eng_field_options")
      .select("value, meta")
      .eq("field_key", fieldKey)
      .order("value", { ascending: true });
    if (error) console.error("useFieldOptions", fieldKey, error);
    setItems((data ?? []).map((r: any) => ({ value: r.value as string, meta: (r.meta ?? {}) as Record<string, any> })));
    setLoading(false);
  }, [fieldKey]);

  useEffect(() => {
    load();
    if (!fieldKey) return;
    const channel = supabase
      .channel(`eng_field_options_${fieldKey}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "eng_field_options", filter: `field_key=eq.${fieldKey}` },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fieldKey, load]);

  const addOption = useCallback(async (value: string, meta?: Record<string, any>) => {
    const v = (value ?? "").toString().trim();
    if (!v || !fieldKey) return false;
    // Optimistic: aparece imediatamente na UI
    setItems((prev) => {
      if (prev.some((p) => p.value.toLowerCase() === v.toLowerCase())) return prev;
      return [...prev, { value: v, meta: meta ?? {} }].sort((a, b) => a.value.localeCompare(b.value));
    });
    const { error } = await supabase
      .from("eng_field_options")
      .insert({ field_key: fieldKey, value: v, meta: meta ?? {} } as any);
    if (error && !String(error.message).toLowerCase().includes("duplicate")) {
      console.error("addOption", error);
      // Rollback
      setItems((prev) => prev.filter((p) => p.value !== v));
      return false;
    }
    return true;
  }, [fieldKey]);

  const options = items.map((i) => i.value);
  const findMeta = (value: string) => items.find((i) => i.value === value)?.meta ?? {};

  return { options, items, loading, addOption, fieldKey, reload: load, findMeta };
}
