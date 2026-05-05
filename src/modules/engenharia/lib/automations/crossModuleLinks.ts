import { supabase } from "@/integrations/supabase/client";
import { fireAudit } from "../audit";
import { notify } from "./internalNotifications";

/** Vincula um SC/RC a uma solicitação (eng_suprimentos). */
export async function linkScRcToSolicit(scrcId: string, solicitId: string): Promise<boolean> {
  try {
    const { error } = await (supabase
      .from("eng_solicitacao_sc_rc")
      .update({ solicit_id: solicitId } as any)
      .eq("id", scrcId) as any);
    if (error) throw error;
    fireAudit({
      acao: "automation:link_scrc",
      modulo: "Suprimentos",
      entidade_tipo: "eng_solicitacao_sc_rc",
      entidade_id: scrcId,
      observacoes: `Vinculado à solicitação ${solicitId}`,
    });
    await notify({
      origem: "eng_suprimentos",
      origem_id: solicitId,
      modulo: "Suprimentos",
      tipo: "vinculo",
      titulo: "Novo SC/RC vinculado à solicitação",
      route: `/app/engenharia/suprimentos`,
    });
    return true;
  } catch (e) {
    console.warn("linkScRcToSolicit", e);
    return false;
  }
}

/** Lista atividades de um projeto (via data->>projeto_id). */
export async function getProjectActivities(projeto_id: string) {
  const { data } = await supabase
    .from("eng_atividades")
    .select("id, titulo, status, responsavel, prazo")
    .eq("projeto_id", projeto_id)
    .order("created_at", { ascending: false });
  return data ?? [];
}
