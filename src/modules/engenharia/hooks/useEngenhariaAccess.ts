import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Considera que o usuário tem acesso ao módulo Engenharia se:
// - é admin, OU
// - pertence a pelo menos 1 grupo de visibilidade (qualquer um) — assumimos que
//   ENG é liberado por grupo. Quando módulos eng_* tiverem flag restricted,
//   esta lógica pode evoluir. Etapa 1 mantém simples.
export function useEngenhariaAccess() {
  const { user, isAdmin, loading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean>(false);
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
