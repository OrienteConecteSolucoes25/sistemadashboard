import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserModules } from "@/modules/planos/hooks/useUserModules";

export function useCreaAccess() {
  const { user, isAdmin, loading } = useAuth();
  const { has, ready } = useUserModules();
  const [roleFlag, setRoleFlag] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (loading) return;
      if (!user) { setChecking(false); return; }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (cancel) return;
      const roles = (data ?? []).map((r: any) => r.role);
      setRoleFlag(roles.some((r: string) =>
        ["crea_admin","crea_analista","crea_responsavel_tecnico","crea_auditor","crea_visualizador"].includes(r)));
      setChecking(false);
    })();
    return () => { cancel = true; };
  }, [user, loading]);

  const hasModule = ready && has("crea.base");
  const hasAccess = isAdmin || roleFlag || hasModule;
  return { hasAccess, checking: checking || !ready, isAdmin };
}
