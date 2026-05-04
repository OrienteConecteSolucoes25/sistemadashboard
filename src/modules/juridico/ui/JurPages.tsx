import JurTablePage from "./JurTablePage";
import { Scale, Clock, FileText, Users, ListChecks, BarChart3, AlertTriangle, CheckCircle2, PauseCircle } from "lucide-react";
import {
  MOCK_PROCESSOS, MOCK_PRAZOS, MOCK_DOCUMENTOS,
  MOCK_RESPONSAVEIS, MOCK_TAREFAS, MOCK_RELATORIOS,
} from "../mock/jurMockData";

export const JurProcessosPage = () => (
  <JurTablePage
    title="Processos"
    description="Processos judiciais e administrativos."
    kpis={[
      { label: "Total", value: MOCK_PROCESSOS.length, icon: Scale, tone: "teal" },
      { label: "Ativos", value: MOCK_PROCESSOS.filter(p => p.status === "ativo").length, icon: CheckCircle2, tone: "success" },
      { label: "Suspensos", value: MOCK_PROCESSOS.filter(p => p.status === "suspenso").length, icon: PauseCircle, tone: "warn" },
      { label: "Encerrados", value: MOCK_PROCESSOS.filter(p => p.status === "encerrado").length, icon: AlertTriangle, tone: "neutral" },
    ]}
    columns={[
      { key: "numero", label: "Número" },
      { key: "parte", label: "Parte" },
      { key: "vara", label: "Vara" },
      { key: "tipo", label: "Tipo" },
      { key: "status", label: "Status" },
      { key: "responsavel", label: "Responsável" },
    ]}
    rows={MOCK_PROCESSOS}
  />
);

export const JurPrazosPage = () => (
  <JurTablePage
    title="Prazos"
    description="Prazos processuais e administrativos."
    kpis={[
      { label: "Total", value: MOCK_PRAZOS.length, icon: Clock, tone: "teal" },
      { label: "Críticos", value: MOCK_PRAZOS.filter(p => p.prioridade === "critica").length, icon: AlertTriangle, tone: "danger" },
      { label: "Pendentes", value: MOCK_PRAZOS.filter(p => p.status === "pendente").length, icon: PauseCircle, tone: "warn" },
      { label: "Cumpridos", value: MOCK_PRAZOS.filter(p => p.status === "cumprido").length, icon: CheckCircle2, tone: "success" },
    ]}
    columns={[
      { key: "processo", label: "Processo" },
      { key: "descricao", label: "Descrição" },
      { key: "data", label: "Data" },
      { key: "prioridade", label: "Prioridade" },
      { key: "status", label: "Status" },
    ]}
    rows={MOCK_PRAZOS}
  />
);

export const JurDocumentosPage = () => (
  <JurTablePage
    title="Documentos"
    description="Petições, pareceres, contratos e anexos."
    kpis={[
      { label: "Total", value: MOCK_DOCUMENTOS.length, icon: FileText, tone: "teal" },
      { label: "Petições", value: MOCK_DOCUMENTOS.filter(d => d.tipo === "peticao").length, icon: FileText, tone: "neutral" },
      { label: "Pareceres", value: MOCK_DOCUMENTOS.filter(d => d.tipo === "parecer").length, icon: FileText, tone: "warn" },
      { label: "Contratos", value: MOCK_DOCUMENTOS.filter(d => d.tipo === "contrato").length, icon: FileText, tone: "success" },
    ]}
    columns={[
      { key: "titulo", label: "Título" },
      { key: "tipo", label: "Tipo" },
      { key: "processo", label: "Processo" },
      { key: "data", label: "Data" },
      { key: "autor", label: "Autor" },
    ]}
    rows={MOCK_DOCUMENTOS}
  />
);

export const JurResponsaveisPage = () => {
  const totalAtivos = MOCK_RESPONSAVEIS.reduce((s, r) => s + r.processosAtivos, 0);
  return (
    <JurTablePage
      title="Responsáveis"
      description="Advogados e responsáveis técnicos."
      kpis={[
        { label: "Total", value: MOCK_RESPONSAVEIS.length, icon: Users, tone: "teal" },
        { label: "Processos ativos", value: totalAtivos, icon: Scale, tone: "success" },
        { label: "Áreas", value: new Set(MOCK_RESPONSAVEIS.map(r => r.area)).size, icon: BarChart3, tone: "warn" },
        { label: "Média/responsável", value: MOCK_RESPONSAVEIS.length ? (totalAtivos / MOCK_RESPONSAVEIS.length).toFixed(1) : 0, icon: BarChart3, tone: "neutral" },
      ]}
      columns={[
        { key: "nome", label: "Nome" },
        { key: "oab", label: "OAB" },
        { key: "area", label: "Área" },
        { key: "processosAtivos", label: "Processos ativos" },
      ]}
      rows={MOCK_RESPONSAVEIS}
    />
  );
};

export const JurTarefasPage = () => (
  <JurTablePage
    title="Tarefas"
    description="Tarefas internas vinculadas a processos."
    kpis={[
      { label: "Total", value: MOCK_TAREFAS.length, icon: ListChecks, tone: "teal" },
      { label: "Abertas", value: MOCK_TAREFAS.filter(t => t.status === "aberta").length, icon: AlertTriangle, tone: "warn" },
      { label: "Em andamento", value: MOCK_TAREFAS.filter(t => t.status === "em_andamento").length, icon: PauseCircle, tone: "teal" },
      { label: "Concluídas", value: MOCK_TAREFAS.filter(t => t.status === "concluida").length, icon: CheckCircle2, tone: "success" },
    ]}
    columns={[
      { key: "titulo", label: "Título" },
      { key: "processo", label: "Processo" },
      { key: "responsavel", label: "Responsável" },
      { key: "prazo", label: "Prazo" },
      { key: "status", label: "Status" },
    ]}
    rows={MOCK_TAREFAS}
  />
);

export const JurRelatoriosPage = () => (
  <JurTablePage
    title="Relatórios"
    description="Relatórios mensais, processuais e financeiros."
    kpis={[
      { label: "Total", value: MOCK_RELATORIOS.length, icon: BarChart3, tone: "teal" },
      { label: "Mensais", value: MOCK_RELATORIOS.filter(r => r.tipo === "mensal").length, icon: BarChart3, tone: "success" },
      { label: "Processuais", value: MOCK_RELATORIOS.filter(r => r.tipo === "processual").length, icon: BarChart3, tone: "warn" },
      { label: "Financeiros", value: MOCK_RELATORIOS.filter(r => r.tipo === "financeiro").length, icon: BarChart3, tone: "neutral" },
    ]}
    columns={[
      { key: "titulo", label: "Título" },
      { key: "tipo", label: "Tipo" },
      { key: "data", label: "Data" },
      { key: "autor", label: "Autor" },
    ]}
    rows={MOCK_RELATORIOS}
  />
);
