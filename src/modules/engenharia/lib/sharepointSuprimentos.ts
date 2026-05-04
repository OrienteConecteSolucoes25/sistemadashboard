// STUB do envio para SharePoint Suprimentos (lista). Edge function não portada.
import { supabase } from "@/integrations/supabase/client";
import type { ScRcRow } from "./scrcStore";

const TABLE = "eng_ui_overrides" as const;
const OVERRIDE_ALVO = "sharepoint_suprimentos";

export type OcsField =
  | "centroCusto" | "siteObra" | "cidadeUf" | "coordenador"
  | "categoria" | "numeroDoc" | "dataDoc" | "tipoDoc"
  | "solicitante" | "observacao";

export const OCS_FIELDS: { key: OcsField; label: string }[] = [
  { key: "centroCusto", label: "Centro de custo" },
  { key: "siteObra", label: "Site / Obra" },
  { key: "cidadeUf", label: "Cidade/UF" },
  { key: "coordenador", label: "Coordenador" },
  { key: "categoria", label: "Categoria" },
  { key: "numeroDoc", label: "Nº SC/RC" },
  { key: "tipoDoc", label: "Tipo (SC/RC)" },
  { key: "dataDoc", label: "Data SC/RC" },
  { key: "solicitante", label: "Solicitante" },
  { key: "observacao", label: "Observação" },
];

export interface SpListConfig {
  siteId?: string; listId: string;
  fieldMap: Partial<Record<OcsField, string>>;
}

export async function loadConfig(): Promise<SpListConfig> {
  const { data } = await (supabase.from(TABLE as any).select("config").eq("escopo", "global").eq("alvo", OVERRIDE_ALVO).eq("ativo", true).maybeSingle() as any);
  const cfg = (data?.config as Partial<SpListConfig> | undefined) ?? {};
  return { siteId: cfg.siteId, listId: cfg.listId || "", fieldMap: cfg.fieldMap ?? {} };
}

export async function saveConfig(cfg: SpListConfig) {
  const { data: existing } = await (supabase.from(TABLE as any).select("id").eq("escopo", "global").eq("alvo", OVERRIDE_ALVO).maybeSingle() as any);
  if (existing?.id) {
    const { error } = await (supabase.from(TABLE as any).update({ config: cfg as any, ativo: true }).eq("id", existing.id) as any);
    if (error) throw error;
  } else {
    const { error } = await (supabase.from(TABLE as any).insert({ escopo: "global", alvo: OVERRIDE_ALVO, config: cfg as any, ativo: true } as any) as any);
    if (error) throw error;
  }
}

export async function resolveSite() { throw new Error("SharePoint não disponível neste ambiente."); }
export async function listColumns(_siteId: string, _listId: string) { throw new Error("SharePoint não disponível neste ambiente."); }
export async function listLists(_siteId: string) { throw new Error("SharePoint não disponível neste ambiente."); }
export async function ensureSiteId(cfg: SpListConfig): Promise<SpListConfig> { return cfg; }
export async function enviarSCRCs(
  _solicit: any,
  _scrcs: ScRcRow[],
  _solicitanteEmail?: string,
) { throw new Error("Envio para SharePoint Suprimentos ainda não disponível neste ambiente."); }
