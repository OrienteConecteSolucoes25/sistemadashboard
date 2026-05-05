import { supabase } from "@/integrations/supabase/client";
import { notify } from "./internalNotifications";
import { fireAudit } from "../audit";

type Action =
  | { type: "notify"; tipo?: "status" | "tarefa" | "prazo"; titulo: (r: any) => string; detalhe?: (r: any) => string; route?: string }
  | { type: "createFollowupTask"; titulo: (r: any) => string; responsavel?: (r: any) => string | undefined };

interface Flow {
  modulo: string;
  routePrefix: string;
  /** quando o novo status entrar em finalStatuses → executa actions */
  finalStatuses?: string[];
  /** quando o novo status entrar em criticStatuses → executa actions */
  criticStatuses?: string[];
  onFinal?: Action[];
  onCritic?: Action[];
}

const FLOWS: Record<string, Flow> = {
  eng_atividades: {
    modulo: "Atividades",
    routePrefix: "/app/engenharia/atividades",
    finalStatuses: ["concluida", "concluído", "concluido", "fechada"],
    onFinal: [
      { type: "notify", tipo: "status",
        titulo: (r) => `✅ Atividade concluída: ${r.titulo ?? r.descricao ?? r.id}`,
        detalhe: (r) => `Responsável: ${r.responsavel ?? "—"}`,
        route: "/app/engenharia/atividades" },
    ],
  },
  eng_demandas: {
    modulo: "Demandas",
    routePrefix: "/app/engenharia/demandas",
    finalStatuses: ["concluida", "concluído", "concluido", "fechada", "cancelada"],
    onFinal: [
      { type: "notify", tipo: "status",
        titulo: (r) => `📌 Demanda finalizada: ${r.titulo ?? r.id}`,
        route: "/app/engenharia/demandas" },
    ],
  },
  eng_rfi: {
    modulo: "RFI",
    routePrefix: "/app/engenharia/rfi",
    finalStatuses: ["respondida", "fechada"],
    onFinal: [
      { type: "notify", tipo: "status",
        titulo: (r) => `📨 RFI ${r.numero ?? ""} ${r.status}`,
        detalhe: (r) => r.assunto ?? "",
        route: "/app/engenharia/rfi" },
      { type: "createFollowupTask",
        titulo: (r) => `Validar resposta RFI ${r.numero ?? r.id}`,
        responsavel: (r) => r.responsavel },
    ],
  },
  eng_pendencias: {
    modulo: "Pendências",
    routePrefix: "/app/engenharia/pendencias",
    finalStatuses: ["concluida", "concluído", "concluido"],
    onFinal: [
      { type: "notify", tipo: "status",
        titulo: (r) => `🟢 Pendência resolvida: ${r.titulo ?? r.id}`,
        route: "/app/engenharia/pendencias" },
    ],
  },
  eng_ligacoes_energia: {
    modulo: "Ligações de Energia",
    routePrefix: "/app/engenharia/energia",
    finalStatuses: ["ligada", "rejeitada"],
    criticStatuses: ["em_analise"],
    onFinal: [
      { type: "notify", tipo: "status",
        titulo: (r) => `⚡ Energia ${r.protocolo ?? ""} → ${r.status}`,
        detalhe: (r) => r.concessionaria ?? "",
        route: "/app/engenharia/energia" },
    ],
    onCritic: [
      { type: "createFollowupTask",
        titulo: (r) => `Acompanhar análise ${r.protocolo ?? r.id} na concessionária` },
    ],
  },
  eng_art: {
    modulo: "ART",
    routePrefix: "/app/engenharia/art",
    finalStatuses: ["paga", "cancelada"],
    onFinal: [
      { type: "notify", tipo: "status",
        titulo: (r) => `📄 ART ${r.numero ?? r.id} → ${r.status}`,
        route: "/app/engenharia/art" },
    ],
  },
  eng_suprimentos: {
    modulo: "Suprimentos",
    routePrefix: "/app/engenharia/suprimentos",
    finalStatuses: ["entregue", "concluida", "cancelada"],
    onFinal: [
      { type: "notify", tipo: "status",
        titulo: (r) => `📦 Solicitação ${r.numero ?? r.id} → ${r.status}`,
        route: "/app/engenharia/suprimentos" },
    ],
  },
  eng_projetos_elaboracao: {
    modulo: "Projetos",
    routePrefix: "/app/engenharia/projetos",
    finalStatuses: ["CONCLUÍDA", "CONCLUIDA", "ENTREGUE"],
    onFinal: [
      { type: "notify", tipo: "status",
        titulo: (r) => `🎯 Projeto concluído: ${r.site ?? r.cliente ?? r.id}`,
        route: "/app/engenharia/projetos" },
    ],
  },
};

const norm = (s: any) => String(s ?? "").toLowerCase().trim();

async function executeAction(act: Action, record: any, table: string, flow: Flow) {
  if (act.type === "notify") {
    await notify({
      origem: table,
      origem_id: String(record.id ?? ""),
      modulo: flow.modulo,
      tipo: act.tipo ?? "status",
      titulo: act.titulo(record),
      detalhe: act.detalhe?.(record),
      route: act.route ?? flow.routePrefix,
    });
  } else if (act.type === "createFollowupTask") {
    try {
      await (supabase.from("eng_atividades").insert({
        titulo: act.titulo(record),
        descricao: `Gerada automaticamente a partir de ${flow.modulo} (${record.id})`,
        status: "aberta",
        responsavel: act.responsavel?.(record) ?? record.responsavel ?? null,
        data: { _auto: true, origem: table, origem_id: record.id } as any,
      } as any) as any);
      fireAudit({
        acao: "automation:create_followup",
        modulo: flow.modulo,
        entidade_tipo: table,
        entidade_id: record.id,
        nome_entidade: act.titulo(record),
      });
    } catch (e) {
      console.warn("createFollowupTask falhou", e);
    }
  }
}

/**
 * Executa flows ao detectar mudança de status.
 * @param table nome da tabela `eng_*`
 * @param prev registro anterior (ou null se insert)
 * @param next registro novo
 */
export async function runStatusFlows(table: string, prev: any | null, next: any): Promise<void> {
  const flow = FLOWS[table];
  if (!flow) return;
  // Evita loop em registros marcados _auto
  if (next?.data?._auto || next?._auto) return;

  const prevStatus = norm(prev?.status);
  const nextStatus = norm(next?.status);
  if (prevStatus === nextStatus) return;

  const finals = (flow.finalStatuses ?? []).map(norm);
  const critics = (flow.criticStatuses ?? []).map(norm);

  if (finals.includes(nextStatus) && flow.onFinal) {
    for (const act of flow.onFinal) await executeAction(act, next, table, flow);
  }
  if (critics.includes(nextStatus) && flow.onCritic) {
    for (const act of flow.onCritic) await executeAction(act, next, table, flow);
  }
}

export const STATUS_FLOWS_TABLES = Object.keys(FLOWS);
