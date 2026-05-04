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
  status_solicitacao: "status",
  status_da_solicitacao: "status",
};

export function resolveFieldKey(labelOrKey: string): string {
  const k = normalizeFieldKey(labelOrKey);
  return ALIAS[k] ?? k;
}

export function useFieldOptions(labelOrKey: string) {
  const fieldKey = resolveFieldKey(labelOrKey);
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!fieldKey) { setOptions([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("eng_field_options")
      .select("value")
      .eq("field_key", fieldKey)
      .order("value", { ascending: true });
    if (error) console.error("useFieldOptions", fieldKey, error);
    setOptions((data ?? []).map((r) => r.value as string));
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

  const addOption = useCallback(async (value: string) => {
    const v = (value ?? "").toString().trim();
    if (!v || !fieldKey) return false;
    const { error } = await supabase
      .from("eng_field_options")
      .insert({ field_key: fieldKey, value: v } as any);
    if (error && !String(error.message).toLowerCase().includes("duplicate")) {
      console.error("addOption", error);
      return false;
    }
    return true;
  }, [fieldKey]);

  return { options, loading, addOption, fieldKey, reload: load };
}
