import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserModules } from "@/modules/planos/hooks/useUserModules";
import { useAcl } from "@/acl/AclProvider";

/** @deprecated Em novos códigos use `useCan("rhdp.acessar")`. */
export function useRhdpAccess() {
  const { user, isAdmin, loading } = useAuth();
  const { has, ready: modulesReady } = useUserModules();
  const { loading: aclLoading, isInternalOcs, can } = useAcl();
  const aclAllow = isInternalOcs || can("rhdp.acessar");
  const aclReady = !aclLoading;
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
  const hasAccess = isAdmin || aclAllow || hasRoleFlag || hasModule;

  return { hasAccess, checking: checking || !modulesReady || !aclReady, isAdmin };
}

