import { supabase } from "@/integrations/supabase/client";
import { fireAudit } from "../audit";
import { notify } from "./internalNotifications";

/**
 * P3 — Integração WhatsApp via wa.me (sem credenciais).
 * Abre o cliente WhatsApp Web/App com mensagem pré-preenchida e registra log.
 */

export interface WaSendInput {
  /** telefone em E.164 (apenas dígitos, ex: 5511999998888) */
  phone: string;
  message: string;
  origem?: string;
  origem_id?: string | null;
  modulo?: string | null;
  notify_internal?: boolean;
}

export interface WaTemplate {
  id?: string;
  key: string;
  label: string;
  phone?: string;
  message: string; // {VAR}
  modulo?: string | null;
}

const KIND_TPL = "cfg_wa_templates";
const TABLE = "eng_shared_records" as const;

export function normalizePhone(phone: string): string {
  return (phone ?? "").replace(/\D/g, "");
}

export function buildWaUrl(phone: string, message: string): string {
  const p = normalizePhone(phone);
  const text = encodeURIComponent(message ?? "");
  return p ? `https://wa.me/${p}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function renderTemplate(tpl: string, vars: Record<string, string | number | null | undefined>): string {
  return (tpl ?? "").replace(/\{([A-Z0-9_]+)\}/g, (_, k) => {
    const v = vars[k];
    return v === null || v === undefined ? "" : String(v);
  });
}

export async function sendWhatsapp(input: WaSendInput): Promise<void> {
  const url = buildWaUrl(input.phone, input.message);

  try {
    await (supabase.from("eng_emails_log" as any).insert({
      destinatario: normalizePhone(input.phone),
      assunto: `[WhatsApp] ${(input.message ?? "").slice(0, 80)}`,
      status: "composed",
      payload: {
        canal: "whatsapp",
        origem: input.origem ?? null,
        origem_id: input.origem_id ?? null,
        modulo: input.modulo ?? null,
        message_preview: (input.message ?? "").slice(0, 500),
      },
    } as any) as any);
  } catch (e) {
    console.warn("eng_emails_log (wa) insert falhou", e);
  }

  fireAudit({
    acao: "whatsapp:compose",
    modulo: input.modulo ?? "whatsapp",
    entidade_tipo: input.origem ?? "whatsapp",
    entidade_id: input.origem_id ?? null,
    nome_entidade: (input.message ?? "").slice(0, 80),
  });

  if (input.notify_internal) {
    await notify({
      origem: "whatsapp",
      origem_id: input.origem_id ?? null,
      modulo: input.modulo ?? "whatsapp",
      titulo: `WhatsApp preparado p/ ${normalizePhone(input.phone)}`,
      detalhe: (input.message ?? "").slice(0, 200),
      tipo: "info",
    });
  }

  if (typeof window !== "undefined") window.open(url, "_blank", "noopener");
}

export async function loadWaTemplates(): Promise<WaTemplate[]> {
  const { data, error } = await (supabase
    .from(TABLE as any)
    .select("id,data")
    .eq("kind", KIND_TPL)
    .order("created_at", { ascending: true }) as any);
  if (error) throw error;
  return (data ?? []).map((row: any) => ({ id: row.id, ...(row.data as WaTemplate) }));
}

export async function saveWaTemplate(tpl: WaTemplate): Promise<WaTemplate> {
  const payload: WaTemplate = {
    key: tpl.key, label: tpl.label,
    phone: tpl.phone ?? "", message: tpl.message, modulo: tpl.modulo ?? null,
  };
  const { data: u } = await supabase.auth.getUser();
  if (tpl.id) {
    const { error } = await (supabase.from(TABLE as any).update({ data: payload } as any).eq("id", tpl.id) as any);
    if (error) throw error;
    return { ...payload, id: tpl.id };
  }
  const { data, error } = await (supabase
    .from(TABLE as any)
    .insert({ kind: KIND_TPL, data: payload, created_by: u.user?.id ?? null } as any)
    .select("id").single() as any);
  if (error) throw error;
  return { ...payload, id: (data as any).id };
}

export async function deleteWaTemplate(id: string): Promise<void> {
  const { error } = await (supabase.from(TABLE as any).delete().eq("id", id) as any);
  if (error) throw error;
}

export const DEFAULT_WA_TEMPLATES: WaTemplate[] = [
  { key: "campo_acionamento", label: "Acionamento de campo", message: "Olá {NOME}, precisamos do seu apoio no site {SITE} hoje. Pode confirmar?", modulo: "operacao" },
  { key: "fornecedor_cobranca", label: "Cobrança fornecedor", message: "Prezado {FORNECEDOR}, podemos ter um retorno sobre a SC/RC {NUMERO}? Obrigado.", modulo: "suprimentos" },
  { key: "energia_status", label: "Status energia", message: "Olá, qual o andamento do protocolo {PROTOCOLO} no site {SITE}?", modulo: "energia" },
];
