import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, ShieldAlert, ListChecks, CheckCircle2, AlertTriangle, Building2, DollarSign, TrendingUp, Receipt, Percent } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { KpiCard, KpiGrid } from "./components/KpiCard";
import { StatusBadge } from "./components/StatusBadge";
import { EngPageHeader } from "./components/EngPageHeader";

type Action = {
  id: string;
  ano: number | null; mes: number | null; semana: string | null;
  area: string | null; cliente: string | null;
  ofensor: string | null; causa_raiz: string | null;
  acao: string; resultado_esperado: string | null;
  responsavel: string | null; prazo: string | null;
  status: string | null; prioridade: string | null;
  evidencia: string | null; observacoes: string | null;
};

const STATUS = ["aberta", "em_andamento", "concluida", "cancelada", "atrasada"];
const PRIORIDADES = ["alta", "media", "baixa"];
const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--warn))",
  "hsl(var(--destructive))",
  "hsl(var(--success))",
  "hsl(217 19% 40%)",
  "hsl(181 60% 70%)",
  "hsl(41 90% 70%)",
  "hsl(0 60% 70%)",
];

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

const GovernancaPage = () => {
  const { isAdmin } = useAuth();
  const [actions, setActions] = useState<Action[]>([]);
  const [master, setMaster] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Action | null>(null);
  const [openToAll, setOpenToAll] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterArea, setFilterArea] = useState<string>("all");

  const load = async () => {
    const [{ data: acts }, { data: settings }, { data: m }] = await Promise.all([
      supabase.from("eng_gov_action_plan").select("*").order("created_at", { ascending: false }),
      supabase.from("eng_gov_settings").select("edit_open_to_all").eq("id", true).maybeSingle(),
      supabase.from("eng_governanca_master").select("*").limit(1000),
    ]);
    setActions((acts as any) || []);
    setOpenToAll(!!settings?.edit_open_to_all);
    setMaster((m as any) || []);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return actions.filter((a) =>
      (filterStatus === "all" || a.status === filterStatus) &&
      (filterArea === "all" || a.area === filterArea)
    );
  }, [actions, filterStatus, filterArea]);

  const areas = useMemo(() => Array.from(new Set(actions.map((a) => a.area).filter(Boolean))) as string[], [actions]);

  const stats = useMemo(() => {
    const byStatus = STATUS.map((s) => ({
      name: s.replace(/_/g, " "),
      value: actions.filter((a) => a.status === s).length,
    }));
    const byArea = areas.map((a) => ({ name: a, total: actions.filter((x) => x.area === a).length }));
    const byOfensor = Object.entries(
      actions.reduce<Record<string, number>>((acc, a) => {
        const k = a.ofensor || "—";
        acc[k] = (acc[k] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
    const total = actions.length;
    const concluidas = actions.filter((a) => a.status === "concluida").length;
    const abertas = actions.filter((a) => a.status === "aberta" || a.status === "em_andamento").length;
    const atrasadas = actions.filter((a) => a.status === "atrasada").length;
    return { byStatus, byArea, byOfensor, total, concluidas, atrasadas, abertas };
  }, [actions, areas]);

  const finance = useMemo(() => {
    const sum = (k: string) => master.reduce((a, r) => a + (Number(r[k]) || 0), 0);
    const faturamento = sum("faturamento_total");
    const custoDireto = sum("custo_total_direto_real");
    const custosDiv = sum("custos_diversos_total");
    const resultado = sum("resultado_real");
    const valorIni = sum("valor_inicial");
    const margem = faturamento > 0 ? resultado / faturamento : 0;
    return { faturamento, custoDireto, custosDiv, resultado, valorIni, margem, total: master.length };
  }, [master]);

  const startNew = () => {
    setEditing({
      id: "", ano: new Date().getFullYear(), mes: new Date().getMonth() + 1, semana: null,
      area: "", cliente: "", ofensor: "", causa_raiz: "",
      acao: "", resultado_esperado: "",
      responsavel: "", prazo: null, status: "aberta", prioridade: "media",
      evidencia: "", observacoes: "",
    });
    setEditOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.acao?.trim()) { toast.error("Ação é obrigatória"); return; }
    const payload: any = { ...editing };
    delete payload.id;
    if (!payload.prazo) payload.prazo = null;
    if (editing.id) {
      const { error } = await supabase.from("eng_gov_action_plan").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("eng_gov_action_plan").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Salvo");
    setEditOpen(false);
    setEditing(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Excluir esta ação?")) return;
    const { error } = await supabase.from("eng_gov_action_plan").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const toggleEditOpen = async (v: boolean) => {
    const { error } = await supabase.from("eng_gov_settings").update({ edit_open_to_all: v }).eq("id", true);
    if (error) return toast.error(error.message);
    setOpenToAll(v);
    toast.success("Configuração atualizada");
  };

  return (
    <div className="space-y-5">
      <EngPageHeader
        title="Governança"
        description="Plano de ação, indicadores financeiros e ofensores."
        actions={
          isAdmin && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card">
              <ShieldAlert className="w-4 h-4 text-primary" />
              <Switch checked={openToAll} onCheckedChange={toggleEditOpen} id="open-to-all" />
              <Label htmlFor="open-to-all" className="text-xs cursor-pointer">Edição liberada para todos</Label>
            </div>
          )
        }
      />

      <Tabs defaultValue="financeiro" className="space-y-4">
        <TabsList>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="dashboard">Plano — Visão</TabsTrigger>
          <TabsTrigger value="plano">Plano de Ação</TabsTrigger>
        </TabsList>

        {/* Financeiro */}
        <TabsContent value="financeiro" className="space-y-4">
          {finance.total === 0 ? (
            <Card className="card-elegant p-8 text-center text-muted-foreground">
              Nenhum dado financeiro importado em <code className="font-mono text-xs">eng_governanca_master</code>.
            </Card>
          ) : (
            <>
              <KpiGrid>
                <KpiCard label="Registros" value={finance.total} icon={Building2} tone="teal" hint="linhas no master" />
                <KpiCard label="Valor inicial" value={fmtBRL(finance.valorIni)} icon={Receipt} tone="neutral" />
                <KpiCard label="Faturamento" value={fmtBRL(finance.faturamento)} icon={DollarSign} tone="success" />
                <KpiCard label="Custo direto" value={fmtBRL(finance.custoDireto)} icon={TrendingUp} tone="warn" />
                <KpiCard
                  label="Resultado / Margem"
                  value={fmtBRL(finance.resultado)}
                  icon={Percent}
                  tone={finance.margem >= 0 ? "success" : "danger"}
                  hint={`Margem ${fmtPct(finance.margem)}`}
                />
              </KpiGrid>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="card-elegant">
                  <CardHeader><CardTitle className="font-display text-base">Composição financeira</CardTitle></CardHeader>
                  <CardContent style={{ height: 280 }}>
                    <ResponsiveContainer>
                      <BarChart
                        data={[
                          { name: "Inicial", v: finance.valorIni },
                          { name: "Faturamento", v: finance.faturamento },
                          { name: "Custo direto", v: finance.custoDireto },
                          { name: "Custos diversos", v: finance.custosDiv },
                          { name: "Resultado", v: finance.resultado },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                        <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: any) => fmtBRL(Number(v))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6 }} />
                        <Bar dataKey="v" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="card-elegant">
                  <CardHeader><CardTitle className="font-display text-base">Margem realizada</CardTitle></CardHeader>
                  <CardContent className="flex flex-col items-center justify-center h-[280px] gap-2">
                    <div className={`text-6xl font-display font-bold ${finance.margem >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                      {fmtPct(finance.margem)}
                    </div>
                    <div className="text-sm text-muted-foreground">Resultado / Faturamento</div>
                    <div className="grid grid-cols-2 gap-4 mt-4 w-full max-w-xs">
                      <div className="text-center p-2 rounded bg-muted/50">
                        <div className="text-[10px] uppercase text-muted-foreground">Faturamento</div>
                        <div className="text-sm font-semibold">{fmtBRL(finance.faturamento)}</div>
                      </div>
                      <div className="text-center p-2 rounded bg-muted/50">
                        <div className="text-[10px] uppercase text-muted-foreground">Resultado</div>
                        <div className="text-sm font-semibold">{fmtBRL(finance.resultado)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Dashboard plano */}
        <TabsContent value="dashboard" className="space-y-4">
          <KpiGrid>
            <KpiCard label="Total de ações" value={stats.total} icon={ListChecks} tone="teal" />
            <KpiCard label="Em aberto" value={stats.abertas} icon={ListChecks} tone="warn" />
            <KpiCard label="Concluídas" value={stats.concluidas} icon={CheckCircle2} tone="success" />
            <KpiCard label="Atrasadas" value={stats.atrasadas} icon={AlertTriangle} tone="danger" />
            <KpiCard label="Áreas" value={areas.length} icon={Building2} tone="neutral" />
          </KpiGrid>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="card-elegant">
              <CardHeader><CardTitle className="font-display text-base">Por status</CardTitle></CardHeader>
              <CardContent style={{ height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={stats.byStatus}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <YAxis allowDecimals={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6 }} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="card-elegant">
              <CardHeader><CardTitle className="font-display text-base">Top ofensores</CardTitle></CardHeader>
              <CardContent style={{ height: 260 }}>
                {stats.byOfensor.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados</div>
                ) : (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={stats.byOfensor} dataKey="value" nameKey="name" outerRadius={90} innerRadius={45}>
                        {stats.byOfensor.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Plano de Ação */}
        <TabsContent value="plano" className="space-y-3">
          <Card className="card-elegant p-3">
            <div className="flex items-end gap-2 flex-wrap">
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {STATUS.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Área</Label>
                <Select value={filterArea} onValueChange={setFilterArea}>
                  <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="ml-auto">
                <Button onClick={startNew} className="shadow-elegant"><Plus className="w-4 h-4" /> Nova ação</Button>
              </div>
            </div>
          </Card>

          <Card className="card-elegant overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 border-b">
                <tr>
                  {["Ação", "Área", "Ofensor", "Responsável", "Prazo", "Prioridade", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-3 py-12 text-center text-muted-foreground">Sem ações cadastradas.</td></tr>
                ) : filtered.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-accent/30 cursor-pointer transition-colors" onClick={() => { setEditing(a); setEditOpen(true); }}>
                    <td className="px-3 py-2.5 max-w-md truncate font-medium">{a.acao}</td>
                    <td className="px-3 py-2.5">{a.area || "—"}</td>
                    <td className="px-3 py-2.5">{a.ofensor || "—"}</td>
                    <td className="px-3 py-2.5">{a.responsavel || "—"}</td>
                    <td className="px-3 py-2.5 text-xs">{a.prazo ? new Date(a.prazo).toLocaleDateString("pt-BR") : "—"}</td>
                    <td className="px-3 py-2.5"><StatusBadge value={a.prioridade} /></td>
                    <td className="px-3 py-2.5"><StatusBadge value={a.status} /></td>
                    <td className="px-3 py-2.5">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); del(a.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{editing?.id ? "Editar ação" : "Nova ação"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2"><Label>Ação *</Label><Textarea rows={2} value={editing.acao} onChange={(e) => setEditing({ ...editing, acao: e.target.value })} /></div>
              <div><Label>Área</Label><Input value={editing.area || ""} onChange={(e) => setEditing({ ...editing, area: e.target.value })} /></div>
              <div><Label>Cliente</Label><Input value={editing.cliente || ""} onChange={(e) => setEditing({ ...editing, cliente: e.target.value })} /></div>
              <div><Label>Ofensor</Label><Input value={editing.ofensor || ""} onChange={(e) => setEditing({ ...editing, ofensor: e.target.value })} /></div>
              <div><Label>Causa raiz</Label><Input value={editing.causa_raiz || ""} onChange={(e) => setEditing({ ...editing, causa_raiz: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Resultado esperado</Label><Textarea rows={2} value={editing.resultado_esperado || ""} onChange={(e) => setEditing({ ...editing, resultado_esperado: e.target.value })} /></div>
              <div><Label>Responsável</Label><Input value={editing.responsavel || ""} onChange={(e) => setEditing({ ...editing, responsavel: e.target.value })} /></div>
              <div><Label>Prazo</Label><Input type="date" value={editing.prazo || ""} onChange={(e) => setEditing({ ...editing, prazo: e.target.value })} /></div>
              <div><Label>Status</Label>
                <Select value={editing.status || "aberta"} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Prioridade</Label>
                <Select value={editing.prioridade || "media"} onValueChange={(v) => setEditing({ ...editing, prioridade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORIDADES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Ano</Label><Input type="number" value={editing.ano ?? ""} onChange={(e) => setEditing({ ...editing, ano: e.target.value ? Number(e.target.value) : null })} /></div>
              <div><Label>Mês</Label><Input type="number" min={1} max={12} value={editing.mes ?? ""} onChange={(e) => setEditing({ ...editing, mes: e.target.value ? Number(e.target.value) : null })} /></div>
              <div className="md:col-span-2"><Label>Evidência</Label><Input value={editing.evidencia || ""} onChange={(e) => setEditing({ ...editing, evidencia: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Observações</Label><Textarea rows={2} value={editing.observacoes || ""} onChange={(e) => setEditing({ ...editing, observacoes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GovernancaPage;
