import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Etapa 1: admin OR pertence a qualquer grupo de visibilidade.
// Quando existir grupo "Jurídico" dedicado, evoluir para checagem por nome/módulo.
export function useJuridicoAccess() {
  const { user, isAdmin, loading } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancel = false;
    if (loading) return;
    if (!user) { setHasAccess(false); setChecking(false); return; }
    if (isAdmin) { setHasAccess(true); setChecking(false); return; }
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
  }, [user, isAdmin, loading]);

  return { hasAccess, checking: checking || loading };
}
