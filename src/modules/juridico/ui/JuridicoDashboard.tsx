import { Scale, Clock, ListChecks, Users, AlertTriangle, FileText } from "lucide-react";
import { EngPageHeader } from "@/modules/engenharia/ui/components/EngPageHeader";
import { KpiCard, KpiGrid } from "@/modules/engenharia/ui/components/KpiCard";
import { DistribuicaoCard, RankingCard } from "@/modules/engenharia/ui/components/EngMiniCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MOCK_DASHBOARD, MOCK_PRAZOS, MOCK_TAREFAS,
  MOCK_PROCESSOS, MOCK_RESPONSAVEIS, MOCK_DOCUMENTOS,
} from "../mock/jurMockData";

const tonePrazo = (p: string) =>
  p === "critica" ? "danger" : p === "alta" ? "warn" : "neutral";

const JuridicoDashboard = () => {
  const distTipo = Object.entries(
    MOCK_PROCESSOS.reduce((acc: Record<string, number>, p) => {
      acc[p.tipo] = (acc[p.tipo] || 0) + 1; return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const distStatus = Object.entries(
    MOCK_PROCESSOS.reduce((acc: Record<string, number>, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1; return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const rankingResp = MOCK_RESPONSAVEIS
    .map((r) => ({ name: r.nome, value: r.processosAtivos }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <EngPageHeader
        title="Jurídico — Visão geral"
        description="Indicadores consolidados de processos, prazos e atividades."
        actions={<Badge variant="outline" className="font-mono text-[10px]">MOCK</Badge>}
      />

      <KpiGrid>
        <KpiCard label="Processos ativos" value={MOCK_DASHBOARD.processosAtivos} icon={Scale} tone="teal" />
        <KpiCard label="Prazos críticos" value={MOCK_DASHBOARD.prazosCriticos} icon={AlertTriangle} tone="danger" />
        <KpiCard label="Tarefas abertas" value={MOCK_DASHBOARD.tarefasAbertas} icon={ListChecks} tone="warn" />
        <KpiCard label="Documentos" value={MOCK_DOCUMENTOS.length} icon={FileText} tone="neutral" />
        <KpiCard label="Responsáveis" value={MOCK_DASHBOARD.responsaveis} icon={Users} tone="success" />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <DistribuicaoCard title="Processos por tipo" data={distTipo} />
        <DistribuicaoCard title="Processos por status" data={distStatus} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankingCard title="Top responsáveis (processos ativos)" data={rankingResp} />
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Próximos prazos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {MOCK_PRAZOS.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 text-sm border-b border-border/60 pb-2 last:border-0">
                <span className="font-mono text-[11px] text-muted-foreground shrink-0">{p.processo.slice(0, 14)}…</span>
                <span className="flex-1 truncate">{p.descricao}</span>
                <Badge variant="outline" className={`text-[10px] kpi-${tonePrazo(p.prioridade)}`}>{p.prioridade}</Badge>
                <span className="text-xs text-muted-foreground tabular-nums">{p.data}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="card-elegant">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-primary" />
            Tarefas em destaque
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-2">
          {MOCK_TAREFAS.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-2 text-sm border border-border/60 rounded-md px-3 py-2">
              <div className="min-w-0">
                <div className="font-medium truncate">{t.titulo}</div>
                <div className="text-[11px] text-muted-foreground truncate">{t.responsavel} · {t.prazo}</div>
              </div>
              <Badge variant="secondary" className="text-[10px]">{t.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default JuridicoDashboard;
