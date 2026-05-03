// Mock data — etapa 1 do módulo Jurídico. NENHUM dado real.

export type JurProcesso = {
  id: string;
  numero: string;
  parte: string;
  vara: string;
  tipo: "civel" | "trabalhista" | "tributario" | "administrativo";
  status: "ativo" | "suspenso" | "encerrado";
  responsavel: string;
};

export type JurPrazo = {
  id: string;
  processo: string;
  descricao: string;
  data: string;
  prioridade: "baixa" | "media" | "alta" | "critica";
  status: "pendente" | "cumprido" | "atrasado";
};

export type JurDocumento = {
  id: string;
  titulo: string;
  tipo: "peticao" | "contrato" | "parecer" | "anexo";
  processo: string;
  data: string;
  autor: string;
};

export type JurResponsavel = {
  id: string;
  nome: string;
  oab: string;
  area: string;
  processosAtivos: number;
};

export type JurTarefa = {
  id: string;
  titulo: string;
  processo: string;
  responsavel: string;
  prazo: string;
  status: "aberta" | "em_andamento" | "concluida";
};

export type JurRelatorio = {
  id: string;
  titulo: string;
  tipo: "mensal" | "processual" | "financeiro";
  data: string;
  autor: string;
};

export const MOCK_PROCESSOS: JurProcesso[] = [
  { id: "p1", numero: "0001234-56.2026.8.14.0301", parte: "Cliente A vs. Empresa X", vara: "1ª Vara Cível", tipo: "civel", status: "ativo", responsavel: "—" },
  { id: "p2", numero: "0009876-54.2026.5.08.0001", parte: "Colaborador Y", vara: "2ª Vara do Trabalho", tipo: "trabalhista", status: "ativo", responsavel: "—" },
  { id: "p3", numero: "0005555-11.2025.4.01.3900", parte: "União vs. OCS", vara: "Vara Federal", tipo: "tributario", status: "suspenso", responsavel: "—" },
];

export const MOCK_PRAZOS: JurPrazo[] = [
  { id: "pr1", processo: "0001234-56.2026.8.14.0301", descricao: "Contestação", data: "2026-05-10", prioridade: "alta", status: "pendente" },
  { id: "pr2", processo: "0009876-54.2026.5.08.0001", descricao: "Audiência de conciliação", data: "2026-05-15", prioridade: "critica", status: "pendente" },
];

export const MOCK_DOCUMENTOS: JurDocumento[] = [
  { id: "d1", titulo: "Petição inicial", tipo: "peticao", processo: "0001234-56.2026.8.14.0301", data: "2026-04-20", autor: "—" },
  { id: "d2", titulo: "Parecer técnico", tipo: "parecer", processo: "0005555-11.2025.4.01.3900", data: "2026-04-15", autor: "—" },
];

export const MOCK_RESPONSAVEIS: JurResponsavel[] = [
  { id: "r1", nome: "Dr. Fulano", oab: "OAB/PA 12345", area: "Cível", processosAtivos: 8 },
  { id: "r2", nome: "Dra. Sicrana", oab: "OAB/PA 67890", area: "Trabalhista", processosAtivos: 5 },
];

export const MOCK_TAREFAS: JurTarefa[] = [
  { id: "t1", titulo: "Protocolar contestação", processo: "0001234-56.2026.8.14.0301", responsavel: "Dr. Fulano", prazo: "2026-05-10", status: "em_andamento" },
  { id: "t2", titulo: "Reunir documentos do colaborador", processo: "0009876-54.2026.5.08.0001", responsavel: "Dra. Sicrana", prazo: "2026-05-08", status: "aberta" },
];

export const MOCK_RELATORIOS: JurRelatorio[] = [
  { id: "rl1", titulo: "Relatório mensal de processos", tipo: "mensal", data: "2026-04-30", autor: "—" },
  { id: "rl2", titulo: "Resumo processual — Cível", tipo: "processual", data: "2026-04-25", autor: "—" },
];

export const MOCK_DASHBOARD = {
  processosAtivos: MOCK_PROCESSOS.filter((p) => p.status === "ativo").length,
  prazosCriticos: MOCK_PRAZOS.filter((p) => p.prioridade === "critica" && p.status !== "cumprido").length,
  tarefasAbertas: MOCK_TAREFAS.filter((t) => t.status !== "concluida").length,
  responsaveis: MOCK_RESPONSAVEIS.length,
};
