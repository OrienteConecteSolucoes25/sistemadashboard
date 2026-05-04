import { supabase } from "@/integrations/supabase/client";

const KIND = "cfg_emails_rcsc";
const TABLE = "eng_shared_records" as const;

export interface EmailRcConfig {
  id?: string; to: string[]; cc: string[]; assunto: string;
}

const DEFAULT_CFG: EmailRcConfig = { to: [], cc: [], assunto: "RC/SC — {SITE}" };

export async function loadEmailRcConfig(): Promise<EmailRcConfig> {
  const { data, error } = await (supabase.from(TABLE as any).select("id,data").eq("kind", KIND).order("created_at", { ascending: false }).limit(1) as any);
  if (error) throw error;
  if (!data || data.length === 0) return { ...DEFAULT_CFG };
  const row = data[0] as { id: string; data: Partial<EmailRcConfig> };
  return {
    id: row.id,
    to: Array.isArray(row.data?.to) ? row.data!.to! : [],
    cc: Array.isArray(row.data?.cc) ? row.data!.cc! : [],
    assunto: row.data?.assunto ?? DEFAULT_CFG.assunto,
  };
}

export async function saveEmailRcConfig(cfg: EmailRcConfig): Promise<EmailRcConfig> {
  const payload = { to: cfg.to, cc: cfg.cc, assunto: cfg.assunto };
  const { data: u } = await supabase.auth.getUser();
  if (cfg.id) {
    const { error } = await (supabase.from(TABLE as any).update({ data: payload } as any).eq("id", cfg.id) as any);
    if (error) throw error;
    return cfg;
  }
  const { data, error } = await (supabase.from(TABLE as any).insert({ kind: KIND, data: payload, created_by: u.user?.id ?? null } as any).select("id").single() as any);
  if (error) throw error;
  return { ...cfg, id: (data as { id: string }).id };
}
