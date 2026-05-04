import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { FibraChecklist, FibraChecklistItem } from "../lib/fibraChecklist";

export type { FibraChecklist, FibraChecklistItem };

export function useFibraChecklists() {
  const [checklists, setChecklists] = useState<FibraChecklist[]>([]);
  const [items, setItems] = useState<FibraChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: c }, { data: i }] = await Promise.all([
      supabase.from("eng_fibra_checklists").select("*").order("created_at", { ascending: false }),
      supabase.from("eng_fibra_checklist_items").select("*").order("ordem", { ascending: true }),
    ]);
    setChecklists((c ?? []) as unknown as FibraChecklist[]);
    setItems((i ?? []) as unknown as FibraChecklistItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = supabase
      .channel("eng-fibra-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "eng_fibra_checklists" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "eng_fibra_checklist_items" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const itemsByChecklist: Record<string, FibraChecklistItem[]> = {};
  items.forEach((it) => {
    if (!itemsByChecklist[it.checklist_id]) itemsByChecklist[it.checklist_id] = [];
    itemsByChecklist[it.checklist_id].push(it);
  });

  return { checklists, items, itemsByChecklist, loading, refetch: load };
}
