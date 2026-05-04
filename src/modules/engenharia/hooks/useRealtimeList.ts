import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadListFromShared, saveListToShared } from "../lib/syncList";

export function useRealtimeList<T extends { id: string }>(kind: string, legacyKey: string) {
  const [items, setItemsState] = useState<T[]>([]);
  const [ready, setReady] = useState(false);
  const savingRef = useRef(0);
  const pendingRefreshRef = useRef(false);

  const refresh = useCallback(async () => {
    if (savingRef.current > 0) {
      pendingRefreshRef.current = true;
      return;
    }
    const data = await loadListFromShared<T>(kind, legacyKey);
    setItemsState(data);
    setReady(true);
  }, [kind, legacyKey]);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel(`eng_shared_${kind}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "eng_shared_records", filter: `kind=eq.${kind}` },
        () => refresh(),
      )
      .subscribe();
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [kind, refresh]);

  const setItems = useCallback(
    (next: T[] | ((prev: T[]) => T[])) => {
      setItemsState((prev) => {
        const computed = typeof next === "function" ? (next as (p: T[]) => T[])(prev) : next;
        savingRef.current += 1;
        saveListToShared(kind, legacyKey, computed, prev)
          .then((normalized) => {
            if (normalized.some((n, i) => n.id !== computed[i]?.id)) {
              setItemsState(normalized);
            }
          })
          .catch((e) => console.error("setItems save", kind, e))
          .finally(() => {
            savingRef.current = Math.max(0, savingRef.current - 1);
            if (savingRef.current === 0 && pendingRefreshRef.current) {
              pendingRefreshRef.current = false;
              refresh();
            }
          });
        return computed;
      });
    },
    [kind, legacyKey, refresh],
  );

  return { items, setItems, ready, refresh };
}
