import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Retorna a lista de module_keys liberadas para o usuário atual
 * via RPC current_user_modules. Admin OCS recebe todos.
 * Usado pra filtrar sidebar de Engenharia/Jurídico.
 */
export function useUserModules() {
  const { user, isAdmin, loading } = useAuth();
  const [modules, setModules] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (loading) return;
      if (!user) { setReady(true); return; }
      const { data, error } = await (supabase as any).rpc("current_user_modules", { _uid: user.id });
      if (cancel) return;
      if (error || !data) {
        setModules(new Set());
      } else {
        setModules(new Set(data as string[]));
      }
      setReady(true);
    })();
    return () => { cancel = true; };
  }, [user, loading]);

  function has(key: string) {
    if (isAdmin) return true;
    return modules.has(key);
  }

  return { modules, has, isAdmin, ready };
}
