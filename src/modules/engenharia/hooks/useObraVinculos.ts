import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lsGet } from "../lib/storage";

export interface VinculoSolicit { id: string; categoria?: string; escopo?: string; status?: string; cliente?: string; coordenador?: string; data?: string; }
export interface VinculoArt { id: string; numero?: string; tipo?: string; status?: string; cliente?: string; custo?: number; vencimento?: string; }
export interface VinculoProjeto { id: string; cliente?: string; escopo?: string; status?: string; projetista?: string; prazo?: string; dentro_prazo?: string; }
export interface VinculoEnergia { id: string; concessionaria?: string; status?: string; protocolo?: string; data?: string; }
export interface VinculoGov { id: string; cliente?: string; servico?: string; status_bi?: string; status_atividade?: string; pct_conclusao_campo?: number | null; valor_total_atividade?: number | null; }
export interface SiteCost {
  id: string; site_id: string | null; site_name: string | null;
  categoria: string; descricao: string | null; valor: number;
  data_lancamento: string | null; origem: string | null;
  origem_id: string | null; observacao: string | null; created_at: string;
}

export const CATEGORIAS_CUSTO = [
  "Material","Mão de obra","ART / Taxas","Equipamento","Transporte",
  "Hospedagem / Alimentação","Combustível","Locação","Subcontratado","Outros",
] as const;

const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();
const matches = (a?: string | null, b?: string | null) => !!a && !!b && norm(a) === norm(b);

export function useObraVinculos(siteName: string | undefined, siteId: string | undefined) {
  const [projetos, setProjetos] = useState<VinculoProjeto[]>([]);
  const [govs, setGovs] = useState<VinculoGov[]>([]);
  const [energias, setEnergias] = useState<VinculoEnergia[]>([]);
  const [costs, setCosts] = useState<SiteCost[]>([]);
  const [solicits, setSolicits] = useState<VinculoSolicit[]>([]);
  const [arts, setArts] = useState<VinculoArt[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!siteName) return;
    setLoading(true);

    const lsSolicits = lsGet<Array<Record<string, unknown>>>("ocs_solicits", []);
    const lsArts = lsGet<Array<Record<string, unknown>>>("ocs_arts", []);
    setSolicits(
      lsSolicits
        .filter((s) => matches(String(s.siteObra ?? ""), siteName))
        .map((s) => ({
          id: String(s.id ?? crypto.randomUUID()),
          categoria: String(s.categoria ?? s.tipo ?? ""),
          escopo: String(s.escopo ?? ""),
          status: String(s.status ?? ""),
          cliente: String(s.cliente ?? ""),
          coordenador: String(s.coordenador ?? ""),
          data: String(s.dataSolicitacaoCoord ?? s.createdAt ?? ""),
        })),
    );
    setArts(
      lsArts
        .filter((a) => matches(String(a.siteObra ?? ""), siteName))
        .map((a) => ({
          id: String(a.id ?? crypto.randomUUID()),
          numero: String(a.numero ?? ""),
          tipo: String(a.tipo ?? ""),
          status: String(a.status ?? ""),
          cliente: String(a.cliente ?? ""),
          custo: a.custo == null ? undefined : Number(a.custo),
          vencimento: String(a.vencimento ?? ""),
        })),
    );

    const { data: proj } = await supabase
      .from("eng_projetos_elaboracao")
      .select("id, cliente, escopo, escopo_generico, status, projetista, prazo_conclusao, dentro_prazo, site")
      .ilike("site", siteName);
    setProjetos(
      (proj ?? []).map((r: any) => ({
        id: String(r.id),
        cliente: r.cliente ?? "",
        escopo: r.escopo || r.escopo_generico || "",
        status: r.status ?? "",
        projetista: r.projetista ?? "",
        prazo: r.prazo_conclusao ?? "",
        dentro_prazo: r.dentro_prazo ?? "",
      })),
    );

    const { data: gov } = await supabase
      .from("eng_governanca_master")
      .select("id, cliente, tipo_atividade, status_bi, status, pct_conclusao_campo, faturamento_total, localizador")
      .ilike("localizador", siteName);
    setGovs(
      (gov ?? []).map((r: any) => ({
        id: String(r.id),
        cliente: r.cliente ?? "",
        servico: r.tipo_atividade ?? "",
        status_bi: r.status_bi ?? "",
        status_atividade: r.status ?? "",
        pct_conclusao_campo: r.pct_conclusao_campo == null ? null : Number(r.pct_conclusao_campo),
        valor_total_atividade: r.faturamento_total == null ? null : Number(r.faturamento_total),
      })),
    );

    const { data: en } = await supabase
      .from("eng_shared_records")
      .select("id, data")
      .eq("kind", "energia_solic");
    setEnergias(
      (en ?? [])
        .map((r: any) => ({ id: String(r.id), data: r.data as Record<string, unknown> }))
        .filter((r) => matches(String(r.data?.site ?? ""), siteName))
        .map((r) => ({
          id: r.id,
          concessionaria: String(r.data?.concessionaria ?? ""),
          status: String(r.data?.status ?? ""),
          protocolo: String(r.data?.protocolo ?? ""),
          data: String(r.data?.dataSolicitacao ?? ""),
        })),
    );

    let cs: SiteCost[] = [];
    if (siteId) {
      const { data } = await supabase
        .from("eng_site_costs").select("*")
        .or(`site_id.eq.${siteId},site_name.ilike.${siteName}`)
        .order("data_lancamento", { ascending: false });
      cs = (data ?? []) as SiteCost[];
    } else {
      const { data } = await supabase
        .from("eng_site_costs").select("*")
        .ilike("site_name", siteName)
        .order("data_lancamento", { ascending: false });
      cs = (data ?? []) as SiteCost[];
    }
    setCosts(cs);
    setLoading(false);
  }, [siteName, siteId]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!siteName) return;
    const ch = supabase
      .channel(`eng-obra-vinculos-${siteName}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "eng_site_costs" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [siteName, refresh]);

  const totalCustos = useMemo(() => costs.reduce((s, c) => s + Number(c.valor || 0), 0), [costs]);
  const custosPorCategoria = useMemo(() => {
    const m: Record<string, number> = {};
    costs.forEach((c) => { m[c.categoria] = (m[c.categoria] ?? 0) + Number(c.valor || 0); });
    return Object.entries(m).map(([categoria, valor]) => ({ categoria, valor })).sort((a, b) => b.valor - a.valor);
  }, [costs]);
  const valorGovTotal = useMemo(
    () => govs.reduce((s, g) => s + Number(g.valor_total_atividade || 0), 0),
    [govs],
  );

  return {
    loading, refresh,
    solicits, arts, projetos, govs, energias,
    costs, totalCustos, custosPorCategoria,
    valorGovTotal,
  };
}
