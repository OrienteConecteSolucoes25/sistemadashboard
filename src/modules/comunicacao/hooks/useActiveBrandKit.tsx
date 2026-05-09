import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useComunicacaoAccess } from "./useComunicacaoAccess";

type Brand = any;

interface Ctx {
  brands: Brand[];
  activeBrandId: string | null;
  activeBrand: Brand | null;
  setActiveBrandId: (id: string | null) => void;
  reload: () => Promise<void>;
  loading: boolean;
}

const C = createContext<Ctx>({
  brands: [], activeBrandId: null, activeBrand: null,
  setActiveBrandId: () => {}, reload: async () => {}, loading: true,
});

const STORAGE_KEY = "ocs.comm.activeBrandKit";

export function ActiveBrandKitProvider({ children }: { children: ReactNode }) {
  const { companyId } = useComunicacaoAccess();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeBrandId, setActive] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
  );
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!companyId) { setBrands([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("comm_brand_kits")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_deleted", false)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    const list = data ?? [];
    setBrands(list);
    setActive((cur) => {
      if (cur && list.some((b) => b.id === cur)) return cur;
      const def = list.find((b) => b.is_default) ?? list[0];
      return def?.id ?? null;
    });
    setLoading(false);
  }, [companyId]);

  useEffect(() => { reload(); }, [reload]);

  const setActiveBrandId = useCallback((id: string | null) => {
    setActive(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const activeBrand = brands.find((b) => b.id === activeBrandId) ?? null;

  return (
    <C.Provider value={{ brands, activeBrandId, activeBrand, setActiveBrandId, reload, loading }}>
      {children}
    </C.Provider>
  );
}

export function useActiveBrandKit() {
  return useContext(C);
}
