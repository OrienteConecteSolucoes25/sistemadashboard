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

// ============ IA GRÁTIS (estudante/BYOK) — não consome créditos Lovable ============

const FREE_KEY = "comm.ai.free.enabled";
export const isFreeAiEnabled = () => {
  try { return (localStorage.getItem(FREE_KEY) ?? "1") === "1"; } catch { return true; }
};
export const setFreeAiEnabled = (v: boolean) => {
  try { localStorage.setItem(FREE_KEY, v ? "1" : "0"); } catch {}
};

export async function commAiFree(payload: { kind: string; brand?: any; inputs?: Record<string, any>; preferred?: string; company_id?: string }) {
  const { data, error } = await supabase.functions.invoke("comm-ai-free", { body: payload });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).detail || (data as any).error);
  return data as { ok: boolean; kind: string; data: any; model: string; provider: string };
}

export async function commAiAuto(payload: { kind: string; brand?: any; inputs?: Record<string, any>; model?: string; company_id?: string; preferred?: string }) {
  return isFreeAiEnabled() ? commAiFree(payload) : commAi(payload);
}

export async function commImageFree(payload: { prompt: string; company_id: string; brand_kit_id?: string; format?: string; preferred?: string; linked_post_id?: string }) {
  const { data, error } = await supabase.functions.invoke("comm-image-free", { body: payload });
  if (error) throw error;
  const d = data as any;
  if (d?.error && !d?.fallback) throw new Error(d.detail || d.error);
  return data as { ok?: boolean; image?: any; signed_url?: string; error?: string; provider?: string; attempts?: string[]; fallback?: boolean };
}

export async function commImageAuto(payload: { prompt: string; company_id: string; brand_kit_id?: string; format?: string; model?: string; preferred?: string; linked_post_id?: string }) {
  return isFreeAiEnabled() ? commImageFree(payload) : commImageGen(payload);
}

export async function commFlowRun(flow_id: string, inputs: Record<string, any> = {}) {
  const { data, error } = await supabase.functions.invoke("comm-flow-run", { body: { flow_id, inputs } });
  if (error) throw error;
  return data as { ok: boolean; run_id: string; log: any[]; result: any };
}

