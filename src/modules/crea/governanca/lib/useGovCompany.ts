import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useGovCompany() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { if (!cancel) setLoading(false); return; }
      const { data: cu } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", u.user.id)
        .maybeSingle();
      if (cancel) return;
      setCompanyId(cu?.company_id ?? null);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, []);
  return { companyId, loading };
}
