import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Projeto {
  id: string;
  cliente: string; site: string; cidade: string; uf: string;
  responsavel_solicitante: string; projetista: string;
  local_elaboracao: string; escopo_generico: string; escopo: string;
  descricao: string; status: string;
  data_solicitacao: string; prazo_conclusao: string;
  prioridade: string; tempo_previsto: string;
  data_inicio_real: string; data_termino_real: string;
  tempo_real: string; dentro_prazo: string;
  tempo_resposta_previsto: number | null; tempo_resposta_real: number | null;
  diferenca_tempo: number | null; peso: number | null;
  conta: string; delta_horas: number | null;
  observacao: string; link_pasta: string;
}

const TABLE = "eng_projetos_elaboracao" as const;

function rowToProjeto(r: Record<string, unknown>): Projeto {
  return {
    id: String(r.id ?? ""),
    cliente: String(r.cliente ?? ""),
    site: String(r.site ?? ""),
    cidade: String(r.cidade ?? ""),
    uf: String(r.uf ?? ""),
    responsavel_solicitante: String(r.responsavel_solicitante ?? ""),
    projetista: String(r.projetista ?? ""),
    local_elaboracao: String(r.local_elaboracao ?? ""),
    escopo_generico: String(r.escopo_generico ?? ""),
    escopo: String(r.escopo ?? ""),
    descricao: String(r.descricao ?? ""),
    status: String(r.status ?? ""),
    data_solicitacao: String(r.data_solicitacao ?? "") || "",
    prazo_conclusao: String(r.prazo_conclusao ?? "") || "",
    prioridade: String(r.prioridade ?? ""),
    tempo_previsto: String(r.tempo_previsto ?? ""),
    data_inicio_real: String(r.data_inicio_real ?? "") || "",
    data_termino_real: String(r.data_termino_real ?? "") || "",
    tempo_real: String(r.tempo_real ?? ""),
    dentro_prazo: String(r.dentro_prazo ?? ""),
    tempo_resposta_previsto: r.tempo_resposta_previsto == null ? null : Number(r.tempo_resposta_previsto),
    tempo_resposta_real: r.tempo_resposta_real == null ? null : Number(r.tempo_resposta_real),
    diferenca_tempo: r.diferenca_tempo == null ? null : Number(r.diferenca_tempo),
    peso: r.peso == null ? null : Number(r.peso),
    conta: String(r.conta ?? ""),
    delta_horas: r.delta_horas == null ? null : Number(r.delta_horas),
    observacao: String(r.observacao ?? ""),
    link_pasta: String(r.link_pasta ?? ""),
  };
}

function projetoToRow(p: Projeto): Record<string, unknown> {
  const { id, ...rest } = p;
  const norm: Record<string, unknown> = { ...rest };
  for (const k of ["data_solicitacao", "prazo_conclusao", "data_inicio_real", "data_termino_real"]) {
    if (!norm[k]) norm[k] = null;
  }
  return norm;
}

export function useProjetos() {
  const [items, setItems] = useState<Projeto[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.warn("Projetos load:", error.message); setReady(true); return; }
    setItems((data ?? []).map((r) => rowToProjeto(r as Record<string, unknown>)));
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
    const ch = supabase
      .channel("eng-projetos-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: TABLE }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refresh]);

  const insertOne = useCallback(async (p: Projeto): Promise<Projeto | null> => {
    const row = projetoToRow(p) as never;
    const { data, error } = await supabase.from(TABLE).insert(row).select().single();
    if (error) { console.error("insert projeto", error); return null; }
    return rowToProjeto(data as Record<string, unknown>);
  }, []);

  const insertMany = useCallback(async (list: Projeto[]): Promise<number> => {
    if (!list.length) return 0;
    const rows = list.map((p) => projetoToRow(p)) as never;
    const { error, count } = await supabase.from(TABLE).insert(rows, { count: "exact" });
    if (error) { console.error("insertMany projetos", error); return 0; }
    return count ?? list.length;
  }, []);

  const updateOne = useCallback(async (id: string, p: Projeto): Promise<boolean> => {
    const row = projetoToRow(p) as never;
    const { error } = await supabase.from(TABLE).update(row).eq("id", id);
    if (error) { console.error("update projeto", error); return false; }
    return true;
  }, []);

  const deleteOne = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) { console.error("delete projeto", error); return false; }
    return true;
  }, []);

  const deleteMany = useCallback(async (ids: string[]): Promise<boolean> => {
    if (!ids.length) return true;
    const { error } = await supabase.from(TABLE).delete().in("id", ids);
    if (error) { console.error("deleteMany projetos", error); return false; }
    return true;
  }, []);

  return { items, ready, refresh, insertOne, insertMany, updateOne, deleteOne, deleteMany };
}
