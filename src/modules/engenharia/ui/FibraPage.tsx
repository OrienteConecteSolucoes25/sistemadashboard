import { useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus, Pencil, Trash2, Download, Upload, FileDown, Search, Cable, MapPin,
  TrendingUp, CheckCircle2, List, BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { useFibraChecklists } from "../hooks/useFibraChecklists";
import {
  ENTREGA_OPTIONS, PADRAO_LABEL, PROCESSOS_POR_PADRAO, STATUS_GERAL_OPTIONS,
  buildDefaultItems, downloadFibraTemplate, exportFibraChecklists, parseFibraExcel,
  progressoPorPadrao, type FibraChecklist, type FibraChecklistItem, type Padrao,
} from "../lib/fibraChecklist";
import { fmtDate } from "../lib/storage";
import { EngPageHeader } from "./components/EngPageHeader";
import { KpiCard, KpiGrid } from "./components/KpiCard";
import { DistribuicaoCard, RankingCard } from "./components/EngMiniCharts";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";

const ALL = "__all__";

function Editor({ checklist, items, onClose, onSaved }: {
  checklist: FibraChecklist; items: FibraChecklistItem[];
  onClose: () => void; onSaved: () => void;
}) {
  const [c, setC] = useState<FibraChecklist>(checklist);
  const [its, setIts] = useState<FibraChecklistItem[]>(items);
  const [saving, setSaving] = useState(false);
  const [openPad, setOpenPad] = useState<Record<Padrao, boolean>>({ CLARO: true, SEINFRA: true, COELBA: true });

  const updateItem = (id: string, patch: Partial<FibraChecklistItem>) => {
    setIts((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const save = async () => {
    setSaving(true);
    const { error: e1 } = await supabase.from("eng_fibra_checklists").update({
      cidade: c.cidade, km: c.km, cliente: c.cliente, uf: c.uf,
      responsavel_geral: c.responsavel_geral, status_geral: c.status_geral, observacoes: c.observacoes,
    }).eq("id", c.id);
    if (e1) { toast.error(e1.message); setSaving(false); return; }
    for (const it of its) {
      await supabase.from("eng_fibra_checklist_items").update({
        data_inicio: it.data_inicio, data_final: it.data_final,
        responsavel: it.responsavel, entrega_final: it.entrega_final, observacao: it.observacao,
      }).eq("id", it.id);
    }
    setSaving(false);
    toast.success("Checklist salvo");
    onSaved();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">Checklist — {c.cidade || "Sem cidade"}</DialogTitle></DialogHeader>

        <div className="grid gap-3 md:grid-cols-3">
          <div><Label>Cidade</Label><Input value={c.cidade || ""} onChange={(e) => setC({ ...c, cidade: e.target.value })} /></div>
          <div><Label>KM</Label><Input value={c.km || ""} onChange={(e) => setC({ ...c, km: e.target.value })} /></div>
          <div><Label>UF</Label><Input value={c.uf || ""} onChange={(e) => setC({ ...c, uf: e.target.value })} /></div>
          <div><Label>Cliente</Label><Input value={c.cliente || ""} onChange={(e) => setC({ ...c, cliente: e.target.value })} /></div>
          <div><Label>Responsável</Label><Input value={c.responsavel_geral || ""} onChange={(e) => setC({ ...c, responsavel_geral: e.target.value })} /></div>
          <div>
            <Label>Status geral</Label>
            <Select value={c.status_geral || undefined} onValueChange={(v) => setC({ ...c, status_geral: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{STATUS_GERAL_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3"><Label>Observações</Label><Textarea value={c.observacoes || ""} onChange={(e) => setC({ ...c, observacoes: e.target.value })} /></div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 mt-4">
          {(Object.keys(PROCESSOS_POR_PADRAO) as Padrao[]).map((p) => (
            <Card key={p} className="kpi-teal">
              <CardContent className="pt-3">
                <div className="text-xs text-muted-foreground">{PADRAO_LABEL[p]}</div>
                <div className="text-2xl font-display font-semibold">{progressoPorPadrao(its, p)}%</div>
                <Progress value={progressoPorPadrao(its, p)} className="h-2 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-3 mt-4">
          {(Object.keys(PROCESSOS_POR_PADRAO) as Padrao[]).map((padrao) => {
            const list = its.filter((i) => i.padrao === padrao).sort((a, b) => a.ordem - b.ordem);
            return (
              <Card key={padrao}>
                <CardContent className="pt-4">
                  <button onClick={() => setOpenPad({ ...openPad, [padrao]: !openPad[padrao] })}
                    className="w-full text-left font-display font-semibold mb-2">
                    {PADRAO_LABEL[padrao]} ({list.length})
                  </button>
                  {openPad[padrao] && (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Processo</TableHead>
                            <TableHead className="w-32">Início</TableHead>
                            <TableHead className="w-32">Final</TableHead>
                            <TableHead className="w-40">Responsável</TableHead>
                            <TableHead className="w-36">Entrega</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {list.map((it) => (
                            <TableRow key={it.id}>
                              <TableCell className="text-xs">{it.processo}</TableCell>
                              <TableCell><Input type="date" value={it.data_inicio || ""} onChange={(e) => updateItem(it.id, { data_inicio: e.target.value || null })} /></TableCell>
                              <TableCell><Input type="date" value={it.data_final || ""} onChange={(e) => updateItem(it.id, { data_final: e.target.value || null })} /></TableCell>
                              <TableCell><Input value={it.responsavel || ""} onChange={(e) => updateItem(it.id, { responsavel: e.target.value })} /></TableCell>
                              <TableCell>
                                <Select value={it.entrega_final || "-"} onValueChange={(v) => updateItem(it.id, { entrega_final: v })}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>{ENTREGA_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar tudo"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const FibraPage = () => {
  const { checklists, itemsByChecklist, loading, refetch } = useFibraChecklists();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busca, setBusca] = useState("");
  const [fUf, setFUf] = useState(ALL);
  const [editing, setEditing] = useState<FibraChecklist | null>(null);
  const [openNew, setOpenNew] = useState(false);
  const [novo, setNovo] = useState({ cidade: "", km: "", uf: "", cliente: "", responsavel_geral: "" });

  const filtered = useMemo(() => checklists.filter((c) => {
    if (fUf !== ALL && c.uf !== fUf) return false;
    if (busca.trim()) {
      const q = busca.toLowerCase();
      const hay = [c.cidade, c.km, c.cliente, c.uf, c.responsavel_geral].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [checklists, busca, fUf]);

  const ufs = useMemo(() => Array.from(new Set(checklists.map((c) => c.uf).filter(Boolean) as string[])), [checklists]);

  const criar = async () => {
    if (!novo.cidade) { toast.error("Cidade é obrigatória"); return; }
    const { data: cl, error } = await supabase.from("eng_fibra_checklists").insert({
      cidade: novo.cidade, km: novo.km || null, uf: novo.uf || null,
      cliente: novo.cliente || null, responsavel_geral: novo.responsavel_geral || null,
      status_geral: "planejado",
    }).select().single();
    if (error || !cl) { toast.error(error?.message || "Falha"); return; }
    const items = buildDefaultItems(cl.id);
    const { error: e2 } = await supabase.from("eng_fibra_checklist_items").insert(items);
    if (e2) toast.error(e2.message);
    toast.success(`Checklist criado com ${items.length} itens`);
    setOpenNew(false);
    setNovo({ cidade: "", km: "", uf: "", cliente: "", responsavel_geral: "" });
    refetch();
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir checklist e seus itens?")) return;
    await supabase.from("eng_fibra_checklist_items").delete().eq("checklist_id", id);
    await supabase.from("eng_fibra_checklists").delete().eq("id", id);
    toast.success("Excluído");
    refetch();
  };

  const importar = async (file: File) => {
    try {
      const parsed = await parseFibraExcel(file);
      const { data: cl, error } = await supabase.from("eng_fibra_checklists").insert({
        cidade: parsed.cidade, km: parsed.km || null, status_geral: "planejado",
      }).select().single();
      if (error || !cl) { toast.error(error?.message || "Falha"); return; }
      const items = parsed.itens.map((i, idx) => ({
        checklist_id: cl.id, padrao: i.padrao, processo: i.processo, ordem: idx,
        data_inicio: i.data_inicio, data_final: i.data_final,
        responsavel: i.responsavel, entrega_final: i.entrega_final, observacao: null,
      }));
      if (items.length) await supabase.from("eng_fibra_checklist_items").insert(items);
      toast.success(`Importado: ${parsed.cidade} (${items.length} itens)`);
      refetch();
    } catch (e) {
      toast.error("Falha", { description: String((e as Error).message ?? e) });
    }
  };

  const avgPad = (p: Padrao) => {
    if (filtered.length === 0) return 0;
    const sum = filtered.reduce((a, c) => a + progressoPorPadrao(itemsByChecklist[c.id] ?? [], p), 0);
    return Math.round(sum / filtered.length);
  };

  const ufChartData = ufs.map((u) => ({ uf: u, count: checklists.filter((c) => c.uf === u).length }));

  const filtersBar = (
    <Card className="card-elegant p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setOpenNew(true)} className="shadow-elegant"><Plus className="h-4 w-4 mr-1" />Novo checklist</Button>
        <Button variant="outline" onClick={downloadFibraTemplate}><FileDown className="h-4 w-4 mr-1" />Modelo</Button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) { importar(f); e.currentTarget.value = ""; } }} />
        <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4 mr-1" />Importar</Button>
        <Button variant="outline" onClick={() => exportFibraChecklists(filtered, itemsByChecklist)}>
          <Download className="h-4 w-4 mr-1" />Exportar
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8 w-56 h-9" placeholder="Buscar…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <Select value={fUf} onValueChange={setFUf}>
            <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>UF: todos</SelectItem>
              {ufs.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
          <Badge variant="secondary">{filtered.length} de {checklists.length}</Badge>
        </div>
      </div>
    </Card>
  );

  const listView = (
    <Card className="card-elegant overflow-x-auto">
      {loading ? <div className="text-center py-8 text-muted-foreground">Carregando…</div>
        : filtered.length === 0 ? <div className="text-center py-8 text-muted-foreground">Nenhum checklist.</div>
        : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead>Cidade</TableHead>
                <TableHead>UF</TableHead>
                <TableHead>KM</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>CLARO</TableHead>
                <TableHead>SEINFRA</TableHead>
                <TableHead>COELBA</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const items = itemsByChecklist[c.id] ?? [];
                const pclaro = progressoPorPadrao(items, "CLARO");
                const psein = progressoPorPadrao(items, "SEINFRA");
                const pcoel = progressoPorPadrao(items, "COELBA");
                const pctClass = (n: number) =>
                  n >= 80 ? "border-[hsl(var(--success))]/40 text-[hsl(var(--success))]"
                  : n >= 40 ? "border-primary/40 text-primary"
                  : "border-[hsl(var(--warn))]/40 text-[hsl(var(--warn))]";
                return (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-accent/30" onClick={() => setEditing(c)}>
                    <TableCell className="font-medium">{c.cidade || "—"}</TableCell>
                    <TableCell>{c.uf ? <Badge variant="outline" className="text-[10px]">{c.uf}</Badge> : "—"}</TableCell>
                    <TableCell className="text-xs">{c.km || "—"}</TableCell>
                    <TableCell>{c.cliente || "—"}</TableCell>
                    <TableCell className="text-xs">{c.responsavel_geral || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className={pctClass(pclaro)}>{pclaro}%</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={pctClass(psein)}>{psein}%</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={pctClass(pcoel)}>{pcoel}%</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(c.updated_at)}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => excluir(c.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
    </Card>
  );

  return (
    <div className="space-y-4">
      <EngPageHeader
        title="Fibra — Checklist Projeto Executivo"
        description="Padrões CLARO / SEINFRA-DNIT / COELBA por obra."
      />

      <KpiGrid>
        <KpiCard label="Obras" value={checklists.length} icon={Cable} tone="teal" />
        <KpiCard label="UFs" value={ufs.length} icon={MapPin} tone="neutral" />
        <KpiCard label="CLARO médio" value={`${avgPad("CLARO")}%`} icon={TrendingUp} tone="teal" />
        <KpiCard label="SEINFRA médio" value={`${avgPad("SEINFRA")}%`} icon={TrendingUp} tone="warn" />
        <KpiCard label="COELBA médio" value={`${avgPad("COELBA")}%`} icon={CheckCircle2} tone="success" />
      </KpiGrid>

      <Tabs defaultValue="list" className="space-y-3">
        <TabsList>
          <TabsTrigger value="list"><List className="w-4 h-4 mr-1.5" />Lista</TabsTrigger>
          <TabsTrigger value="dashboard"><BarChart3 className="w-4 h-4 mr-1.5" />Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-3 mt-0">
          {filtersBar}
          {listView}
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-3 mt-0">
          <div className="grid gap-3 md:grid-cols-2">
            <Card className="card-elegant p-4">
              <div className="text-sm font-display font-semibold mb-3">Progresso médio por padrão</div>
              <div style={{ height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={[
                    { name: "CLARO", value: avgPad("CLARO"), fill: "hsl(var(--primary))" },
                    { name: "SEINFRA", value: avgPad("SEINFRA"), fill: "hsl(var(--warn))" },
                    { name: "COELBA", value: avgPad("COELBA"), fill: "hsl(var(--success))" },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {[0, 1, 2].map((i) => (
                        <Cell key={i} fill={["hsl(var(--primary))", "hsl(var(--warn))", "hsl(var(--success))"][i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="card-elegant p-4">
              <div className="text-sm font-display font-semibold mb-3">Obras por UF</div>
              <div style={{ height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={ufChartData} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="uf" type="category" tick={{ fontSize: 10 }} width={36} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <DistribuicaoCard title="Status geral das obras" rows={filtered as any} groupKey="status_geral" />
            <RankingCard title="Top responsáveis" rows={filtered as any} groupKey="responsavel_geral" />
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Novo checklist</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Cidade *</Label><Input value={novo.cidade} onChange={(e) => setNovo({ ...novo, cidade: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>KM</Label><Input value={novo.km} onChange={(e) => setNovo({ ...novo, km: e.target.value })} /></div>
              <div><Label>UF</Label><Input value={novo.uf} onChange={(e) => setNovo({ ...novo, uf: e.target.value.toUpperCase() })} /></div>
            </div>
            <div><Label>Cliente</Label><Input value={novo.cliente} onChange={(e) => setNovo({ ...novo, cliente: e.target.value })} /></div>
            <div><Label>Responsável</Label><Input value={novo.responsavel_geral} onChange={(e) => setNovo({ ...novo, responsavel_geral: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={criar}>Criar com itens default</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {editing && (
        <Editor
          checklist={editing}
          items={itemsByChecklist[editing.id] ?? []}
          onClose={() => setEditing(null)}
          onSaved={refetch}
        />
      )}
    </div>
  );
};

export default FibraPage;
