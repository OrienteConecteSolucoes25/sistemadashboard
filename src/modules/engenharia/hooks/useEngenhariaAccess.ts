import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAclModuleOverride } from "@/acl/legacyBridge";

/**
 * @deprecated Será substituído por `useCan("engenharia.acessar")` na Leva 3.
 * Hoje funciona como OR: ACL central (nova) OU lógica legada.
 */
export function useEngenhariaAccess() {
  const { user, isAdmin, loading } = useAuth();
  const { allow: aclAllow, ready: aclReady } = useAclModuleOverride("engenharia");
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancel = false;
    if (loading) return;
    if (!user) { setHasAccess(false); setChecking(false); return; }
    if (isAdmin || aclAllow) { setHasAccess(true); setChecking(false); return; }
    (async () => {
      const { data } = await supabase
        .from("user_visibility_groups")
        .select("group_id")
        .eq("user_id", user.id)
        .limit(1);
      if (!cancel) {
        setHasAccess((data?.length ?? 0) > 0);
        setChecking(false);
      }
    })();
    return () => { cancel = true; };
  }, [user, isAdmin, loading, aclAllow]);

  return { hasAccess, checking: checking || loading || !aclReady };
}

