export type GovFilters = {
  empresa_id?: string;
  rt_id?: string;
  uf?: string;
  ano?: number;
  mes?: number;
  contratante_id?: string;
  setor_id?: string;
  tag_ids?: string[];
  escopo_id?: string;
  status_analise?: string;
  status_financeiro?: string;
  tipo?: string;
  natureza?: string;
  cidade?: string;
  uf_obra?: string;
  numero?: string;
  boleto?: string;
  cadastro_de?: string;
  cadastro_ate?: string;
  pagamento_de?: string;
  pagamento_ate?: string;
  vencimento_de?: string;
  vencimento_ate?: string;
  valor_min?: number;
  valor_max?: number;
  centro_custo?: string;
};

export const GOV_STATUS_ANALISE = [
  "Aguardando Pagamento", "Registrada", "Cancelada",
  "Documento Invalidado/ART com Observação", "Em Análise", "Indeferida",
];

export const GOV_STATUS_FINANCEIRO = [
  "Pago", "Não Paga", "Parcial", "Vencido", "Divergente",
];

export const UFS_BR = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];
