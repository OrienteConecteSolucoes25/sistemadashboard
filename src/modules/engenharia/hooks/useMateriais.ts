import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Material {
  id: string;
  codigo: string;
  descricao: string;
  categoria: string;
  conta_financeira: string;
  unidade: string;
}

export function useMateriais() {
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const all: Material[] = [];
      let from = 0;
      const page = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("eng_shared_records")
          .select("id,data")
          .eq("kind", "cad_materiais")
          .range(from, from + page - 1);
        if (error || !data || data.length === 0) break;
        data.forEach((row: any) => {
          const d = row.data || {};
          all.push({
            id: row.id,
            codigo: String(d.codigo ?? ""),
            descricao: String(d.descricao ?? "").replace(/^[\u0095\u2022\s]+/, ""),
            categoria: String(d.categoria ?? ""),
            conta_financeira: String(d.conta_financeira ?? ""),
            unidade: String(d.unidade ?? ""),
          });
        });
        if (data.length < page) break;
        from += page;
      }
      if (mounted) { setItems(all); setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const contaPorCategoria = useMemo(() => {
    const m = new Map<string, string>();
    for (const it of items) {
      if (it.categoria && it.conta_financeira && !m.has(it.categoria)) {
        m.set(it.categoria, it.conta_financeira);
      }
    }
    return m;
  }, [items]);

  const categorias = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => i.categoria && s.add(i.categoria));
    return Array.from(s).sort();
  }, [items]);

  return { items, loading, contaPorCategoria, categorias };
}

export async function addMaterial(mat: Omit<Material, "id">) {
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("eng_shared_records")
    .insert({
      kind: "cad_materiais",
      data: {
        codigo: mat.codigo,
        descricao: mat.descricao,
        categoria: mat.categoria,
        conta_financeira: mat.conta_financeira,
        unidade: mat.unidade,
        quantidade: "0",
      },
      created_by: u.user?.id ?? null,
    } as any)
    .select()
    .single();
  if (error) throw error;
  return data;
}
