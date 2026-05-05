import { supabase } from "@/integrations/supabase/client";
import { fireAudit } from "../audit";

/** Garante existência de um site pelo código. Idempotente. Retorna o id. */
export async function ensureSiteByCodigo(
  codigo: string | null | undefined,
  fallbackNome?: string,
): Promise<string | null> {
  const code = (codigo ?? "").trim();
  if (!code) return null;
  try {
    const { data: existing } = await supabase
      .from("eng_sites")
      .select("id")
      .eq("codigo", code)
      .maybeSingle();
    if (existing?.id) return existing.id as string;

    const { data: created, error } = await supabase
      .from("eng_sites")
      .insert({
        codigo: code,
        nome: fallbackNome?.trim() || code,
        status: "em_aprovacao",
      })
      .select("id")
      .single();
    if (error) { console.warn("siteAutocreate", error); return null; }
    fireAudit({
      acao: "automation:site_autocreate",
      modulo: "Sites",
      entidade_tipo: "eng_sites",
      entidade_id: created.id,
      nome_entidade: code,
      observacoes: "Site criado automaticamente por referência cruzada",
    });
    return created.id as string;
  } catch (e) {
    console.warn("ensureSiteByCodigo", e);
    return null;
  }
}
