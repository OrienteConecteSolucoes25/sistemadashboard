import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAclModuleOverride } from "@/acl/legacyBridge";

/** @deprecated Será substituído por `useCan("comunicacao.acessar")` na Leva 3. */
export function useComunicacaoAccess() {
  const { session, isAdmin } = useAuth();
  const { allow: aclAllow, ready: aclReady } = useAclModuleOverride("comunicacao");
  const [hasAccess, setHasAccess] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!session) { setHasAccess(false); setLoading(false); return; }
      if (isAdmin || aclAllow) { setHasAccess(true); }
      const uid = session.user.id;

      const { data: cu } = await supabase.from("company_users").select("company_id").eq("user_id", uid).limit(1).maybeSingle();
      if (active) setCompanyId(cu?.company_id ?? null);

      if (isAdmin || aclAllow) { setLoading(false); return; }

      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      const r = (roles ?? []).map((x: any) => x.role);
      const hasRole = r.some((x: string) =>
        ["comunicacao_admin","social_media","designer","redator","aprovador","gestor_produto"].includes(x)
      );
      if (hasRole) { if (active) { setHasAccess(true); setLoading(false); } return; }

      if (cu?.company_id) {
        const { data: perm } = await supabase.from("comm_module_permissions")
          .select("can_view").eq("user_id", uid).eq("company_id", cu.company_id).maybeSingle();
        if (active) setHasAccess(!!perm?.can_view);
      }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [session, isAdmin, aclAllow]);

  return { hasAccess, companyId, loading: loading || !aclReady };
}

