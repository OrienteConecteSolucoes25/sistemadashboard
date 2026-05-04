// Mock data — módulo Jurídico (alta fidelidade, sem dados reais).

export type JurProcesso = {
  id: string;
  numero: string;
  parte: string;
  vara: string;
  comarca: string;
  tipo: "civel" | "trabalhista" | "tributario" | "administrativo" | "criminal";
  fase: "inicial" | "instrucao" | "recursal" | "execucao";
  status: "ativo" | "suspenso" | "encerrado";
  prioridade: "baixa" | "media" | "alta" | "critica";
  responsavel: string;
  cliente: string;
  valorCausa: number;
  dataDistribuicao: string;
  ultimaMovimentacao: string;
  created_at: string;
};

export type JurPrazo = {
  id: string;
  processo: string;
  descricao: string;
  data: string;
  prioridade: "baixa" | "media" | "alta" | "critica";
  status: "pendente" | "em_andamento" | "cumprido" | "atrasado";
  responsavel: string;
  tipo: "peticao" | "audiencia" | "recurso" | "diligencia";
  created_at: string;
};

export type JurDocumento = {
  id: string;
  titulo: string;
  tipo: "peticao" | "contrato" | "parecer" | "anexo" | "decisao" | "procuracao";
  processo: string;
  data: string;
  autor: string;
  status: "rascunho" | "revisao" | "aprovada" | "arquivada";
  tamanho: string;
  created_at: string;
};

export type JurResponsavel = {
  id: string;
  nome: string;
  oab: string;
  area: string;
  status: "ativo" | "ferias" | "inativo";
  processosAtivos: number;
  prazosVencendo: number;
  email: string;
  created_at: string;
};

export type JurTarefa = {
  id: string;
  titulo: string;
  processo: string;
  responsavel: string;
  prazo: string;
  prioridade: "baixa" | "media" | "alta" | "critica";
  status: "aberta" | "em_andamento" | "concluida" | "cancelada";
  descricao: string;
  created_at: string;
};

export type JurRelatorio = {
  id: string;
  titulo: string;
  tipo: "mensal" | "processual" | "financeiro" | "estrategico";
  data: string;
  autor: string;
  status: "rascunho" | "aprovada" | "arquivada";
  periodo: string;
  created_at: string;
};

export const MOCK_PROCESSOS: JurProcesso[] = [
  { id: "p1", numero: "0001234-56.2026.8.14.0301", parte: "Cliente A vs. Empresa X", vara: "1ª Vara Cível", comarca: "Belém/PA", tipo: "civel", fase: "instrucao", status: "ativo", prioridade: "alta", responsavel: "Dr. Fulano", cliente: "OCS Telecom", valorCausa: 250000, dataDistribuicao: "2026-01-15", ultimaMovimentacao: "2026-04-28", created_at: "2026-01-15T10:00:00Z" },
  { id: "p2", numero: "0009876-54.2026.5.08.0001", parte: "Colaborador Y", vara: "2ª Vara do Trabalho", comarca: "Belém/PA", tipo: "trabalhista", fase: "inicial", status: "ativo", prioridade: "critica", responsavel: "Dra. Sicrana", cliente: "OCS Engenharia", valorCausa: 80000, dataDistribuicao: "2026-02-10", ultimaMovimentacao: "2026-05-01", created_at: "2026-02-10T10:00:00Z" },
  { id: "p3", numero: "0005555-11.2025.4.01.3900", parte: "União vs. OCS", vara: "Vara Federal", comarca: "Belém/PA", tipo: "tributario", fase: "recursal", status: "suspenso", prioridade: "media", responsavel: "Dr. Beltrano", cliente: "OCS Telecom", valorCausa: 1500000, dataDistribuicao: "2025-08-20", ultimaMovimentacao: "2026-04-15", created_at: "2025-08-20T10:00:00Z" },
  { id: "p4", numero: "0007777-22.2026.8.14.0301", parte: "Fornecedor Z vs. OCS", vara: "3ª Vara Cível", comarca: "Belém/PA", tipo: "civel", fase: "execucao", status: "ativo", prioridade: "media", responsavel: "Dr. Fulano", cliente: "OCS Suprimentos", valorCausa: 120000, dataDistribuicao: "2025-11-05", ultimaMovimentacao: "2026-04-30", created_at: "2025-11-05T10:00:00Z" },
  { id: "p5", numero: "0003333-44.2026.5.08.0002", parte: "Colaborador W", vara: "4ª Vara do Trabalho", comarca: "Ananindeua/PA", tipo: "trabalhista", fase: "instrucao", status: "ativo", prioridade: "alta", responsavel: "Dra. Sicrana", cliente: "OCS Engenharia", valorCausa: 65000, dataDistribuicao: "2026-03-12", ultimaMovimentacao: "2026-05-02", created_at: "2026-03-12T10:00:00Z" },
  { id: "p6", numero: "0002222-33.2025.8.14.0301", parte: "Cliente B vs. OCS", vara: "5ª Vara Cível", comarca: "Belém/PA", tipo: "civel", fase: "recursal", status: "encerrado", prioridade: "baixa", responsavel: "Dr. Beltrano", cliente: "OCS Telecom", valorCausa: 35000, dataDistribuicao: "2024-06-01", ultimaMovimentacao: "2026-03-20", created_at: "2024-06-01T10:00:00Z" },
  { id: "p7", numero: "0008888-99.2026.4.01.3900", parte: "OCS vs. Município", vara: "Vara Federal", comarca: "Belém/PA", tipo: "administrativo", fase: "inicial", status: "ativo", prioridade: "alta", responsavel: "Dr. Fulano", cliente: "OCS Engenharia", valorCausa: 450000, dataDistribuicao: "2026-04-01", ultimaMovimentacao: "2026-05-03", created_at: "2026-04-01T10:00:00Z" },
];

export const MOCK_PRAZOS: JurPrazo[] = [
  { id: "pr1", processo: "0001234-56.2026.8.14.0301", descricao: "Contestação", data: "2026-05-10", prioridade: "alta", status: "pendente", responsavel: "Dr. Fulano", tipo: "peticao", created_at: "2026-04-25T10:00:00Z" },
  { id: "pr2", processo: "0009876-54.2026.5.08.0001", descricao: "Audiência de conciliação", data: "2026-05-15", prioridade: "critica", status: "em_andamento", responsavel: "Dra. Sicrana", tipo: "audiencia", created_at: "2026-04-20T10:00:00Z" },
  { id: "pr3", processo: "0005555-11.2025.4.01.3900", descricao: "Recurso especial", data: "2026-05-20", prioridade: "alta", status: "pendente", responsavel: "Dr. Beltrano", tipo: "recurso", created_at: "2026-04-15T10:00:00Z" },
  { id: "pr4", processo: "0007777-22.2026.8.14.0301", descricao: "Embargos à execução", data: "2026-05-08", prioridade: "critica", status: "pendente", responsavel: "Dr. Fulano", tipo: "peticao", created_at: "2026-04-22T10:00:00Z" },
  { id: "pr5", processo: "0003333-44.2026.5.08.0002", descricao: "Réplica", data: "2026-05-12", prioridade: "media", status: "em_andamento", responsavel: "Dra. Sicrana", tipo: "peticao", created_at: "2026-04-28T10:00:00Z" },
  { id: "pr6", processo: "0008888-99.2026.4.01.3900", descricao: "Diligência cartório", data: "2026-04-30", prioridade: "alta", status: "atrasado", responsavel: "Dr. Fulano", tipo: "diligencia", created_at: "2026-04-20T10:00:00Z" },
  { id: "pr7", processo: "0002222-33.2025.8.14.0301", descricao: "Manifestação final", data: "2026-04-15", prioridade: "baixa", status: "cumprido", responsavel: "Dr. Beltrano", tipo: "peticao", created_at: "2026-04-01T10:00:00Z" },
];

export const MOCK_DOCUMENTOS: JurDocumento[] = [
  { id: "d1", titulo: "Petição inicial — Cliente A", tipo: "peticao", processo: "0001234-56.2026.8.14.0301", data: "2026-04-20", autor: "Dr. Fulano", status: "aprovada", tamanho: "2.4 MB", created_at: "2026-04-20T10:00:00Z" },
  { id: "d2", titulo: "Parecer técnico tributário", tipo: "parecer", processo: "0005555-11.2025.4.01.3900", data: "2026-04-15", autor: "Dr. Beltrano", status: "aprovada", tamanho: "1.1 MB", created_at: "2026-04-15T10:00:00Z" },
  { id: "d3", titulo: "Contrato de prestação de serviços", tipo: "contrato", processo: "0007777-22.2026.8.14.0301", data: "2026-04-10", autor: "Dra. Sicrana", status: "revisao", tamanho: "850 KB", created_at: "2026-04-10T10:00:00Z" },
  { id: "d4", titulo: "Procuração — OCS Telecom", tipo: "procuracao", processo: "0001234-56.2026.8.14.0301", data: "2026-04-05", autor: "Dr. Fulano", status: "aprovada", tamanho: "320 KB", created_at: "2026-04-05T10:00:00Z" },
  { id: "d5", titulo: "Decisão interlocutória", tipo: "decisao", processo: "0009876-54.2026.5.08.0001", data: "2026-05-01", autor: "Sistema", status: "arquivada", tamanho: "180 KB", created_at: "2026-05-01T10:00:00Z" },
  { id: "d6", titulo: "Defesa trabalhista", tipo: "peticao", processo: "0003333-44.2026.5.08.0002", data: "2026-04-28", autor: "Dra. Sicrana", status: "rascunho", tamanho: "1.7 MB", created_at: "2026-04-28T10:00:00Z" },
];

export const MOCK_RESPONSAVEIS: JurResponsavel[] = [
  { id: "r1", nome: "Dr. Fulano", oab: "OAB/PA 12345", area: "Cível", status: "ativo", processosAtivos: 8, prazosVencendo: 3, email: "fulano@ocs.com.br", created_at: "2024-01-15T10:00:00Z" },
  { id: "r2", nome: "Dra. Sicrana", oab: "OAB/PA 67890", area: "Trabalhista", status: "ativo", processosAtivos: 5, prazosVencendo: 2, email: "sicrana@ocs.com.br", created_at: "2024-03-20T10:00:00Z" },
  { id: "r3", nome: "Dr. Beltrano", oab: "OAB/PA 24680", area: "Tributário", status: "ativo", processosAtivos: 4, prazosVencendo: 1, email: "beltrano@ocs.com.br", created_at: "2024-05-10T10:00:00Z" },
  { id: "r4", nome: "Dra. Helena", oab: "OAB/PA 13579", area: "Administrativo", status: "ferias", processosAtivos: 2, prazosVencendo: 0, email: "helena@ocs.com.br", created_at: "2025-01-08T10:00:00Z" },
];

export const MOCK_TAREFAS: JurTarefa[] = [
  { id: "t1", titulo: "Protocolar contestação", processo: "0001234-56.2026.8.14.0301", responsavel: "Dr. Fulano", prazo: "2026-05-10", prioridade: "alta", status: "em_andamento", descricao: "Revisar e protocolar contestação no TJ.", created_at: "2026-04-25T10:00:00Z" },
  { id: "t2", titulo: "Reunir documentos do colaborador", processo: "0009876-54.2026.5.08.0001", responsavel: "Dra. Sicrana", prazo: "2026-05-08", prioridade: "critica", status: "aberta", descricao: "Solicitar holerites e contratos do RH.", created_at: "2026-04-26T10:00:00Z" },
  { id: "t3", titulo: "Análise de viabilidade recurso", processo: "0005555-11.2025.4.01.3900", responsavel: "Dr. Beltrano", prazo: "2026-05-18", prioridade: "media", status: "aberta", descricao: "Avaliar chances de êxito antes do recurso.", created_at: "2026-04-15T10:00:00Z" },
  { id: "t4", titulo: "Reunião com cliente", processo: "0008888-99.2026.4.01.3900", responsavel: "Dr. Fulano", prazo: "2026-05-06", prioridade: "alta", status: "em_andamento", descricao: "Alinhar estratégia processual.", created_at: "2026-04-29T10:00:00Z" },
  { id: "t5", titulo: "Arquivamento do processo", processo: "0002222-33.2025.8.14.0301", responsavel: "Dr. Beltrano", prazo: "2026-04-20", prioridade: "baixa", status: "concluida", descricao: "Processo encerrado, arquivar.", created_at: "2026-04-10T10:00:00Z" },
  { id: "t6", titulo: "Diligência cartório", processo: "0007777-22.2026.8.14.0301", responsavel: "Dr. Fulano", prazo: "2026-05-09", prioridade: "alta", status: "aberta", descricao: "Obter cópia autenticada da matrícula.", created_at: "2026-04-30T10:00:00Z" },
];

export const MOCK_RELATORIOS: JurRelatorio[] = [
  { id: "rl1", titulo: "Relatório mensal de processos — Abril/2026", tipo: "mensal", data: "2026-04-30", autor: "Dr. Fulano", status: "aprovada", periodo: "Abril/2026", created_at: "2026-04-30T10:00:00Z" },
  { id: "rl2", titulo: "Resumo processual — Cível", tipo: "processual", data: "2026-04-25", autor: "Dr. Beltrano", status: "aprovada", periodo: "Q1/2026", created_at: "2026-04-25T10:00:00Z" },
  { id: "rl3", titulo: "Relatório financeiro — provisões", tipo: "financeiro", data: "2026-04-20", autor: "Dra. Sicrana", status: "rascunho", periodo: "Abril/2026", created_at: "2026-04-20T10:00:00Z" },
  { id: "rl4", titulo: "Plano estratégico jurídico 2026", tipo: "estrategico", data: "2026-03-15", autor: "Dr. Fulano", status: "arquivada", periodo: "Anual/2026", created_at: "2026-03-15T10:00:00Z" },
];

export const MOCK_DASHBOARD = {
  processosAtivos: MOCK_PROCESSOS.filter((p) => p.status === "ativo").length,
  prazosCriticos: MOCK_PRAZOS.filter((p) => p.prioridade === "critica" && p.status !== "cumprido").length,
  tarefasAbertas: MOCK_TAREFAS.filter((t) => t.status !== "concluida" && t.status !== "cancelada").length,
  responsaveis: MOCK_RESPONSAVEIS.length,
};
