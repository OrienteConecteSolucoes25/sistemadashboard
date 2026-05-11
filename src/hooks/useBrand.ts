import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type BrandInfo = {
  loading: boolean;
  showOcsBrand: boolean;
  title: string;
  subtitle: string | null;
};

const FALLBACK_TITLE_OCS = "ERP OCS";
const FALLBACK_SUB_OCS = "Oriente Conecte Soluções";
const NEUTRAL_TITLE = "Sistema dashboard";

/**
 * Decide se a marca "ERP OCS / Oriente Conecte Soluções" deve aparecer
 * para o usuário logado. Lê a flag `companies.show_ocs_brand` da empresa
 * vinculada ao usuário (via `company_users`).
 *
 * - Quando ligada (default): mostra "ERP OCS / Oriente Conecte Soluções".
 * - Quando desligada (ex: Nova Corrente): mostra "Sistema dashboard".
 */
export function useBrand(): BrandInfo {
  const { user, loading: authLoading } = useAuth();
  const [showBrand, setShowBrand] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (authLoading) return;
      if (!user) { setShowBrand(true); setLoading(false); return; }
      const { data: cu } = await (supabase as any)
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancel) return;
      if (!cu?.company_id) { setShowBrand(true); setLoading(false); return; }
      const { data: c } = await (supabase as any)
        .from("companies")
        .select("show_ocs_brand")
        .eq("id", cu.company_id)
        .maybeSingle();
      if (cancel) return;
      setShowBrand(c?.show_ocs_brand !== false);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [user, authLoading]);

  return {
    loading,
    showOcsBrand: showBrand,
    title: showBrand ? FALLBACK_TITLE_OCS : NEUTRAL_TITLE,
    subtitle: showBrand ? FALLBACK_SUB_OCS : null,
  };
}
