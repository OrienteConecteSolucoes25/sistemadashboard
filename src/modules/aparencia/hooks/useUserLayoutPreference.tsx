import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_PREFIX = "ocs.layoutpref.";

export function useUserLayoutPreference(moduleKey: string) {
  const { user } = useAuth();
  const localKey = STORAGE_PREFIX + moduleKey;
  const [collapsed, setCollapsedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(localKey) === "1";
  });
  const [loaded, setLoaded] = useState(false);

  // Carrega do banco (preferência do usuário)
  useEffect(() => {
    if (!user) { setLoaded(true); return; }
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from("user_layout_preferences")
        .select("internal_sidebar_collapsed")
        .eq("user_id", user.id)
        .eq("module_key", moduleKey)
        .maybeSingle();
      if (cancelled) return;
      if (data && typeof data.internal_sidebar_collapsed === "boolean") {
        setCollapsedState(data.internal_sidebar_collapsed);
        try { window.localStorage.setItem(localKey, data.internal_sidebar_collapsed ? "1" : "0"); } catch {}
      }
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [user, moduleKey, localKey]);

  const setCollapsed = useCallback((v: boolean) => {
    setCollapsedState(v);
    try { window.localStorage.setItem(localKey, v ? "1" : "0"); } catch {}
    if (!user) return;
    (supabase as any)
      .from("user_layout_preferences")
      .upsert({
        user_id: user.id,
        module_key: moduleKey,
        internal_sidebar_collapsed: v,
      }, { onConflict: "user_id,module_key" })
      .then(() => {});
  }, [user, moduleKey, localKey]);

  return { collapsed, setCollapsed, loaded };
}
