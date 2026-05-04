import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ModulePermission {
  module: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export function useModulePermissions() {
  const { user, isAdmin, loading: authLoading } = useAuth() as any;
  const [perms, setPerms] = useState<Record<string, ModulePermission>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (authLoading) return;
      if (!user) { setPerms({}); setLoading(false); return; }
      const { data } = await supabase
        .from("eng_module_permissions")
        .select("module, can_view, can_edit, can_delete")
        .eq("user_id", user.id);
      if (cancel) return;
      const map: Record<string, ModulePermission> = {};
      (data ?? []).forEach((p: any) => { map[p.module] = p as ModulePermission; });
      setPerms(map);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [user, authLoading]);

  const can = (module: string, action: "view" | "edit" | "delete"): boolean => {
    if (isAdmin) return true;
    const p = perms[module];
    if (!p) return action === "view";
    if (action === "view") return p.can_view;
    if (action === "edit") return p.can_edit;
    return p.can_delete;
  };

  return { perms, can, loading };
}
