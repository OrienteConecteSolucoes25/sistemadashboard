// Tipos e utilitários compartilhados de Governança (atividades / plano de ação).
export interface GovActionRow {
  id?: string;
  semana?: string;
  mes?: number;
  ano?: number;
  area?: string;
  cliente?: string;
  ofensor?: string;
  causa_raiz?: string;
  acao: string;
  resultado_esperado?: string;
  responsavel?: string;
  status?: string;
  prazo?: string | null;
  prioridade?: string;
  evidencia?: string;
  observacoes?: string;
}

export const GOV_STATUS = ["aberta", "em_andamento", "concluida", "cancelada", "atrasada"] as const;
export const GOV_PRIORIDADE = ["baixa", "media", "alta", "critica"] as const;
