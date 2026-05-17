// Wrapper around supabase.functions.invoke for comm-* edge functions
import { supabase } from "@/integrations/supabase/client";

export async function commAi(payload: { kind: string; brand?: any; inputs?: Record<string, any>; model?: string; company_id?: string }) {
  const { data, error } = await supabase.functions.invoke("comm-ai", { body: payload });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as { ok: boolean; kind: string; data: any; model: string };
}

export async function commImageGen(payload: { prompt: string; company_id: string; brand_kit_id?: string; format?: string; model?: string; linked_post_id?: string }) {
  const { data, error } = await supabase.functions.invoke("comm-image-gen", { body: payload });
  if (error) throw error;
  const d = data as any;
  if (d?.error && !d?.fallback) throw new Error(d.error);
  return data as {
    ok?: boolean;
    image?: any;
    signed_url?: string;
    error?: string;
    detail?: string;
    fallback?: boolean;
    limit?: number;
  };
}

export async function commSoftDelete(table: string, id: string, reason: string) {
  const { data, error } = await supabase.rpc("comm_soft_delete", { _table: table, _id: id, _reason: reason });
  if (error) throw error;
  return data;
}
