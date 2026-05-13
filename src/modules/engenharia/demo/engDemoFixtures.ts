// Fixtures ricas para apresentações comerciais — só usadas com Demo Mode ON.
// Nunca devem ser visíveis para clientes finais (controle no toggle).

export const DEMO_COUNTS = {
  sites: 42,
  rfiAbertos: 7,
  pendCriticas: 3,
  equipes: 9,
  projetos: 28,
  atividadesAndamento: 16,
  suprimentosAbertos: 12,
  fibraEmExec: 5,
  energiaSolicitada: 4,
};

export const DEMO_RFI_RECENTES = [
  { id: "demo-r1", numero: "RFI-2026-014", assunto: "Detalhamento de fundação torre 12", status: "aberta", prazo: "2026-05-22" },
  { id: "demo-r2", numero: "RFI-2026-013", assunto: "Especificação cabo CAT6A site centro", status: "em_analise", prazo: "2026-05-18" },
  { id: "demo-r3", numero: "RFI-2026-012", assunto: "Layout sala técnica Marajó", status: "aberta", prazo: "2026-05-25" },
  { id: "demo-r4", numero: "RFI-2026-011", assunto: "Aterramento equipamento ativo", status: "respondida", prazo: "2026-05-10" },
  { id: "demo-r5", numero: "RFI-2026-010", assunto: "Trecho fibra Ananindeua", status: "fechada", prazo: "2026-05-05" },
];

export const DEMO_PEND_RECENTES = [
  { id: "demo-p1", titulo: "Liberar acesso à torre Belém", prioridade: "critica", status: "em_andamento", prazo: "2026-05-15" },
  { id: "demo-p2", titulo: "Aguardando emissão de ART", prioridade: "alta", status: "aberta", prazo: "2026-05-12" },
  { id: "demo-p3", titulo: "Material em falta — conector óptico", prioridade: "alta", status: "aberta", prazo: "2026-05-20" },
  { id: "demo-p4", titulo: "Retrabalho aterramento", prioridade: "media", status: "em_andamento", prazo: "2026-05-18" },
  { id: "demo-p5", titulo: "Pendência inspeção final", prioridade: "media", status: "aberta", prazo: "2026-05-28" },
];

export const DEMO_ATIVIDADES_BY_STATUS = [
  { name: "concluida", value: 38 },
  { name: "em andamento", value: 16 },
  { name: "aberta", value: 9 },
  { name: "bloqueada", value: 4 },
];

export const DEMO_PEND_BY_MONTH = [
  { label: "dez", abertas: 12, concluidas: 9 },
  { label: "jan", abertas: 18, concluidas: 14 },
  { label: "fev", abertas: 22, concluidas: 17 },
  { label: "mar", abertas: 15, concluidas: 21 },
  { label: "abr", abertas: 11, concluidas: 24 },
  { label: "mai", abertas: 6, concluidas: 8 },
];

export const DEMO_SITES_BY_UF = [
  { name: "PA", total: 18 },
  { name: "AM", total: 9 },
  { name: "MA", total: 6 },
  { name: "AP", total: 4 },
  { name: "RR", total: 3 },
  { name: "TO", total: 2 },
];

export const DEMO_PROJETOS = Array.from({ length: 24 }).map((_, i) => ({
  id: `demo-proj-${i + 1}`,
  cliente: ["Telecom Norte", "Energia PA", "Prefeitura Belém", "Construtora Marajó"][i % 4],
  site: `STE-${String(100 + i).padStart(3, "0")}`,
  cidade: ["Belém", "Ananindeua", "Marituba", "Soure", "Castanhal"][i % 5],
  uf: ["PA", "AM", "MA", "AP"][i % 4],
  responsavel_solicitante: "—",
  projetista: ["Ana Lima", "Carlos Souza", "Bruno Reis"][i % 3],
  local_elaboracao: "Escritório OCS",
  escopo_generico: "Infra ativa",
  escopo: i % 2 === 0 ? "Lançamento fibra + ativos" : "Manutenção preventiva",
  descricao: "Projeto demo para apresentação comercial.",
  status: ["em_andamento", "concluido", "aberto", "atrasado"][i % 4],
  data_solicitacao: "2026-04-10",
  prazo_conclusao: "2026-06-30",
  prioridade: ["alta", "media", "baixa"][i % 3],
  tempo_previsto: "30d",
  data_inicio_real: "2026-04-15",
  data_termino_real: i % 4 === 1 ? "2026-05-20" : "",
  tempo_real: i % 4 === 1 ? "35d" : "",
  dentro_prazo: i % 4 === 3 ? "nao" : "sim",
  tempo_resposta_previsto: 30,
  tempo_resposta_real: 28 + (i % 7),
  diferenca_tempo: -2 + (i % 5),
  peso: (i % 3) + 1,
  conta: "2026-OPS",
  delta_horas: (i % 9) - 4,
  observacao: "—",
  link_pasta: "",
}));
