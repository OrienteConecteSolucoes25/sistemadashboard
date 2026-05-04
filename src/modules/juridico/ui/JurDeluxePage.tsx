import { useMemo, useState, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, List, Kanban, BarChart3, Clock } from "lucide-react";
import { EngPageHeader } from "@/modules/engenharia/ui/components/EngPageHeader";
import { KpiGrid, KpiCard, KpiCardProps } from "@/modules/engenharia/ui/components/KpiCard";
import { StatusBadge } from "@/modules/engenharia/ui/components/StatusBadge";
import { EngKanban } from "@/modules/engenharia/ui/components/EngKanban";
import { EngTimeline } from "@/modules/engenharia/ui/components/EngTimeline";
import { DistribuicaoCard, RankingCard } from "@/modules/engenharia/ui/components/EngMiniCharts";

type Col = { key: string; label: string; mono?: boolean; badge?: boolean };

export type JurDeluxeProps = {
  title: string;
  description?: string;
  kpis: KpiCardProps[];
  columns: Col[];
  rows: Record<string, any>[];
  /** chave para agrupar Kanban (default "status") */
  kanbanGroupKey?: string;
  /** colunas ordenadas do Kanban */
  kanbanColumns?: string[];
  /** chave do título nos cards Kanban/Timeline */
  titleKey?: string;
  /** charts: pares título/groupKey para os 2 pies */
  charts?: { title: string; groupKey: string }[];
  /** ranking: título e groupKey */
  ranking?: { title: string; groupKey: string };
  /** mostra Timeline? (default true) */
  showTimeline?: boolean;
  actions?: ReactNode;
};

const fmt = (v: any) => {
  if (v == null || v === "") return "—";
  if (typeof v === "number") {
    // valorCausa é numérico => formata como BRL se for grande
    if (v >= 1000) return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
    return String(v);
  }
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) {
    try { return new Date(v).toLocaleDateString("pt-BR"); } catch { return v; }
  }
  return String(v);
};

const JurDeluxePage = ({
  title, description, kpis, columns, rows,
  kanbanGroupKey = "status", kanbanColumns, titleKey,
  charts, ranking, showTimeline = true, actions,
}: JurDeluxeProps) => {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter((r) =>
      columns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(s))
    );
  }, [q, rows, columns]);

  return (
    <div className="space-y-4">
      <EngPageHeader
        title={title}
        description={description}
        actions={
          <>
            {actions}
            <Badge variant="outline" className="font-mono text-[10px]">MOCK</Badge>
          </>
        }
      />

      {kpis.length > 0 && (
        <KpiGrid>
          {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
        </KpiGrid>
      )}

      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="lista" className="gap-1.5"><List className="w-3.5 h-3.5" />Lista</TabsTrigger>
          <TabsTrigger value="kanban" className="gap-1.5"><Kanban className="w-3.5 h-3.5" />Kanban</TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" />Dashboard</TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5" disabled={!showTimeline}><Clock className="w-3.5 h-3.5" />Timeline</TabsTrigger>
        </TabsList>

        {/* ========== LISTA ========== */}
        <TabsContent value="lista" className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar..."
                className="pl-8 h-9"
              />
            </div>
            <Badge variant="secondary" className="text-[10px]">{filtered.length} de {rows.length}</Badge>
          </div>

          <Card className="card-elegant overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border/60">
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-3 py-10 text-center text-muted-foreground">
                      Nenhum registro.
                    </td>
                  </tr>
                ) : filtered.map((r, i) => (
                  <tr key={r.id ?? i} className="border-t border-border/40 hover:bg-muted/30 transition-colors">
                    {columns.map((c) => {
                      const val = r[c.key];
                      const isStatus = c.key === "status" || c.key === "prioridade" || c.badge;
                      return (
                        <td key={c.key} className="px-3 py-2 align-top whitespace-nowrap">
                          {isStatus ? (
                            <StatusBadge value={val} />
                          ) : (
                            <span className={c.mono || ["numero", "processo", "oab"].includes(c.key) ? "font-mono text-[12px]" : ""}>
                              {fmt(val)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        {/* ========== KANBAN ========== */}
        <TabsContent value="kanban">
          <EngKanban
            rows={rows}
            groupKey={kanbanGroupKey}
            columns={kanbanColumns}
            titleKey={titleKey}
            subtitleKey="responsavel"
            dateKey={rows[0]?.prazo !== undefined ? "prazo" : rows[0]?.data !== undefined ? "data" : "created_at"}
            priorityKey="prioridade"
          />
        </TabsContent>

        {/* ========== DASHBOARD ========== */}
        <TabsContent value="dashboard" className="space-y-4">
          {charts && charts.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              {charts.map((c, i) => (
                <DistribuicaoCard key={i} title={c.title} rows={rows} groupKey={c.groupKey} />
              ))}
            </div>
          )}
          {ranking && (
            <RankingCard title={ranking.title} rows={rows} groupKey={ranking.groupKey} />
          )}
          {!charts?.length && !ranking && (
            <Card className="card-elegant p-8 text-center text-muted-foreground text-sm">
              Sem visualizações configuradas.
            </Card>
          )}
        </TabsContent>

        {/* ========== TIMELINE ========== */}
        <TabsContent value="timeline">
          <EngTimeline
            rows={rows}
            dateKey="created_at"
            titleKey={titleKey}
            subtitleKey="responsavel"
            statusKey="status"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JurDeluxePage;
