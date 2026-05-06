import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useImpersonation } from "@/modules/planos/hooks/useImpersonation";

const sb: any = supabase;

/** Retorna a empresa "ativa" do usuário (ou impersonada). */
export function useHrdpCompany() {
  const { user } = useAuth();
  const imp = useImpersonation();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companies, setCompanies] = useState<{ id: string; nome: string }[]>([]);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!user) { setReady(true); return; }
      // checa admin
      const { data: roles } = await sb.from("user_roles").select("role").eq("user_id", user.id);
      if (cancel) return;
      const adminFlag = (roles ?? []).some((r: any) => r.role === "admin");
      setIsAdmin(adminFlag);

      // impersonando
      if (imp.active && imp.companyId) {
        setCompanyId(imp.companyId);
        setCompanyName(imp.companyName);
      } else if (adminFlag) {
        const { data } = await sb.from("companies").select("id, nome").order("nome");
        if (cancel) return;
        setCompanies(data ?? []);
        const stored = localStorage.getItem("rhdp_active_company");
        const initial = stored && (data ?? []).some((c: any) => c.id === stored) ? stored : (data?.[0]?.id ?? null);
        setCompanyId(initial);
        setCompanyName((data ?? []).find((c: any) => c.id === initial)?.nome ?? null);
      } else {
        const { data: cu } = await sb.from("company_users").select("company_id, companies(nome)").eq("user_id", user.id).maybeSingle();
        if (cancel) return;
        setCompanyId(cu?.company_id ?? null);
        setCompanyName(cu?.companies?.nome ?? null);
      }
      setReady(true);
    })();
    return () => { cancel = true; };
  }, [user, imp.active, imp.companyId]);

  function selectCompany(id: string) {
    localStorage.setItem("rhdp_active_company", id);
    setCompanyId(id);
    setCompanyName(companies.find(c => c.id === id)?.nome ?? null);
  }

  return { companyId, companyName, companies, ready, isAdmin, selectCompany };
}
