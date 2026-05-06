import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserModules } from "@/modules/planos/hooks/useUserModules";

/**
 * Acesso ao módulo RH/DP. Usuário tem acesso se:
 * - é admin OCS
 * - tem papel rh_admin / dp_admin / auditor_rh
 * - empresa tem o módulo rhdp.base no plano e ele tem submódulos visíveis
 */
export function useRhdpAccess() {
  const { user, isAdmin, loading } = useAuth();
  const { has, ready: modulesReady } = useUserModules();
  const [hasRoleFlag, setHasRoleFlag] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (loading) return;
      if (!user) { setChecking(false); return; }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (cancel) return;
      const roles = (data ?? []).map((r: any) => r.role);
      setHasRoleFlag(roles.some((r: string) => ["rh_admin","dp_admin","auditor_rh"].includes(r)));
      setChecking(false);
    })();
    return () => { cancel = true; };
  }, [user, loading]);

  const hasModule = modulesReady && has("rhdp.base");
  const hasAccess = isAdmin || hasRoleFlag || hasModule;

  return { hasAccess, checking: checking || !modulesReady, isAdmin };
}
