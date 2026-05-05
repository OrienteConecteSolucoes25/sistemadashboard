import EngListPage, { KpiDef } from "./EngListPage";
import { PendenciasAggregator } from "./components/PendenciasAggregator";
import { OutlookComposeButton } from "./components/OutlookComposeButton";
import { OutlookTemplatesManager } from "./components/OutlookTemplatesManager";
import {
  ATIVIDADES_CONFIG, DEMANDAS_CONFIG, RFI_CONFIG, PENDENCIAS_CONFIG,
  ENERGIA_CONFIG, ART_CONFIG, EQUIPES_CONFIG, MATERIAIS_CONFIG,
  RELATORIOS_CONFIG, EMAILS_CONFIG, INTEGRACOES_CONFIG, ROADMAP_CONFIG,
  FIELD_OPTIONS_CONFIG, SITES_CONFIG,
} from "./crud/configs";
import {
  Activity, AlertTriangle, CalendarClock, CheckCircle2, FileQuestion, FileSignature,
  ListTodo, MapPin, Zap, Boxes, Mail, Database, Brain, Settings2, Users, FileText, DollarSign,
} from "lucide-react";

const isOverdue = (d: any) => d && new Date(d) < new Date(new Date().toDateString());
const countBy = (rows: any[], key: string, val: string) =>
  rows.filter((r) => String(r[key] ?? "").toLowerCase() === val).length;
const countOpen = (rows: any[]) =>
  rows.filter((r) => !["concluida", "concluido", "fechada", "cancelada", "cancelado", "rejeitada", "ligada", "recebida"].includes(String(r.status ?? "").toLowerCase())).length;

/* =========== ATIVIDADES =========== */
export const AtividadesPage = () => {
  const kpis: KpiDef[] = [
    { label: "Total", icon: Activity, tone: "teal", compute: (r) => r.length },
    { label: "Em andamento", icon: CalendarClock, tone: "teal", compute: (r) => countBy(r, "status", "em_andamento") },
    { label: "Concluídas", icon: CheckCircle2, tone: "success", compute: (r) => countBy(r, "status", "concluida") },
    { label: "Atrasadas", icon: AlertTriangle, tone: "danger", compute: (r) => r.filter((x) => isOverdue(x.prazo) && String(x.status).toLowerCase() !== "concluida").length },
    { label: "Em aberto", icon: ListTodo, tone: "warn", compute: (r) => countOpen(r) },
  ];
  return (
    <div>
      <PendenciasAggregator />
      <EngListPage
        config={ATIVIDADES_CONFIG}
        kpis={kpis}
        facetKeys={["status"]}
        views={["list", "kanban", "dashboard", "timeline"]}
        kanban={{ columns: ["aberta", "em_andamento", "concluida", "cancelada"] }}
        dashboard={{ distribuicaoKey: "status", rankingKey: "responsavel" }}
      />
    </div>
  );
};

/* =========== DEMANDAS =========== */
export const DemandasPage = () => {
  const kpis: KpiDef[] = [
    { label: "Total", icon: ListTodo, tone: "teal", compute: (r) => r.length },
    { label: "Abertas", icon: CalendarClock, tone: "warn", compute: (r) => countBy(r, "status", "aberta") },
    { label: "Alta prioridade", icon: AlertTriangle, tone: "danger", compute: (r) => countBy(r, "prioridade", "alta") },
    { label: "Concluídas", icon: CheckCircle2, tone: "success", compute: (r) => countBy(r, "status", "concluida") },
    { label: "Atrasadas", icon: AlertTriangle, tone: "danger", compute: (r) => r.filter((x) => isOverdue(x.prazo) && String(x.status).toLowerCase() !== "concluida").length },
  ];
  return (
    <EngListPage
      config={DEMANDAS_CONFIG}
      kpis={kpis}
      facetKeys={["status", "prioridade"]}
      views={["list", "kanban", "dashboard", "timeline"]}
      kanban={{ columns: ["aberta", "em_andamento", "concluida", "cancelada"] }}
      dashboard={{ distribuicaoKey: "prioridade", rankingKey: "responsavel" }}
    />
  );
};

/* =========== RFI =========== */
export const RfiPage = () => {
  const kpis: KpiDef[] = [
    { label: "Total", icon: FileQuestion, tone: "teal", compute: (r) => r.length },
    { label: "Abertas", icon: CalendarClock, tone: "warn", compute: (r) => countBy(r, "status", "aberta") },
    { label: "Respondidas", icon: CheckCircle2, tone: "teal", compute: (r) => countBy(r, "status", "respondida") },
    { label: "Fechadas", icon: CheckCircle2, tone: "success", compute: (r) => countBy(r, "status", "fechada") },
    { label: "Atrasadas", icon: AlertTriangle, tone: "danger", compute: (r) => r.filter((x) => isOverdue(x.prazo) && !["fechada", "respondida"].includes(String(x.status).toLowerCase())).length },
  ];
  return (
    <EngListPage
      config={RFI_CONFIG}
      kpis={kpis}
      facetKeys={["status"]}
      views={["list", "kanban", "timeline"]}
      kanban={{ columns: ["aberta", "respondida", "fechada"] }}
    />
  );
};

/* =========== PENDÊNCIAS =========== */
export const PendenciasPage = () => {
  const kpis: KpiDef[] = [
    { label: "Total", icon: AlertTriangle, tone: "teal", compute: (r) => r.length },
    { label: "Abertas", icon: CalendarClock, tone: "warn", compute: (r) => countBy(r, "status", "aberta") },
    { label: "Críticas", icon: AlertTriangle, tone: "danger", compute: (r) => countBy(r, "prioridade", "alta") },
    { label: "Concluídas", icon: CheckCircle2, tone: "success", compute: (r) => countBy(r, "status", "concluida") },
    { label: "Atrasadas", icon: AlertTriangle, tone: "danger", compute: (r) => r.filter((x) => isOverdue(x.prazo) && String(x.status).toLowerCase() !== "concluida").length },
  ];
  return (
    <EngListPage
      config={PENDENCIAS_CONFIG}
      kpis={kpis}
      facetKeys={["status", "prioridade"]}
      views={["list", "kanban", "dashboard", "timeline"]}
      kanban={{ columns: ["aberta", "em_andamento", "concluida", "cancelada"] }}
      dashboard={{ distribuicaoKey: "prioridade", rankingKey: "responsavel" }}
    />
  );
};

/* =========== ENERGIA =========== */
export const EnergiaPage = () => {
  const kpis: KpiDef[] = [
    { label: "Total", icon: Zap, tone: "teal", compute: (r) => r.length },
    { label: "Solicitadas", icon: CalendarClock, tone: "warn", compute: (r) => countBy(r, "status", "solicitada") },
    { label: "Em análise", icon: CalendarClock, tone: "teal", compute: (r) => countBy(r, "status", "em_analise") },
    { label: "Ligadas", icon: CheckCircle2, tone: "success", compute: (r) => countBy(r, "status", "ligada") },
    { label: "Rejeitadas", icon: AlertTriangle, tone: "danger", compute: (r) => countBy(r, "status", "rejeitada") },
  ];
  return (
    <EngListPage
      config={ENERGIA_CONFIG}
      kpis={kpis}
      facetKeys={["status", "concessionaria"]}
      views={["list", "kanban", "dashboard"]}
      kanban={{ columns: ["solicitada", "em_analise", "aprovada", "ligada", "rejeitada"], titleKey: "protocolo", subtitleKey: "concessionaria", dateKey: "data_solicitacao" }}
      dashboard={{ distribuicaoKey: "status", rankingKey: "concessionaria" }}
    />
  );
};

/* =========== ART =========== */
export const ArtPage = () => {
  const sum = (rows: any[]) => rows.reduce((a, r) => a + (Number(r.valor) || 0), 0);
  const fmtBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const kpis: KpiDef[] = [
    { label: "Total", icon: FileSignature, tone: "teal", compute: (r) => r.length },
    { label: "Emitidas", icon: CheckCircle2, tone: "teal", compute: (r) => countBy(r, "status", "emitida") },
    { label: "Pagas", icon: CheckCircle2, tone: "success", compute: (r) => countBy(r, "status", "paga") },
    { label: "Canceladas", icon: AlertTriangle, tone: "danger", compute: (r) => countBy(r, "status", "cancelada") },
    { label: "Valor total", icon: DollarSign, tone: "warn", compute: (r) => fmtBRL(sum(r)) },
  ];
  return (
    <EngListPage
      config={ART_CONFIG}
      kpis={kpis}
      facetKeys={["status"]}
      views={["list", "dashboard", "timeline"]}
      dashboard={{ distribuicaoKey: "status", rankingKey: "responsavel_tecnico" }}
      timelineDateKey="data_emissao"
    />
  );
};

/* =========== outras (KPIs leves para manter consistência visual) =========== */
export const SitesPage = () => {
  const kpis: KpiDef[] = [
    { label: "Total", icon: MapPin, tone: "teal", compute: (r) => r.length },
    { label: "Ativos", icon: CheckCircle2, tone: "success", compute: (r) => countBy(r, "status", "ativo") },
    { label: "Em aprovação", icon: CalendarClock, tone: "warn", compute: (r) => countBy(r, "status", "em_aprovacao") },
    { label: "Pausados", icon: AlertTriangle, tone: "danger", compute: (r) => countBy(r, "status", "pausado") },
    { label: "Concluídos", icon: CheckCircle2, tone: "neutral", compute: (r) => countBy(r, "status", "concluido") },
  ];
  return <EngListPage config={SITES_CONFIG} kpis={kpis} facetKeys={["status", "uf"]} />;
};

export const EquipesPage = () => {
  const kpis: KpiDef[] = [
    { label: "Total", icon: Users, tone: "teal", compute: (r) => r.length },
    { label: "Ativas", icon: CheckCircle2, tone: "success", compute: (r) => countBy(r, "status", "ativa") },
    { label: "Alocadas", icon: CalendarClock, tone: "teal", compute: (r) => countBy(r, "status", "alocada") },
    { label: "Inativas", icon: AlertTriangle, tone: "neutral", compute: (r) => countBy(r, "status", "inativa") },
  ];
  return <EngListPage config={EQUIPES_CONFIG} kpis={kpis} facetKeys={["status"]} />;
};

export const MateriaisPage = () => {
  const kpis: KpiDef[] = [
    { label: "Itens", icon: Boxes, tone: "teal", compute: (r) => r.length },
    { label: "Total estoque", icon: Boxes, tone: "success", compute: (r) => r.reduce((a, x) => a + (Number(x.estoque) || 0), 0).toLocaleString("pt-BR") },
    { label: "Total reservado", icon: CalendarClock, tone: "warn", compute: (r) => r.reduce((a, x) => a + (Number(x.reservado) || 0), 0).toLocaleString("pt-BR") },
    { label: "Em ruptura", icon: AlertTriangle, tone: "danger", compute: (r) => r.filter((x) => Number(x.estoque) <= 0).length },
  ];
  return <EngListPage config={MATERIAIS_CONFIG} kpis={kpis} statusKeys={[]} />;
};

export const RelatoriosPage = () => <EngListPage config={RELATORIOS_CONFIG} kpis={[
  { label: "Total", icon: FileText, tone: "teal", compute: (r) => r.length },
]} facetKeys={["tipo"]} views={["list", "dashboard", "timeline"]}
  dashboard={{ distribuicaoKey: "tipo", rankingKey: "autor" }}
  timelineDateKey="data" />;

export const EmailsPage = () => (
  <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 className="text-lg font-display font-semibold">E-mails (Outlook)</h2>
        <p className="text-xs text-muted-foreground">Composer integrado com Outlook (mailto / OWA / desktop) e log automático.</p>
      </div>
      <OutlookComposeButton variant="default" size="sm" label="Novo e-mail" defaults={{ origem: "manual", modulo: "emails" }} />
    </div>
    <OutlookTemplatesManager />
    <EngListPage config={EMAILS_CONFIG} kpis={[
      { label: "Total", icon: Mail, tone: "teal", compute: (r) => r.length },
      { label: "Compostos", icon: CheckCircle2, tone: "teal", compute: (r) => countBy(r, "status", "composed") },
      { label: "Enviados", icon: CheckCircle2, tone: "success", compute: (r) => countBy(r, "status", "enviado") },
      { label: "Falharam", icon: AlertTriangle, tone: "danger", compute: (r) => countBy(r, "status", "falhou") },
      { label: "Pendentes", icon: CalendarClock, tone: "warn", compute: (r) => countBy(r, "status", "pendente") },
    ]} facetKeys={["status"]} views={["list", "dashboard", "timeline"]}
      dashboard={{ distribuicaoKey: "status", rankingKey: "destinatario" }} />
  </div>
);

export const IntegracoesPage = () => <EngListPage config={INTEGRACOES_CONFIG} kpis={[
  { label: "Total", icon: Database, tone: "teal", compute: (r) => r.length },
  { label: "Ativas", icon: CheckCircle2, tone: "success", compute: (r) => r.filter((x) => x.ativa).length },
  { label: "Inativas", icon: AlertTriangle, tone: "neutral", compute: (r) => r.filter((x) => !x.ativa).length },
]} statusKeys={[]} />;

export const RoadmapPage = () => <EngListPage config={ROADMAP_CONFIG} kpis={[
  { label: "Total", icon: Brain, tone: "teal", compute: (r) => r.length },
  { label: "Em dev", icon: CalendarClock, tone: "teal", compute: (r) => countBy(r, "status", "em_dev") },
  { label: "Em produção", icon: CheckCircle2, tone: "success", compute: (r) => countBy(r, "status", "em_producao") },
  { label: "Ideias", icon: Brain, tone: "neutral", compute: (r) => countBy(r, "status", "idea") },
]} facetKeys={["status", "prioridade"]} views={["list", "kanban", "dashboard"]}
  kanban={{ columns: ["idea", "validando", "em_dev", "em_producao", "descartada"] }}
  dashboard={{ distribuicaoKey: "status", rankingKey: "area" }} />;

export const ConfiguracoesPage = () => <EngListPage config={FIELD_OPTIONS_CONFIG} kpis={[
  { label: "Opções", icon: Settings2, tone: "teal", compute: (r) => r.length },
  { label: "Ativas", icon: CheckCircle2, tone: "success", compute: (r) => r.filter((x) => x.ativo).length },
]} statusKeys={[]} facetKeys={["field_key"]} />;
