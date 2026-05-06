import { supabase } from "@/integrations/supabase/client";

/**
 * Tabelas P1 com soft-delete habilitado.
 */
export const SOFT_DELETE_TABLES = [
  "eng_sites",
  "eng_atividades",
  "eng_pendencias",
  "eng_suprimentos",
  "eng_materiais",
  "eng_rfi",
] as const;

export type SoftDeleteTable = (typeof SOFT_DELETE_TABLES)[number];

export interface SoftDeleteResult {
  ok: boolean;
  error?:
    | "unauthenticated"
    | "forbidden"
    | "invalid_table"
    | "invalid_password"
    | "reason_required"
    | "not_found"
    | "already_deleted"
    | string;
}

/**
 * Helper centralizado: chama RPC server-side `eng_soft_delete`.
 * Toda a validação (permissão, senha, motivo) e auditoria acontece no servidor.
 * O frontend NÃO conhece nem armazena a senha — apenas repassa o que o usuário digitou.
 */
export async function softDeleteRecord(
  table: SoftDeleteTable,
  id: string,
  password: string,
  reason: string,
): Promise<SoftDeleteResult> {
  try {
    const { data, error } = await (supabase.rpc as any)("eng_soft_delete", {
      _table: table,
      _id: id,
      _password: password,
      _reason: reason,
    });
    if (error) return { ok: false, error: error.message };
    return (data ?? { ok: false, error: "unknown" }) as SoftDeleteResult;
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "unknown" };
  }
}

export const DELETE_ERROR_MESSAGES: Record<string, string> = {
  unauthenticated: "Você precisa estar autenticado.",
  forbidden: "Você não tem permissão para excluir este registro.",
  invalid_table: "Esta tabela não suporta exclusão segura.",
  invalid_password: "Senha de confirmação inválida.",
  reason_required: "Informe o motivo da exclusão.",
  not_found: "Registro não encontrado.",
  already_deleted: "Este registro já foi excluído.",
};
