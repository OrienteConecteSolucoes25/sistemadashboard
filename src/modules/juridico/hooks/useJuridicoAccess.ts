import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAclModuleOverride } from "@/acl/legacyBridge";

/** @deprecated Será substituído por `useCan("juridico.acessar")` na Leva 3. */
export function useJuridicoAccess() {
  const { user, isAdmin, loading } = useAuth();
  const { allow: aclAllow, ready: aclReady } = useAclModuleOverride("juridico");
  const [hasAccess, setHasAccess] = useState(false);
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

