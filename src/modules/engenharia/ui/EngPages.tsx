import EngTablePage from "./EngTablePage";
import {
  MOCK_SITES, MOCK_RFIS, MOCK_PENDENCIAS, MOCK_MATERIAIS, MOCK_EQUIPES, MOCK_RELATORIOS,
} from "../mock/engMockData";

export const EngSitesPage = () => (
  <EngTablePage
    title="Sites"
    description="Locais de obra / instalação."
    columns={[
      { key: "codigo", label: "Código" },
      { key: "nome", label: "Nome" },
      { key: "cidade", label: "Cidade" },
      { key: "uf", label: "UF" },
      { key: "status", label: "Status" },
      { key: "responsavel", label: "Responsável" },
    ]}
    rows={MOCK_SITES}
  />
);

export const EngRFIPage = () => (
  <EngTablePage
    title="RFI"
    description="Pedidos de informação técnica."
    columns={[
      { key: "numero", label: "Número" },
      { key: "site", label: "Site" },
      { key: "assunto", label: "Assunto" },
      { key: "status", label: "Status" },
      { key: "prazo", label: "Prazo" },
    ]}
    rows={MOCK_RFIS}
  />
);

export const EngPendenciasPage = () => (
  <EngTablePage
    title="Pendências"
    description="Itens em aberto exigindo ação."
    columns={[
      { key: "titulo", label: "Título" },
      { key: "site", label: "Site" },
      { key: "prioridade", label: "Prioridade" },
      { key: "responsavel", label: "Responsável" },
      { key: "prazo", label: "Prazo" },
      { key: "status", label: "Status" },
    ]}
    rows={MOCK_PENDENCIAS}
  />
);

export const EngMateriaisPage = () => (
  <EngTablePage
    title="Materiais"
    description="Estoque e reservas por site."
    columns={[
      { key: "descricao", label: "Descrição" },
      { key: "unidade", label: "Unid." },
      { key: "estoque", label: "Estoque" },
      { key: "reservado", label: "Reservado" },
      { key: "site", label: "Site" },
    ]}
    rows={MOCK_MATERIAIS}
  />
);

export const EngEquipesPage = () => (
  <EngTablePage
    title="Equipes"
    description="Equipes técnicas e alocação."
    columns={[
      { key: "nome", label: "Nome" },
      { key: "lider", label: "Líder" },
      { key: "membros", label: "Membros" },
      { key: "site", label: "Site" },
      { key: "status", label: "Status" },
    ]}
    rows={MOCK_EQUIPES}
  />
);

export const EngRelatoriosPage = () => (
  <EngTablePage
    title="Relatórios"
    description="Diários, técnicos e inspeções."
    columns={[
      { key: "titulo", label: "Título" },
      { key: "tipo", label: "Tipo" },
      { key: "site", label: "Site" },
      { key: "data", label: "Data" },
      { key: "autor", label: "Autor" },
    ]}
    rows={MOCK_RELATORIOS}
  />
);
