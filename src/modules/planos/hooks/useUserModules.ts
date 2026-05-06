import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useImpersonation } from "./useImpersonation";

/**
 * Retorna a lista de module_keys liberadas para o usuário atual
 * via RPC current_user_modules. Admin OCS recebe todos.
 * Quando há impersonação ativa, retorna os módulos da empresa visualizada.
 */
export function useUserModules() {
  const { user, isAdmin, loading } = useAuth();
  const imp = useImpersonation();
  const [modules, setModules] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (loading) return;
      if (!user) { setReady(true); return; }
      // Impersonando: buscar módulos do plano da empresa
      if (imp.active && imp.companyId) {
        const { data } = await (supabase as any).from("company_plans").select("modules").eq("company_id", imp.companyId).maybeSingle();
        if (cancel) return;
        setModules(new Set(((data?.modules ?? []) as string[])));
        setReady(true);
        return;
      }
      const { data, error } = await (supabase as any).rpc("current_user_modules", { _uid: user.id });
      if (cancel) return;
      if (error || !data) setModules(new Set());
      else setModules(new Set(data as string[]));
      setReady(true);
    })();
    return () => { cancel = true; };
  }, [user, loading, imp.active, imp.companyId]);

  function has(key: string) {
    if (imp.active) return modules.has(key);
    if (isAdmin) return true;
    return modules.has(key);
  }

  return { modules, has, isAdmin: imp.active ? false : isAdmin, ready };
}
