import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteRef {
  name: string;
  city: string | null;
  state: string | null;
}

export function useSites() {
  const [list, setList] = useState<SiteRef[]>([]);
  useEffect(() => {
    let alive = true;
    supabase.from("eng_sites").select("nome, cidade, uf").then(({ data }) => {
      if (alive) {
        setList(((data ?? []) as any[]).map((s) => ({
          name: s.nome,
          city: s.cidade ?? null,
          state: s.uf ?? null,
        })));
      }
    });
    return () => { alive = false; };
  }, []);
  return list;
}

export function findSite(sites: SiteRef[], name: string): SiteRef | undefined {
  const n = name.trim().toLowerCase();
  if (!n) return undefined;
  return sites.find((s) => s.name.toLowerCase() === n);
}
