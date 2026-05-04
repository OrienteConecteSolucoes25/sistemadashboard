import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useGovernanceAccess() {
  const { user, isAdmin, loading: authLoading } = useAuth() as any;
  const [hasAccess, setHasAccess] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [editOpenToAll, setEditOpenToAll] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (authLoading) return;
      if (!user) { setHasAccess(false); setCanEdit(false); setLoading(false); return; }
      setHasAccess(true);
      const [{ data: rolesData }, { data: settingsData }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("eng_gov_settings").select("edit_open_to_all").eq("id", true).maybeSingle(),
      ]);
      if (cancel) return;
      const roles = (rolesData ?? []).map((r: any) => String(r.role));
      const open = !!(settingsData?.edit_open_to_all);
      setEditOpenToAll(open);
      setCanEdit(!!isAdmin || roles.includes("planejamento") || roles.includes("diretoria") || open);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [user, isAdmin, authLoading]);

  return { hasAccess, canEdit, editOpenToAll, loading };
}
