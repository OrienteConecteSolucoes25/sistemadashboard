import JurDeluxePage from "./JurDeluxePage";
import {
  Scale, Clock, FileText, Users, ListChecks, BarChart3,
  AlertTriangle, CheckCircle2, PauseCircle, TrendingUp, Briefcase, FileCheck,
} from "lucide-react";
import {
  MOCK_PROCESSOS, MOCK_PRAZOS, MOCK_DOCUMENTOS,
  MOCK_RESPONSAVEIS, MOCK_TAREFAS, MOCK_RELATORIOS,
} from "../mock/jurMockData";

/* ============== PROCESSOS ============== */
export const JurProcessosPage = () => {
  const valorTotal = MOCK_PROCESSOS.reduce((s, p) => s + p.valorCausa, 0);
  return (
    <JurDeluxePage
      title="Processos"
      description="Processos judiciais e administrativos."
      titleKey="parte"
      kpis={[
        { label: "Total", value: MOCK_PROCESSOS.length, icon: Scale, tone: "teal" },
        { label: "Ativos", value: MOCK_PROCESSOS.filter(p => p.status === "ativo").length, icon: CheckCircle2, tone: "success" },
        { label: "Suspensos", value: MOCK_PROCESSOS.filter(p => p.status === "suspenso").length, icon: PauseCircle, tone: "warn" },
        { label: "Críticos", value: MOCK_PROCESSOS.filter(p => p.prioridade === "critica").length, icon: AlertTriangle, tone: "danger" },
        { label: "Valor total", value: (valorTotal / 1000).toFixed(0) + "k", icon: TrendingUp, tone: "neutral", hint: "R$ em causas" },
      ]}
      columns={[
        { key: "numero", label: "Número", mono: true },
        { key: "parte", label: "Parte" },
        { key: "vara", label: "Vara" },
        { key: "tipo", label: "Tipo", badge: true },
        { key: "fase", label: "Fase" },
        { key: "status", label: "Status" },
        { key: "prioridade", label: "Prioridade" },
        { key: "responsavel", label: "Responsável" },
        { key: "valorCausa", label: "Valor causa" },
        { key: "ultimaMovimentacao", label: "Última mov." },
      ]}
      rows={MOCK_PROCESSOS}
      kanbanGroupKey="fase"
      kanbanColumns={["inicial", "instrucao", "recursal", "execucao"]}
      charts={[
        { title: "Por tipo", groupKey: "tipo" },
        { title: "Por status", groupKey: "status" },
      ]}
      ranking={{ title: "Top responsáveis", groupKey: "responsavel" }}
    />
  );
};

/* ============== PRAZOS ============== */
export const JurPrazosPage = () => (
  <JurDeluxePage
    title="Prazos"
    description="Prazos processuais e administrativos."
    titleKey="descricao"
    kpis={[
      { label: "Total", value: MOCK_PRAZOS.length, icon: Clock, tone: "teal" },
      { label: "Críticos", value: MOCK_PRAZOS.filter(p => p.prioridade === "critica").length, icon: AlertTriangle, tone: "danger" },
      { label: "Pendentes", value: MOCK_PRAZOS.filter(p => p.status === "pendente").length, icon: PauseCircle, tone: "warn" },
      { label: "Atrasados", value: MOCK_PRAZOS.filter(p => p.status === "atrasado").length, icon: AlertTriangle, tone: "danger" },
      { label: "Cumpridos", value: MOCK_PRAZOS.filter(p => p.status === "cumprido").length, icon: CheckCircle2, tone: "success" },
    ]}
    columns={[
      { key: "processo", label: "Processo", mono: true },
      { key: "descricao", label: "Descrição" },
      { key: "tipo", label: "Tipo", badge: true },
      { key: "data", label: "Data" },
      { key: "prioridade", label: "Prioridade" },
      { key: "status", label: "Status" },
      { key: "responsavel", label: "Responsável" },
    ]}
    rows={MOCK_PRAZOS}
    kanbanGroupKey="status"
    kanbanColumns={["pendente", "em_andamento", "atrasado", "cumprido"]}
    charts={[
      { title: "Por tipo", groupKey: "tipo" },
      { title: "Por prioridade", groupKey: "prioridade" },
    ]}
    ranking={{ title: "Prazos por responsável", groupKey: "responsavel" }}
  />
);

/* ============== DOCUMENTOS ============== */
export const JurDocumentosPage = () => (
  <JurDeluxePage
    title="Documentos"
    description="Petições, pareceres, contratos, decisões e anexos."
    titleKey="titulo"
    kpis={[
      { label: "Total", value: MOCK_DOCUMENTOS.length, icon: FileText, tone: "teal" },
      { label: "Petições", value: MOCK_DOCUMENTOS.filter(d => d.tipo === "peticao").length, icon: FileText, tone: "neutral" },
      { label: "Pareceres", value: MOCK_DOCUMENTOS.filter(d => d.tipo === "parecer").length, icon: FileCheck, tone: "warn" },
      { label: "Contratos", value: MOCK_DOCUMENTOS.filter(d => d.tipo === "contrato").length, icon: FileText, tone: "success" },
      { label: "Em revisão", value: MOCK_DOCUMENTOS.filter(d => d.status === "revisao").length, icon: PauseCircle, tone: "warn" },
    ]}
    columns={[
      { key: "titulo", label: "Título" },
      { key: "tipo", label: "Tipo", badge: true },
      { key: "processo", label: "Processo", mono: true },
      { key: "data", label: "Data" },
      { key: "autor", label: "Autor" },
      { key: "status", label: "Status" },
      { key: "tamanho", label: "Tamanho" },
    ]}
    rows={MOCK_DOCUMENTOS}
    kanbanGroupKey="status"
    kanbanColumns={["rascunho", "revisao", "aprovada", "arquivada"]}
    charts={[
      { title: "Por tipo", groupKey: "tipo" },
      { title: "Por status", groupKey: "status" },
    ]}
    ranking={{ title: "Top autores", groupKey: "autor" }}
  />
);

/* ============== RESPONSÁVEIS ============== */
export const JurResponsaveisPage = () => {
  const totalAtivos = MOCK_RESPONSAVEIS.reduce((s, r) => s + r.processosAtivos, 0);
  const totalPrazos = MOCK_RESPONSAVEIS.reduce((s, r) => s + r.prazosVencendo, 0);
  return (
    <JurDeluxePage
      title="Responsáveis"
      description="Advogados e responsáveis técnicos do escritório."
      titleKey="nome"
      kpis={[
        { label: "Total", value: MOCK_RESPONSAVEIS.length, icon: Users, tone: "teal" },
        { label: "Ativos", value: MOCK_RESPONSAVEIS.filter(r => r.status === "ativo").length, icon: CheckCircle2, tone: "success" },
        { label: "Em férias", value: MOCK_RESPONSAVEIS.filter(r => r.status === "ferias").length, icon: PauseCircle, tone: "warn" },
        { label: "Processos ativos", value: totalAtivos, icon: Briefcase, tone: "neutral" },
        { label: "Prazos vencendo", value: totalPrazos, icon: AlertTriangle, tone: "danger" },
      ]}
      columns={[
        { key: "nome", label: "Nome" },
        { key: "oab", label: "OAB", mono: true },
        { key: "area", label: "Área", badge: true },
        { key: "status", label: "Status" },
        { key: "processosAtivos", label: "Processos ativos" },
        { key: "prazosVencendo", label: "Prazos vencendo" },
        { key: "email", label: "E-mail" },
      ]}
      rows={MOCK_RESPONSAVEIS}
      kanbanGroupKey="status"
      kanbanColumns={["ativo", "ferias", "inativo"]}
      charts={[
        { title: "Por área", groupKey: "area" },
        { title: "Por status", groupKey: "status" },
      ]}
    />
  );
};

/* ============== TAREFAS ============== */
export const JurTarefasPage = () => (
  <JurDeluxePage
    title="Tarefas"
    description="Tarefas internas vinculadas a processos."
    titleKey="titulo"
    kpis={[
      { label: "Total", value: MOCK_TAREFAS.length, icon: ListChecks, tone: "teal" },
      { label: "Abertas", value: MOCK_TAREFAS.filter(t => t.status === "aberta").length, icon: AlertTriangle, tone: "warn" },
      { label: "Em andamento", value: MOCK_TAREFAS.filter(t => t.status === "em_andamento").length, icon: PauseCircle, tone: "teal" },
      { label: "Críticas", value: MOCK_TAREFAS.filter(t => t.prioridade === "critica").length, icon: AlertTriangle, tone: "danger" },
      { label: "Concluídas", value: MOCK_TAREFAS.filter(t => t.status === "concluida").length, icon: CheckCircle2, tone: "success" },
    ]}
    columns={[
      { key: "titulo", label: "Título" },
      { key: "processo", label: "Processo", mono: true },
      { key: "responsavel", label: "Responsável" },
      { key: "prazo", label: "Prazo" },
      { key: "prioridade", label: "Prioridade" },
      { key: "status", label: "Status" },
    ]}
    rows={MOCK_TAREFAS}
    kanbanGroupKey="status"
    kanbanColumns={["aberta", "em_andamento", "concluida", "cancelada"]}
    charts={[
      { title: "Por prioridade", groupKey: "prioridade" },
      { title: "Por status", groupKey: "status" },
    ]}
    ranking={{ title: "Tarefas por responsável", groupKey: "responsavel" }}
  />
);

/* ============== RELATÓRIOS ============== */
export const JurRelatoriosPage = () => (
  <JurDeluxePage
    title="Relatórios"
    description="Relatórios mensais, processuais, financeiros e estratégicos."
    titleKey="titulo"
    kpis={[
      { label: "Total", value: MOCK_RELATORIOS.length, icon: BarChart3, tone: "teal" },
      { label: "Mensais", value: MOCK_RELATORIOS.filter(r => r.tipo === "mensal").length, icon: BarChart3, tone: "success" },
      { label: "Processuais", value: MOCK_RELATORIOS.filter(r => r.tipo === "processual").length, icon: BarChart3, tone: "warn" },
      { label: "Financeiros", value: MOCK_RELATORIOS.filter(r => r.tipo === "financeiro").length, icon: BarChart3, tone: "neutral" },
      { label: "Aprovados", value: MOCK_RELATORIOS.filter(r => r.status === "aprovada").length, icon: CheckCircle2, tone: "success" },
    ]}
    columns={[
      { key: "titulo", label: "Título" },
      { key: "tipo", label: "Tipo", badge: true },
      { key: "periodo", label: "Período" },
      { key: "data", label: "Data" },
      { key: "autor", label: "Autor" },
      { key: "status", label: "Status" },
    ]}
    rows={MOCK_RELATORIOS}
    kanbanGroupKey="status"
    kanbanColumns={["rascunho", "aprovada", "arquivada"]}
    charts={[
      { title: "Por tipo", groupKey: "tipo" },
      { title: "Por status", groupKey: "status" },
    ]}
    ranking={{ title: "Relatórios por autor", groupKey: "autor" }}
  />
);
