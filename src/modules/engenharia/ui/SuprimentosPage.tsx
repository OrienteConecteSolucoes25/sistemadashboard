import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus, Pencil, Trash2, Search, FileText, X, ShoppingCart, AlertTriangle,
  CheckCircle2, CalendarClock, List, LayoutGrid, BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { fmtDate } from "../lib/storage";
import { SCRC_STATUS, listScRcBySolicit, createScRc, updateScRcStatus, deleteScRcMany, type ScRcRow } from "../lib/scrcStore";
import { EngPageHeader } from "./components/EngPageHeader";
import { KpiCard, KpiGrid } from "./components/KpiCard";
import { StatusBadge } from "./components/StatusBadge";
import { EngKanban } from "./components/EngKanban";
import { DistribuicaoCard, RankingCard } from "./components/EngMiniCharts";

interface Solicit {
  id: string;
  numero: string | null;
  descricao: string | null;
  status: string | null;
  prioridade?: string | null;
  solicitante: string | null;
  responsavel: string | null;
  prazo: string | null;
  itens: any;
  data: any;
  created_at: string;
  updated_at: string;
}

const STATUS_SOL = ["aberta", "em_cotacao", "comprada", "recebida", "cancelada"];
const ALL = "__all__";

function ScRcPanel({ solicitId, onClose }: { solicitId: string; onClose: () => void }) {
  const [rows, setRows] = useState<ScRcRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [novo, setNovo] = useState({ tipo_documento: "SC", numero_documento: "", categoria: "", conta_financeira: "", centro_custo: "", observacao: "", status: "SOLICITADO" });

  const load = async () => {
    setLoading(true);
    try { setRows(await listScRcBySolicit([solicitId])); } catch (e) { toast.error(String(e)); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [solicitId]);

  const adicionar = async () => {
    if (!novo.numero_documento) { toast.error("Número do documento é obrigatório"); return; }
    try {
      await createScRc({ ...novo, solicit_id: solicitId });
      toast.success("Documento adicionado");
      setNovo({ tipo_documento: "SC", numero_documento: "", categoria: "", conta_financeira: "", centro_custo: "", observacao: "", status: "SOLICITADO" });
      load();
    } catch (e) { toast.error(String(e)); }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />SC / RC vinculados</DialogTitle></DialogHeader>

        <Card className="card-elegant">
          <CardContent className="pt-4 grid gap-2 md:grid-cols-7 items-end">
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={novo.tipo_documento} onValueChange={(v) => setNovo({ ...novo, tipo_documento: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="SC">SC</SelectItem><SelectItem value="RC">RC</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2"><Label className="text-xs">Nº documento *</Label><Input value={novo.numero_documento} onChange={(e) => setNovo({ ...novo, numero_documento: e.target.value })} /></div>
            <div><Label className="text-xs">Categoria</Label><Input value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })} /></div>
            <div><Label className="text-xs">Conta fin.</Label><Input value={novo.conta_financeira} onChange={(e) => setNovo({ ...novo, conta_financeira: e.target.value })} /></div>
            <div><Label className="text-xs">Centro custo</Label><Input value={novo.centro_custo} onChange={(e) => setNovo({ ...novo, centro_custo: e.target.value })} /></div>
            <Button onClick={adicionar}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
          </CardContent>
        </Card>

        <Card className="card-elegant mt-2">
          <CardContent className="pt-4 overflow-x-auto">
            {loading ? <div className="text-center py-6 text-muted-foreground">Carregando…</div>
              : rows.length === 0 ? <div className="text-center py-6 text-muted-foreground">Nenhum SC/RC vinculado.</div>
              : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 border-b">
                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2">Tipo</th><th className="px-3 py-2">Nº</th>
                      <th className="px-3 py-2">Categoria</th><th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Criado</th><th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="px-3 py-2"><Badge variant={r.tipo_documento === "SC" ? "default" : "secondary"}>{r.tipo_documento}</Badge></td>
                        <td className="px-3 py-2 font-medium">{r.numero_documento}</td>
                        <td className="px-3 py-2 text-xs">{r.categoria || "—"}</td>
                        <td className="px-3 py-2">
                          <Select value={r.status || "SOLICITADO"} onValueChange={async (v) => {
                            try { await updateScRcStatus(r.id, v); toast.success("Status atualizado"); load(); } catch (e) { toast.error(String(e)); }
                          }}>
                            <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue /></SelectTrigger>
                            <SelectContent>{SCRC_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{fmtDate(r.created_at)}</td>
                        <td className="px-3 py-2 text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => {
                            if (confirm("Excluir?")) { await deleteScRcMany([r.id]); load(); }
                          }}><Trash2 className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </CardContent>
        </Card>

        <DialogFooter><Button variant="outline" onClick={onClose}><X className="h-4 w-4 mr-1" />Fechar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const SuprimentosPage = () => {
  const [rows, setRows] = useState<Solicit[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [fStatus, setFStatus] = useState(ALL);
  const [scrcCounts, setScrcCounts] = useState<Record<string, number>>({});

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Solicit | null>(null);
  const empty: Solicit = {
    id: "", numero: "", descricao: "", status: "aberta", prioridade: "",
    solicitante: "", responsavel: "", prazo: null, itens: [], data: {},
    created_at: "", updated_at: "",
  };
  const [form, setForm] = useState<Solicit>(empty);

  const [scrcOpen, setScrcOpen] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("eng_suprimentos").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    const list = (data || []) as Solicit[];
    setRows(list);
    if (list.length) {
      const ids = list.map((r) => r.id);
      const { data: scrc } = await supabase.from("eng_solicitacao_sc_rc").select("solicit_id").in("solicit_id", ids);
      const cnt: Record<string, number> = {};
      (scrc || []).forEach((r: any) => { cnt[r.solicit_id] = (cnt[r.solicit_id] || 0) + 1; });
      setScrcCounts(cnt);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    if (fStatus !== ALL && r.status !== fStatus) return false;
    if (busca.trim()) {
      const q = busca.toLowerCase();
      const hay = [r.numero, r.descricao, r.solicitante, r.responsavel, r.status].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [rows, busca, fStatus]);

  const isOverdue = (d: string | null) => d && new Date(d) < new Date(new Date().toDateString());
  const cnt = (st: string) => rows.filter((x) => String(x.status).toLowerCase() === st).length;

  const openNew = () => { setForm({ ...empty }); setEditing(null); setOpen(true); };
  const openEdit = (r: Solicit) => { setForm({ ...r }); setEditing(r); setOpen(true); };

  const save = async () => {
    if (!form.descricao && !form.numero) { toast.error("Informe número ou descrição"); return; }
    const payload = {
      numero: form.numero || null, descricao: form.descricao || null,
      status: form.status, solicitante: form.solicitante || null,
      responsavel: form.responsavel || null, prazo: form.prazo || null,
      data: form.data || {}, itens: form.itens || [],
    };
    if (editing) {
      const { error } = await supabase.from("eng_suprimentos").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Atualizado");
    } else {
      const { error } = await supabase.from("eng_suprimentos").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Criado");
    }
    setOpen(false);
    load();
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir solicitação?")) return;
    await supabase.from("eng_solicitacao_sc_rc").delete().eq("solicit_id", id);
    const { error } = await supabase.from("eng_suprimentos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluída");
    load();
  };

  const filtersBar = (
    <Card className="card-elegant p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={openNew} className="shadow-elegant"><Plus className="h-4 w-4 mr-1" />Nova solicitação</Button>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8 w-56 h-9" placeholder="Buscar…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Status: todos</SelectItem>
              {STATUS_SOL.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Badge variant="secondary">{filtered.length} de {rows.length}</Badge>
        </div>
      </div>
    </Card>
  );

  const listView = (
    <Card className="card-elegant overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 border-b">
          <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2.5">Nº</th><th className="px-3 py-2.5">Descrição</th>
            <th className="px-3 py-2.5">Solicitante</th><th className="px-3 py-2.5">Responsável</th>
            <th className="px-3 py-2.5">Prazo</th><th className="px-3 py-2.5">Status</th>
            <th className="px-3 py-2.5">SC/RC</th><th className="px-3 py-2.5 w-20"></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={8} className="px-3 py-12 text-center text-muted-foreground">Carregando…</td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={8} className="px-3 py-12 text-center text-muted-foreground">Nenhuma solicitação.</td></tr>
          ) : filtered.map((r) => (
            <tr key={r.id} className="border-b last:border-0 hover:bg-accent/30 cursor-pointer transition-colors" onClick={() => openEdit(r)}>
              <td className="px-3 py-2.5 font-medium">{r.numero || "—"}</td>
              <td className="px-3 py-2.5 max-w-[280px] truncate text-muted-foreground">{r.descricao || "—"}</td>
              <td className="px-3 py-2.5">{r.solicitante || "—"}</td>
              <td className="px-3 py-2.5">{r.responsavel || "—"}</td>
              <td className={`px-3 py-2.5 ${isOverdue(r.prazo) && !["concluida", "comprada", "recebida", "cancelada"].includes(String(r.status)) ? "text-destructive font-medium" : ""}`}>{fmtDate(r.prazo)}</td>
              <td className="px-3 py-2.5"><StatusBadge value={r.status} /></td>
              <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="outline" className="h-7" onClick={() => setScrcOpen(r.id)}>
                  <FileText className="h-3.5 w-3.5 mr-1" /> {scrcCounts[r.id] || 0}
                </Button>
              </td>
              <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => excluir(r.id)}><Trash2 className="h-4 w-4" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );

  return (
    <div className="space-y-4">
      <EngPageHeader
        title="Suprimentos"
        description="Solicitações de compra (SC) e requisições (RC) por demanda."
      />

      <KpiGrid>
        <KpiCard label="Total" value={rows.length} icon={ShoppingCart} tone="teal" />
        <KpiCard label="Abertas" value={cnt("aberta")} icon={CalendarClock} tone="warn" />
        <KpiCard label="Em cotação" value={cnt("em_cotacao")} icon={CalendarClock} tone="teal" />
        <KpiCard label="Recebidas" value={cnt("recebida")} icon={CheckCircle2} tone="success" />
        <KpiCard label="Atrasadas" value={rows.filter((r) => isOverdue(r.prazo) && !["recebida", "cancelada", "comprada"].includes(String(r.status))).length} icon={AlertTriangle} tone="danger" />
      </KpiGrid>

      <Tabs defaultValue="list" className="space-y-3">
        <TabsList>
          <TabsTrigger value="list"><List className="w-4 h-4 mr-1.5" />Lista</TabsTrigger>
          <TabsTrigger value="kanban"><LayoutGrid className="w-4 h-4 mr-1.5" />Kanban</TabsTrigger>
          <TabsTrigger value="dashboard"><BarChart3 className="w-4 h-4 mr-1.5" />Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-3 mt-0">
          {filtersBar}
          {listView}
        </TabsContent>

        <TabsContent value="kanban" className="space-y-3 mt-0">
          {filtersBar}
          <EngKanban
            rows={filtered}
            groupKey="status"
            columns={STATUS_SOL}
            titleKey="numero"
            subtitleKey="responsavel"
            dateKey="prazo"
            onItemClick={openEdit}
          />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-3 mt-0">
          <div className="grid gap-3 md:grid-cols-2">
            <DistribuicaoCard title="Distribuição por status" rows={filtered} groupKey="status" />
            <RankingCard title="Top responsáveis (compras)" rows={filtered} groupKey="responsavel" />
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">{editing ? "Editar solicitação" : "Nova solicitação"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label className="text-xs">Número</Label><Input value={form.numero || ""} onChange={(e) => setForm({ ...form, numero: e.target.value })} /></div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status || "aberta"} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_SOL.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Solicitante</Label><Input value={form.solicitante || ""} onChange={(e) => setForm({ ...form, solicitante: e.target.value })} /></div>
            <div><Label className="text-xs">Responsável</Label><Input value={form.responsavel || ""} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} /></div>
            <div><Label className="text-xs">Prazo</Label><Input type="date" value={form.prazo || ""} onChange={(e) => setForm({ ...form, prazo: e.target.value || null })} /></div>
            <div className="md:col-span-2"><Label className="text-xs">Descrição</Label><Textarea rows={3} value={form.descricao || ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {scrcOpen && <ScRcPanel solicitId={scrcOpen} onClose={() => { setScrcOpen(null); load(); }} />}
    </div>
  );
};

export default SuprimentosPage;
