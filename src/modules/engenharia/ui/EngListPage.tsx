import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Trash2, Filter, List, LayoutGrid, BarChart3, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CrudConfig, FieldSchema } from "./crud/types";
import { KpiCard, KpiGrid } from "./components/KpiCard";
import { StatusBadge } from "./components/StatusBadge";
import { EngPageHeader } from "./components/EngPageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EngKanban } from "./components/EngKanban";
import { EngTimeline } from "./components/EngTimeline";
import { DistribuicaoCard, RankingCard } from "./components/EngMiniCharts";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import { DeleteWithPasswordModal } from "@/components/DeleteWithPasswordModal";
import { SOFT_DELETE_TABLES } from "../lib/deleteWithAudit";

type Tone = "teal" | "warn" | "danger" | "success" | "neutral";
export type KpiDef = {
  label: string;
  icon?: LucideIcon;
  tone?: Tone;
  compute: (rows: any[]) => number | string;
  hint?: string | ((rows: any[]) => string | undefined);
};

export type ViewKind = "list" | "kanban" | "dashboard" | "timeline";

export type EngListPageProps = {
  config: CrudConfig;
  kpis?: KpiDef[];
  statusKeys?: string[];
  facetKeys?: string[];
  /** which sub-views to expose; defaults to ["list"] */
  views?: ViewKind[];
  kanban?: {
    groupKey?: string;
    columns?: string[];
    titleKey?: string;
    subtitleKey?: string;
    dateKey?: string;
    priorityKey?: string;
  };
  dashboard?: {
    distribuicaoKey?: string;
    rankingKey?: string;
  };
  timelineDateKey?: string;
};

const formatCell = (val: any, f: FieldSchema, statusKeys: string[]) => {
  if (val === null || val === undefined || val === "") return <span className="text-muted-foreground text-xs">—</span>;
  if (statusKeys.includes(f.key)) return <StatusBadge value={String(val)} />;
  if (f.type === "boolean") return val ? "Sim" : "Não";
  if (f.type === "date") return new Date(val).toLocaleDateString("pt-BR");
  if (f.type === "number" && typeof val === "number") return val.toLocaleString("pt-BR");
  if (typeof val === "object") return <span className="font-mono text-xs">{JSON.stringify(val).slice(0, 50)}</span>;
  return <span className="truncate">{String(val)}</span>;
};

const FormField = ({ field, value, onChange }: { field: FieldSchema; value: any; onChange: (v: any) => void }) => {
  switch (field.type) {
    case "textarea":
      return <Textarea rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "number":
      return <Input type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} />;
    case "date":
      return <Input type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} />;
    case "boolean":
      return <Switch checked={!!value} onCheckedChange={onChange} />;
    case "select":
      return (
        <Select value={value ?? ""} onValueChange={(v) => onChange(v || null)}>
          <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((o) => <SelectItem key={o} value={o}>{o.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    default:
      return <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }
};

const EngListPage = ({
  config, kpis = [], statusKeys = ["status", "prioridade"], facetKeys = [],
  views = ["list"], kanban, dashboard, timelineDateKey = "created_at",
}: EngListPageProps) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [facets, setFacets] = useState<Record<string, string>>({});
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const listFields = useMemo(() => config.fields.filter((f) => f.inList !== false).slice(0, 7), [config]);
  const searchKeys = config.searchKeys ?? config.fields.filter((f) => f.type === "text" || f.type === "textarea").map((f) => f.key);

  const load = async () => {
    setLoading(true);
    const orderCol = config.orderBy?.column ?? "created_at";
    const asc = config.orderBy?.ascending ?? false;
    const { data, error } = await (supabase.from(config.table as any).select("*").order(orderCol, { ascending: asc }) as any);
    if (error) toast.error(error.message);
    setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [config.table]);

  const filtered = useMemo(() => {
    let r = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((row) => searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(q)));
    }
    Object.entries(facets).forEach(([k, v]) => {
      if (v && v !== "__all__") r = r.filter((row) => String(row[k] ?? "") === v);
    });
    return r;
  }, [rows, search, facets, searchKeys]);

  const facetOptions = useMemo(() => {
    const out: Record<string, string[]> = {};
    facetKeys.forEach((k) => {
      const set = new Set<string>();
      rows.forEach((r) => { const v = r[k]; if (v) set.add(String(v)); });
      out[k] = Array.from(set).sort();
    });
    return out;
  }, [rows, facetKeys]);

  const startNew = () => {
    const empty: any = {};
    config.fields.forEach((f) => { empty[f.key] = f.type === "boolean" ? false : null; });
    setEditing(empty); setOpenForm(true);
  };

  const save = async () => {
    if (!editing) return;
    for (const f of config.fields) {
      if (f.required && (editing[f.key] === null || editing[f.key] === undefined || editing[f.key] === "")) {
        toast.error(`${f.label} é obrigatório`); return;
      }
    }
    const payload: any = {};
    config.fields.forEach((f) => { payload[f.key] = editing[f.key] ?? null; });
    if (editing.id) {
      const { error } = await (supabase.from(config.table as any).update(payload).eq("id", editing.id) as any);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await (supabase.from(config.table as any).insert(payload) as any);
      if (error) return toast.error(error.message);
    }
    toast.success("Salvo");
    setOpenForm(false); setEditing(null); load();
  };

  const del = async (id: string) => {
    if (!confirm("Excluir registro?")) return;
    const { error } = await (supabase.from(config.table as any).delete().eq("id", id) as any);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-4">
      <EngPageHeader
        title={config.title}
        description={config.description}
        actions={
          <Button onClick={startNew} className="shadow-elegant">
            <Plus className="w-4 h-4" /> Novo
          </Button>
        }
      />

      {kpis.length > 0 && (
        <KpiGrid>
          {kpis.map((k, i) => (
            <KpiCard
              key={i}
              label={k.label}
              value={k.compute(rows)}
              icon={k.icon}
              tone={k.tone}
              hint={typeof k.hint === "function" ? k.hint(rows) : k.hint}
            />
          ))}
        </KpiGrid>
      )}

      {(() => {
        const filtersBar = (
          <Card className="card-elegant p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-8 h-9" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              {facetKeys.map((k) => {
                const f = config.fields.find((x) => x.key === k);
                return (
                  <div key={k} className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    <Select value={facets[k] ?? "__all__"} onValueChange={(v) => setFacets({ ...facets, [k]: v })}>
                      <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder={f?.label ?? k} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">{f?.label ?? k}: todos</SelectItem>
                        {(facetOptions[k] ?? []).map((o) => (
                          <SelectItem key={o} value={o}>{o.replace(/_/g, " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
              <span className="ml-auto text-xs text-muted-foreground">
                {filtered.length} de {rows.length}
              </span>
            </div>
          </Card>
        );

        const listView = (
          <Card className="card-elegant overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 border-b">
                <tr>
                  {listFields.map((f) => (
                    <th key={f.key} className="text-left px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-muted-foreground">
                      {f.label}
                    </th>
                  ))}
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={listFields.length + 1} className="px-3 py-12 text-center text-muted-foreground">Carregando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={listFields.length + 1} className="px-3 py-12 text-center text-muted-foreground">Nenhum registro.</td></tr>
                ) : filtered.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-accent/30 cursor-pointer transition-colors" onClick={() => { setEditing(r); setOpenForm(true); }}>
                    {listFields.map((f) => (
                      <td key={f.key} className="px-3 py-2.5 max-w-[280px]">{formatCell(r[f.key], f, statusKeys)}</td>
                    ))}
                    <td className="px-3 py-2">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); del(r.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        );

        if (views.length <= 1) {
          return <>{filtersBar}{listView}</>;
        }

        const onItemClick = (r: any) => { setEditing(r); setOpenForm(true); };

        return (
          <Tabs defaultValue={views[0]} className="space-y-3">
            <TabsList>
              {views.includes("list") && <TabsTrigger value="list"><List className="w-4 h-4 mr-1.5" />Lista</TabsTrigger>}
              {views.includes("kanban") && <TabsTrigger value="kanban"><LayoutGrid className="w-4 h-4 mr-1.5" />Kanban</TabsTrigger>}
              {views.includes("dashboard") && <TabsTrigger value="dashboard"><BarChart3 className="w-4 h-4 mr-1.5" />Dashboard</TabsTrigger>}
              {views.includes("timeline") && <TabsTrigger value="timeline"><Clock className="w-4 h-4 mr-1.5" />Timeline</TabsTrigger>}
            </TabsList>

            {views.includes("list") && (
              <TabsContent value="list" className="space-y-3 mt-0">
                {filtersBar}
                {listView}
              </TabsContent>
            )}
            {views.includes("kanban") && (
              <TabsContent value="kanban" className="space-y-3 mt-0">
                {filtersBar}
                <EngKanban
                  rows={filtered}
                  groupKey={kanban?.groupKey ?? "status"}
                  columns={kanban?.columns}
                  titleKey={kanban?.titleKey}
                  subtitleKey={kanban?.subtitleKey}
                  dateKey={kanban?.dateKey}
                  priorityKey={kanban?.priorityKey}
                  onItemClick={onItemClick}
                />
              </TabsContent>
            )}
            {views.includes("dashboard") && (
              <TabsContent value="dashboard" className="space-y-3 mt-0">
                <div className="grid gap-3 md:grid-cols-2">
                  <DistribuicaoCard
                    title={`Distribuição por ${dashboard?.distribuicaoKey ?? "status"}`}
                    rows={filtered}
                    groupKey={dashboard?.distribuicaoKey ?? "status"}
                  />
                  <RankingCard
                    title={`Top ${dashboard?.rankingKey ?? "responsavel"}`}
                    rows={filtered}
                    groupKey={dashboard?.rankingKey ?? "responsavel"}
                  />
                </div>
              </TabsContent>
            )}
            {views.includes("timeline") && (
              <TabsContent value="timeline" className="space-y-3 mt-0">
                {filtersBar}
                <EngTimeline rows={filtered} dateKey={timelineDateKey} onItemClick={onItemClick} />
              </TabsContent>
            )}
          </Tabs>
        );
      })()}

      <Dialog open={openForm} onOpenChange={(o) => { setOpenForm(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{editing?.id ? `Editar ${config.title}` : `Novo ${config.title}`}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3 md:grid-cols-2">
              {config.fields.map((f) => (
                <div key={f.key} className={f.full || f.type === "textarea" ? "md:col-span-2" : ""}>
                  <Label className="text-xs">{f.label}{f.required && " *"}</Label>
                  <FormField field={f} value={editing[f.key]} onChange={(v) => setEditing({ ...editing, [f.key]: v })} />
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EngListPage;
