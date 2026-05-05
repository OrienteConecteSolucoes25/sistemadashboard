import { supabase } from "@/integrations/supabase/client";
import { fireAudit } from "../audit";

export interface NotifyInput {
  user_id?: string | null;
  origem: string;
  origem_id?: string | null;
  modulo?: string | null;
  titulo: string;
  detalhe?: string | null;
  tipo?: "info" | "prazo" | "status" | "vinculo" | "tarefa";
  route?: string | null;
}

export async function notify(input: NotifyInput): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await (supabase.from("eng_internal_notifications" as any).insert({
      user_id: input.user_id ?? null,
      origem: input.origem,
      origem_id: input.origem_id ?? null,
      modulo: input.modulo ?? null,
      titulo: input.titulo,
      detalhe: input.detalhe ?? null,
      tipo: input.tipo ?? "info",
      route: input.route ?? null,
      created_by: user?.id ?? null,
    } as any) as any);
    fireAudit({
      acao: "automation:notify",
      modulo: input.modulo ?? input.origem,
      entidade_tipo: input.origem,
      entidade_id: input.origem_id ?? null,
      nome_entidade: input.titulo,
    });
  } catch (e) {
    console.warn("notify falhou", e);
  }
}

export async function markRead(id: string): Promise<void> {
  await (supabase.from("eng_internal_notifications" as any).update({ lida: true }).eq("id", id) as any);
}

export async function markAllRead(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await (supabase
    .from("eng_internal_notifications" as any)
    .update({ lida: true })
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .eq("lida", false) as any);
}
