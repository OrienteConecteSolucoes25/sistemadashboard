import JurTablePage from "./JurTablePage";
import {
  MOCK_PROCESSOS, MOCK_PRAZOS, MOCK_DOCUMENTOS,
  MOCK_RESPONSAVEIS, MOCK_TAREFAS, MOCK_RELATORIOS,
} from "../mock/jurMockData";

export const JurProcessosPage = () => (
  <JurTablePage
    title="Processos"
    description="Processos judiciais e administrativos."
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

export const JurResponsaveisPage = () => (
  <JurTablePage
    title="Responsáveis"
    description="Advogados e responsáveis técnicos."
    columns={[
      { key: "nome", label: "Nome" },
      { key: "oab", label: "OAB" },
      { key: "area", label: "Área" },
      { key: "processosAtivos", label: "Processos ativos" },
    ]}
    rows={MOCK_RESPONSAVEIS}
  />
);

export const JurTarefasPage = () => (
  <JurTablePage
    title="Tarefas"
    description="Tarefas internas vinculadas a processos."
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
    columns={[
      { key: "titulo", label: "Título" },
      { key: "tipo", label: "Tipo" },
      { key: "data", label: "Data" },
      { key: "autor", label: "Autor" },
    ]}
    rows={MOCK_RELATORIOS}
  />
);
