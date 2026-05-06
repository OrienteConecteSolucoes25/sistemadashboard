import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function usePlanosAccess() {
  const { user, isAdmin, loading } = useAuth();
  const [isFinanceiro, setIsFinanceiro] = useState(false);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (loading) return;
      if (!user) { setChecking(false); return; }
      const [{ data: roles }, { data: cu }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        (supabase as any).from("company_users").select("company_id, is_company_admin").eq("user_id", user.id).maybeSingle(),
      ]);
      if (cancel) return;
      setIsFinanceiro(!!roles?.some((r: any) => r.role === "financeiro_ocs" || r.role === "admin"));
      setCompanyId(cu?.company_id ?? null);
      setIsCompanyAdmin(!!cu?.is_company_admin);
      setChecking(false);
    })();
    return () => { cancel = true; };
  }, [user, loading]);

  return { isAdmin, isFinanceiro, isCompanyAdmin, companyId, checking };
}
