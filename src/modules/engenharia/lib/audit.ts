import { supabase } from "@/integrations/supabase/client";

export type AuditAction = "create"|"update"|"delete"|"view"|"login"|"logout"|"export"|"import"|"other";

export interface AuditLogInput {
  acao: AuditAction | string;
  modulo: string;
  entidade_tipo?: string | null;
  entidade_id?: string | number | null;
  nome_entidade?: string | null;
  dados_antes?: unknown;
  dados_depois?: unknown;
  observacoes?: string | null;
}

const SENSITIVE_KEYS = ["password","senha","token","access_token","refresh_token","secret","api_key","service_role"];

function sanitize(data: unknown): unknown {
  if (data == null) return data;
  if (Array.isArray(data)) return data.map(sanitize);
  if (typeof data === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.some((s) => k.toLowerCase().includes(s))) out[k] = "[REDACTED]";
      else out[k] = sanitize(v);
    }
    return out;
  }
  return data;
}

let cachedUA: string | null = null;
function getUserAgent(): string | null {
  if (cachedUA !== null) return cachedUA;
  if (typeof navigator !== "undefined") { cachedUA = navigator.userAgent || ""; return cachedUA; }
  return null;
}

export async function logAudit(input: AuditLogInput): Promise<void> {
  try {
    const payload = {
      _acao: String(input.acao),
      _modulo: input.modulo,
      _entidade_tipo: input.entidade_tipo ?? null,
      _entidade_id: input.entidade_id != null ? String(input.entidade_id) : null,
      _nome_entidade: input.nome_entidade ?? null,
      _dados_antes: input.dados_antes !== undefined ? (sanitize(input.dados_antes) as never) : null,
      _dados_depois: input.dados_depois !== undefined ? (sanitize(input.dados_depois) as never) : null,
      _ip_origem: null,
      _user_agent: getUserAgent(),
      _observacoes: input.observacoes ?? null,
    };
    // @ts-expect-error - função RPC custom não está nos types gerados
    await supabase.rpc("eng_log_audit", payload);
  } catch { /* silencioso */ }
}

export function fireAudit(input: AuditLogInput): void {
  void logAudit(input);
}
