import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Retorna o company_id do usuário logado.
 * Tolera usuários sem vínculo (companyId=null) e usuários
 * vinculados a múltiplas empresas (pega a primeira).
 */
export function useGovCompany() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) { if (!cancel) setLoading(false); return; }
        const { data: cu } = await supabase
          .from("company_users")
          .select("company_id")
          .eq("user_id", u.user.id)
          .limit(1);
        if (cancel) return;
        setCompanyId((cu && cu[0]?.company_id) ?? null);
      } catch {
        if (!cancel) setCompanyId(null);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);
  return { companyId, loading };
}
