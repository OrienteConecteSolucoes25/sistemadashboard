import { supabase } from "@/integrations/supabase/client";

const TABLE = "eng_sites" as const;

/**
 * Garante que exista uma obra (linha em eng_sites) com o nome dado.
 */
export async function ensureSite(args: {
  name?: string | null; city?: string | null; uf?: string | null;
}): Promise<void> {
  const name = (args.name ?? "").trim();
  if (!name) return;
  try {
    const { data: existing } = await (supabase.from(TABLE as any).select("id, nome").ilike("nome", name).limit(1) as any);
    if (existing && existing.length > 0) return;

    await (supabase.from(TABLE as any).insert({
      nome: name,
      cidade: (args.city ?? "").trim() || null,
      uf: (args.uf ?? "").trim().toUpperCase() || null,
    } as any) as any);
  } catch (e) {
    console.warn("ensureSite", e);
  }
}
