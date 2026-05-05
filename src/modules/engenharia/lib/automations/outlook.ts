import { supabase } from "@/integrations/supabase/client";
import { fireAudit } from "../audit";
import { notify } from "./internalNotifications";

/**
 * P2 — Integração Outlook (sem credenciais).
 * Estratégia: abrir mailto:/ms-outlook URI a partir de templates configuráveis,
 * com fallback OWA (compose web) e log automático em eng_emails_log.
 */

export type OutlookMode = "mailto" | "owa" | "ms-outlook";

export interface ComposeInput {
  to: string[];
  cc?: string[];
  bcc?: string[];
  assunto: string;
  corpo: string;
  /** chave de origem (ex.: "rfi", "scrc", "energia") — usada no log */
  origem?: string;
  origem_id?: string | null;
  modulo?: string | null;
  /** se true, também grava notificação interna */
  notify_internal?: boolean;
}

export interface OutlookTemplate {
  id?: string;
  key: string;            // ex.: "scrc_envio", "rfi_resposta"
  label: string;
  to: string[];
  cc: string[];
  bcc?: string[];
  assunto: string;        // suporta {VAR}
  corpo: string;          // suporta {VAR}
  modulo?: string | null;
}

const KIND_TPL = "cfg_outlook_templates";
const TABLE = "eng_shared_records" as const;

/* ---------------- URI builders ---------------- */

function enc(s: string) { return encodeURIComponent(s ?? ""); }

export function buildMailto(i: ComposeInput): string {
  const to = (i.to ?? []).join(",");
  const params: string[] = [];
  if (i.cc?.length) params.push(`cc=${enc(i.cc.join(","))}`);
  if (i.bcc?.length) params.push(`bcc=${enc(i.bcc.join(","))}`);
  if (i.assunto) params.push(`subject=${enc(i.assunto)}`);
  if (i.corpo) params.push(`body=${enc(i.corpo)}`);
  return `mailto:${to}${params.length ? "?" + params.join("&") : ""}`;
}

/** Outlook Web (OWA) — abre o composer no navegador. */
export function buildOWA(i: ComposeInput): string {
  const params = new URLSearchParams();
  params.set("path", "/mail/action/compose");
  if (i.to?.length) params.set("to", i.to.join(","));
  if (i.assunto) params.set("subject", i.assunto);
  if (i.corpo) params.set("body", i.corpo);
  return `https://outlook.office.com/mail/deeplink/compose?${params.toString()}`;
}

/** Desktop Outlook via ms-outlook URI. */
export function buildMsOutlook(i: ComposeInput): string {
  const params = new URLSearchParams();
  if (i.to?.length) params.set("to", i.to.join(";"));
  if (i.cc?.length) params.set("cc", i.cc.join(";"));
  if (i.assunto) params.set("subject", i.assunto);
  if (i.corpo) params.set("body", i.corpo);
  return `ms-outlook://compose?${params.toString()}`;
}

/* ---------------- Render templates ---------------- */

export function renderTemplate(tpl: string, vars: Record<string, string | number | null | undefined>): string {
  return (tpl ?? "").replace(/\{([A-Z0-9_]+)\}/g, (_, k) => {
    const v = vars[k];
    return v === null || v === undefined ? "" : String(v);
  });
}

/* ---------------- Compose + log ---------------- */

export async function composeOutlook(input: ComposeInput, mode: OutlookMode = "mailto"): Promise<void> {
  const url =
    mode === "owa" ? buildOWA(input) :
    mode === "ms-outlook" ? buildMsOutlook(input) :
    buildMailto(input);

  // Log em eng_emails_log
  try {
    await (supabase.from("eng_emails_log" as any).insert({
      destinatario: (input.to ?? []).join(", "),
      assunto: input.assunto,
      status: "composed",
      payload: {
        mode,
        cc: input.cc ?? [],
        bcc: input.bcc ?? [],
        corpo_preview: (input.corpo ?? "").slice(0, 500),
        origem: input.origem ?? null,
        origem_id: input.origem_id ?? null,
        modulo: input.modulo ?? null,
        url_kind: mode,
      },
    } as any) as any);
  } catch (e) {
    console.warn("eng_emails_log insert falhou", e);
  }

  fireAudit({
    acao: "outlook:compose",
    modulo: input.modulo ?? "emails",
    entidade_tipo: input.origem ?? "email",
    entidade_id: input.origem_id ?? null,
    nome_entidade: input.assunto,
  });

  if (input.notify_internal) {
    await notify({
      origem: "outlook",
      origem_id: input.origem_id ?? null,
      modulo: input.modulo ?? "emails",
      titulo: `E-mail preparado: ${input.assunto}`,
      detalhe: `Para: ${(input.to ?? []).join(", ")}`,
      tipo: "info",
      route: "/app/engenharia/emails",
    });
  }

  // Abrir composer
  if (typeof window !== "undefined") {
    if (mode === "owa") window.open(url, "_blank", "noopener");
    else window.location.href = url;
  }
}

/* ---------------- Templates persistence (eng_shared_records) ---------------- */

export async function loadOutlookTemplates(): Promise<OutlookTemplate[]> {
  const { data, error } = await (supabase
    .from(TABLE as any)
    .select("id,data")
    .eq("kind", KIND_TPL)
    .order("created_at", { ascending: true }) as any);
  if (error) throw error;
  return (data ?? []).map((row: any) => ({ id: row.id, ...(row.data as OutlookTemplate) }));
}

export async function saveOutlookTemplate(tpl: OutlookTemplate): Promise<OutlookTemplate> {
  const payload: OutlookTemplate = {
    key: tpl.key, label: tpl.label,
    to: tpl.to ?? [], cc: tpl.cc ?? [], bcc: tpl.bcc ?? [],
    assunto: tpl.assunto, corpo: tpl.corpo, modulo: tpl.modulo ?? null,
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

export async function deleteOutlookTemplate(id: string): Promise<void> {
  const { error } = await (supabase.from(TABLE as any).delete().eq("id", id) as any);
  if (error) throw error;
}

/* ---------------- Atalhos por módulo ---------------- */

export const DEFAULT_TEMPLATES: OutlookTemplate[] = [
  {
    key: "scrc_envio", label: "Envio de SC/RC",
    to: [], cc: [], modulo: "suprimentos",
    assunto: "SC/RC {NUMERO} — {SITE}",
    corpo: "Prezados,\n\nSegue para providências a SC/RC {NUMERO} referente ao site {SITE}.\nCategoria: {CATEGORIA}\nObservação: {OBS}\n\nAtt.",
  },
  {
    key: "rfi_resposta", label: "Resposta de RFI",
    to: [], cc: [], modulo: "rfi",
    assunto: "RFI {NUMERO} — {ASSUNTO}",
    corpo: "Prezados,\n\nEm resposta à RFI {NUMERO} ({ASSUNTO}):\n\n{DESCRICAO}\n\nAtt.",
  },
  {
    key: "energia_solicitacao", label: "Solicitação Energia",
    to: [], cc: [], modulo: "energia",
    assunto: "Solicitação de Ligação — {SITE} — Protocolo {PROTOCOLO}",
    corpo: "Prezados {CONCESSIONARIA},\n\nSolicitamos ligação de energia para o site {SITE}.\nProtocolo: {PROTOCOLO}\nData: {DATA}\n\nAtt.",
  },
];
