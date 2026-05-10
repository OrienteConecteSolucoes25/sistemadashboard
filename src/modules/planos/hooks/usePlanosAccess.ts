import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAcl } from "@/acl/AclProvider";

/**
 * @deprecated Será fatiado em hooks específicos lendo da ACL central
 * (`useCan("planos.acessar")`, `useCan("planos.gerenciar")`, etc.).
 * Mantido temporariamente porque também expõe `companyId` e flags de papel
 * usados em vários lugares — a remoção será feita após a Leva 8 (auditoria de uses).
 */
export function usePlanosAccess() {
  const { user, isAdmin, loading } = useAuth();
  const { isInternalOcs, can } = useAcl();
  const [isFinanceiro, setIsFinanceiro] = useState(false);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [hasRhDpRole, setHasRhDpRole] = useState(false);
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
      const rs = (roles ?? []).map((r: any) => r.role);
      setIsFinanceiro(rs.some((r: string) => r === "financeiro_ocs" || r === "admin"));
      setHasRhDpRole(rs.some((r: string) => r === "rh_admin" || r === "dp_admin" || r === "auditor_rh"));
      setCompanyId(cu?.company_id ?? null);
      setIsCompanyAdmin(!!cu?.is_company_admin);
      setChecking(false);
    })();
    return () => { cancel = true; };
  }, [user, loading]);

  // OCS staff = admin/financeiro_ocs sem vínculo a empresa cliente
  // OU equipe interna OCS conforme ACL central (acl_internal_staff)
  const isOcsStaff = isInternalOcs || (isFinanceiro && !companyId);
  // Acesso à página "Minha Empresa": admin/financeiro/RH-DP/company admin
  // OU permissão central `planos.acessar`
  const canSeeMinhaEmpresa =
    !!companyId &&
    (isAdmin || isFinanceiro || hasRhDpRole || isCompanyAdmin || can("planos.acessar"));

  return { isAdmin, isFinanceiro, isCompanyAdmin, hasRhDpRole, companyId, isOcsStaff, canSeeMinhaEmpresa, checking };
}
