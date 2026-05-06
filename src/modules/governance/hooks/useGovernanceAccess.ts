import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useGovernanceAccess(moduleKey: string) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [editOpenToAll, setEditOpenToAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (!user) { setLoading(false); return; }
      // Settings
      const { data: s } = await supabase.from("governance_settings").select("edit_open_to_all").eq("id", true).maybeSingle();
      if (cancelled) return;
      const open = !!s?.edit_open_to_all;
      setEditOpenToAll(open);
      // Roles
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const r = (roles ?? []).map((x: any) => x.role);
      const isAdmin = r.includes("admin");
      const isPlanej = r.includes("planejamento") || r.includes("diretoria");
      const moduleEditors: Record<string, string[]> = {
        engenharia: ["engenharia", "fibra", "suprimentos"],
        juridico: ["juridico"],
        crea: ["crea_admin"],
        rhdp: ["rh_admin", "dp_admin"],
        comunicacao: ["comunicacao_admin"],
        geral: [],
      };
      const modR = moduleEditors[moduleKey] ?? [];
      const editor = isAdmin || isPlanej || open || modR.some((x) => r.includes(x));
      setHasAccess(true);
      setCanEdit(editor);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, moduleKey]);

  return { hasAccess, canEdit, editOpenToAll, loading };
}
