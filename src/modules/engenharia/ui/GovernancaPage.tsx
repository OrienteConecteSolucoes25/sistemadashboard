import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, ShieldAlert } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useAuth } from "@/hooks/useAuth";

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
const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "#16a34a", "#f59e0b", "#6366f1", "#ec4899"];

const GovernancaPage = () => {
  const { isAdmin } = useAuth();
  const [actions, setActions] = useState<Action[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Action | null>(null);
  const [openToAll, setOpenToAll] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterArea, setFilterArea] = useState<string>("all");

  const load = async () => {
    const [{ data: acts }, { data: settings }] = await Promise.all([
      supabase.from("eng_gov_action_plan").select("*").order("created_at", { ascending: false }),
      supabase.from("eng_gov_settings").select("edit_open_to_all").eq("id", true).maybeSingle(),
    ]);
    setActions((acts as any) || []);
    setOpenToAll(!!settings?.edit_open_to_all);
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
    const byStatus = STATUS.map((s) => ({ name: s, value: actions.filter((a) => a.status === s).length }));
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
    const atrasadas = actions.filter((a) => a.status === "atrasada").length;
    return { byStatus, byArea, byOfensor, total, concluidas, atrasadas };
  }, [actions, areas]);

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
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> Governança</h2>
          <p className="text-xs text-muted-foreground">Plano de ação, acompanhamento e indicadores.</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 text-sm">
            <Switch checked={openToAll} onCheckedChange={toggleEditOpen} id="open-to-all" />
            <Label htmlFor="open-to-all" className="text-xs">Edição liberada para todos os usuários</Label>
          </div>
        )}
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="plano">Plano de Ação</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total</div><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Concluídas</div><div className="text-2xl font-bold text-green-600">{stats.concluidas}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Atrasadas</div><div className="text-2xl font-bold text-destructive">{stats.atrasadas}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Áreas envolvidas</div><div className="text-2xl font-bold">{areas.length}</div></CardContent></Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Por Status</CardTitle></CardHeader>
              <CardContent style={{ height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={stats.byStatus}>
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis allowDecimals={false} fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Top Ofensores</CardTitle></CardHeader>
              <CardContent style={{ height: 260 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={stats.byOfensor} dataKey="value" nameKey="name" outerRadius={90} label>
                      {stats.byOfensor.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plano" className="space-y-3 mt-4">
          <div className="flex items-end gap-2 flex-wrap">
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Área</Label>
              <Select value={filterArea} onValueChange={setFilterArea}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="ml-auto">
              <Button onClick={startNew}><Plus className="w-4 h-4 mr-1" /> Nova ação</Button>
            </div>
          </div>

          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2">Ação</th>
                  <th className="text-left px-3 py-2">Área</th>
                  <th className="text-left px-3 py-2">Ofensor</th>
                  <th className="text-left px-3 py-2">Responsável</th>
                  <th className="text-left px-3 py-2">Prazo</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">Sem ações cadastradas.</td></tr>
                ) : filtered.map((a) => (
                  <tr key={a.id} className="border-t hover:bg-accent/40 cursor-pointer" onClick={() => { setEditing(a); setEditOpen(true); }}>
                    <td className="px-3 py-2 max-w-md truncate">{a.acao}</td>
                    <td className="px-3 py-2">{a.area || "—"}</td>
                    <td className="px-3 py-2">{a.ofensor || "—"}</td>
                    <td className="px-3 py-2">{a.responsavel || "—"}</td>
                    <td className="px-3 py-2">{a.prazo || "—"}</td>
                    <td className="px-3 py-2"><Badge variant={a.status === "concluida" ? "default" : a.status === "atrasada" ? "destructive" : "secondary"}>{a.status}</Badge></td>
                    <td className="px-3 py-2">
                      <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); del(a.id); }}><Trash2 className="w-4 h-4" /></Button>
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
          <DialogHeader><DialogTitle>{editing?.id ? "Editar ação" : "Nova ação"}</DialogTitle></DialogHeader>
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
                  <SelectContent>{STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
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
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GovernancaPage;
