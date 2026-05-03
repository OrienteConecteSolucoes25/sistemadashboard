// Mock data — etapa 1 do módulo Engenharia. NENHUM dado real.
// Substituir por hooks reais quando as tabelas eng_* forem criadas.

export type EngSite = {
  id: string;
  codigo: string;
  nome: string;
  cidade: string;
  uf: string;
  status: "ativo" | "pausado" | "concluido";
  responsavel: string;
};

export type EngRFI = {
  id: string;
  numero: string;
  site: string;
  assunto: string;
  status: "aberta" | "em_analise" | "respondida" | "fechada";
  prazo: string;
};

export type EngPendencia = {
  id: string;
  titulo: string;
  site: string;
  prioridade: "baixa" | "media" | "alta" | "critica";
  responsavel: string;
  prazo: string;
  status: "aberta" | "em_andamento" | "concluida";
};

export type EngMaterial = {
  id: string;
  descricao: string;
  unidade: string;
  estoque: number;
  reservado: number;
  site: string;
};

export type EngEquipe = {
  id: string;
  nome: string;
  lider: string;
  membros: number;
  site: string;
  status: "disponivel" | "alocada";
};

export type EngRelatorio = {
  id: string;
  titulo: string;
  tipo: "diario" | "semanal" | "tecnico";
  site: string;
  data: string;
  autor: string;
};

export const MOCK_SITES: EngSite[] = [
  { id: "s1", codigo: "STE-001", nome: "Site Centro", cidade: "Belém", uf: "PA", status: "ativo", responsavel: "—" },
  { id: "s2", codigo: "STE-002", nome: "Site Marajó", cidade: "Soure", uf: "PA", status: "pausado", responsavel: "—" },
  { id: "s3", codigo: "STE-003", nome: "Site Ananindeua", cidade: "Ananindeua", uf: "PA", status: "ativo", responsavel: "—" },
];

export const MOCK_RFIS: EngRFI[] = [
  { id: "r1", numero: "RFI-2026-001", site: "STE-001", assunto: "Detalhamento de fundação", status: "aberta", prazo: "2026-05-10" },
  { id: "r2", numero: "RFI-2026-002", site: "STE-003", assunto: "Especificação de cabo", status: "em_analise", prazo: "2026-05-12" },
];

export const MOCK_PENDENCIAS: EngPendencia[] = [
  { id: "p1", titulo: "Liberar acesso à torre", site: "STE-001", prioridade: "alta", responsavel: "—", prazo: "2026-05-08", status: "aberta" },
  { id: "p2", titulo: "Aguardando ART", site: "STE-002", prioridade: "critica", responsavel: "—", prazo: "2026-05-05", status: "em_andamento" },
];

export const MOCK_MATERIAIS: EngMaterial[] = [
  { id: "m1", descricao: "Cabo UTP CAT6 (300m)", unidade: "rolo", estoque: 12, reservado: 4, site: "STE-001" },
  { id: "m2", descricao: "Conector RJ-45", unidade: "un", estoque: 800, reservado: 200, site: "STE-001" },
  { id: "m3", descricao: "Eletroduto PVC 25mm", unidade: "barra", estoque: 50, reservado: 10, site: "STE-003" },
];

export const MOCK_EQUIPES: EngEquipe[] = [
  { id: "e1", nome: "Equipe Alpha", lider: "—", membros: 4, site: "STE-001", status: "alocada" },
  { id: "e2", nome: "Equipe Bravo", lider: "—", membros: 3, site: "STE-003", status: "disponivel" },
];

export const MOCK_RELATORIOS: EngRelatorio[] = [
  { id: "rl1", titulo: "Diário de obra 02/05", tipo: "diario", site: "STE-001", data: "2026-05-02", autor: "—" },
  { id: "rl2", titulo: "Relatório técnico de inspeção", tipo: "tecnico", site: "STE-003", data: "2026-04-30", autor: "—" },
];

export const MOCK_DASHBOARD = {
  sitesAtivos: MOCK_SITES.filter((s) => s.status === "ativo").length,
  rfisAbertas: MOCK_RFIS.filter((r) => r.status !== "fechada" && r.status !== "respondida").length,
  pendenciasCriticas: MOCK_PENDENCIAS.filter((p) => p.prioridade === "critica" && p.status !== "concluida").length,
  equipesAlocadas: MOCK_EQUIPES.filter((e) => e.status === "alocada").length,
};
