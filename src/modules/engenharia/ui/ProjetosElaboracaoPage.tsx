import { useMemo, useState } from "react";
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
  Plus, Pencil, Trash2, Download, Upload, FileDown, Search, ExternalLink,
  FolderKanban, CheckCircle2, AlertTriangle, CalendarClock, TrendingUp,
  List, LayoutGrid, BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { useProjetos, type Projeto } from "../hooks/useProjetos";
import {
  emptyProjeto, computeDerived, rowToProjeto, projetoToExportRow, PROJETO_HEADERS,
  DEF_CLIENTES, DEF_ESCOPOS_GENERICOS, DEF_PROJETISTAS, DEF_SOLICITANTES,
  DEF_STATUS, DEF_LOCAL, DEF_PRIORIDADE, UFS,
} from "../lib/projetosImport";
import { exportXlsx, downloadTemplate, readXlsxFile, fmtDate, uid } from "../lib/storage";
import { EngPageHeader } from "./components/EngPageHeader";
import { KpiCard, KpiGrid } from "./components/KpiCard";
import { makeEditKeyHandler } from "../lib/keyboardEdit";
import { StatusBadge } from "./components/StatusBadge";
import { EngKanban } from "./components/EngKanban";
import { DistribuicaoCard, RankingCard } from "./components/EngMiniCharts";

const ALL = "__all__";

function SelectFree({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <div className="flex gap-1">
      <Select value={value || undefined} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
        <SelectTrigger className="flex-1"><SelectValue placeholder={placeholder || "Selecione"} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">—</SelectItem>
          {options.filter(Boolean).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input className="w-32" placeholder="Outro…" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-36"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{label}: todos</SelectItem>
        {options.filter(Boolean).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

const ProjetosElaboracaoPage = () => {
  const { items, ready, insertOne, insertMany, updateOne, deleteOne } = useProjetos();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Projeto>(emptyProjeto());

  const [busca, setBusca] = useState("");
  const [fCliente, setFCliente] = useState(ALL);
  const [fStatus, setFStatus] = useState(ALL);
  const [fProj, setFProj] = useState(ALL);
  const [fUf, setFUf] = useState(ALL);

  const filtered = useMemo(() => items.filter((i) => {
    if (fCliente !== ALL && i.cliente !== fCliente) return false;
    if (fStatus !== ALL && i.status !== fStatus) return false;
    if (fProj !== ALL && i.projetista !== fProj) return false;
    if (fUf !== ALL && i.uf !== fUf) return false;
    if (busca.trim()) {
      const q = busca.toLowerCase();
      const hay = [i.cliente, i.site, i.cidade, i.uf, i.responsavel_solicitante,
        i.projetista, i.escopo_generico, i.escopo, i.descricao, i.status, i.observacao]
        .filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [items, busca, fCliente, fStatus, fProj, fUf]);

  const optionsCliente = useMemo(() => Array.from(new Set([...DEF_CLIENTES, ...items.map((i) => i.cliente).filter(Boolean)])), [items]);
  const optionsProj = useMemo(() => Array.from(new Set([...DEF_PROJETISTAS, ...items.map((i) => i.projetista).filter(Boolean)])), [items]);
  const optionsEscopo = useMemo(() => Array.from(new Set([...DEF_ESCOPOS_GENERICOS, ...items.map((i) => i.escopo_generico).filter(Boolean)])), [items]);
  const optionsSolic = useMemo(() => Array.from(new Set([...DEF_SOLICITANTES, ...items.map((i) => i.responsavel_solicitante).filter(Boolean)])), [items]);

  const openNew = () => { setForm(emptyProjeto()); setEditId(null); setOpen(true); };
  const openEdit = (p: Projeto) => { setForm({ ...p }); setEditId(p.id); setOpen(true); };

  const save = async () => {
    if (!form.cliente || !form.site) { toast.error("Cliente e Site são obrigatórios"); return; }
    const finalForm = computeDerived(form);
    if (editId) {
      const ok = await updateOne(editId, finalForm);
      if (ok) toast.success("Projeto atualizado"); else toast.error("Falha ao atualizar");
    } else {
      const created = await insertOne(finalForm);
      if (created) toast.success("Projeto adicionado"); else toast.error("Falha ao salvar");
    }
    setOpen(false); setEditId(null);
  };

  const doDelete = async (id: string) => {
    if (!confirm("Excluir projeto?")) return;
    const ok = await deleteOne(id);
    if (ok) toast.success("Projeto excluído"); else toast.error("Falha ao excluir");
  };

  const doImport = async (file: File) => {
    try {
      const rows = await readXlsxFile(file, { expectedHeaders: [...PROJETO_HEADERS] });
      if (!rows.length) { toast.error("Planilha vazia"); return; }
      const mapped: Projeto[] = rows
        .filter((r) => Object.values(r).some((v) => v != null && String(v).trim() !== ""))
        .map((r) => computeDerived(rowToProjeto(r as Record<string, unknown>, uid())))
        .filter((p) => (p.cliente || p.site) && (p.site || p.descricao || p.escopo));
      if (!mapped.length) { toast.error("Nenhuma linha válida"); return; }
      const n = await insertMany(mapped);
      toast.success(`${n} projeto(s) importado(s)`);
    } catch (e) {
      toast.error("Falha na importação", { description: String((e as Error).message ?? e) });
    }
  };

  const doExport = () => {
    if (!filtered.length) { toast.error("Nada para exportar"); return; }
    exportXlsx(filtered.map(projetoToExportRow), `projetos-${new Date().toISOString().slice(0, 10)}.xlsx`, "Projetos");
  };

  // KPIs
  const total = items.length;
  const concluidos = items.filter((p) => /concl/i.test(p.status)).length;
  const emAndamento = items.filter((p) => /andamento/i.test(p.status)).length;
  const naoIniciada = items.filter((p) => /n[aã]o\s*inicia/i.test(p.status)).length;
  const foraPrazo = items.filter((p) => p.dentro_prazo === "FORA").length;
  const dentroPrazo = items.filter((p) => p.dentro_prazo === "DENTRO").length;
  const taxaSucesso = (dentroPrazo + foraPrazo) > 0 ? Math.round((dentroPrazo / (dentroPrazo + foraPrazo)) * 100) : 0;

  // Kanban groups (status uppercase)
  const kanbanRows = filtered.map((p) => ({ ...p, status: (p.status || "NÃO INICIADA").toUpperCase() }));
  const kanbanCols = ["NÃO INICIADA", "EM ANDAMENTO", "ON HOLD", "CONCLUÍDO", "CANCELADA"];

  const filtersBar = (
    <Card className="card-elegant p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={openNew} className="shadow-elegant"><Plus className="h-4 w-4 mr-1" />Novo projeto</Button>
        <Button variant="outline" onClick={() => downloadTemplate([...PROJETO_HEADERS], "modelo-projetos.xlsx")}>
          <FileDown className="h-4 w-4 mr-1" />Modelo
        </Button>
        <label>
          <input type="file" accept=".xlsx,.xls" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { doImport(f); e.currentTarget.value = ""; } }} />
          <span className="inline-flex items-center gap-1 h-9 px-3 rounded-md border bg-background text-sm cursor-pointer hover:bg-muted">
            <Upload className="h-4 w-4" /> Importar
          </span>
        </label>
        <Button variant="outline" onClick={doExport}><Download className="h-4 w-4 mr-1" />Exportar</Button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8 w-56 h-9" placeholder="Buscar…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <Filter label="Cliente" value={fCliente} onChange={setFCliente} options={optionsCliente} />
          <Filter label="Status" value={fStatus} onChange={setFStatus} options={DEF_STATUS} />
          <Filter label="Projetista" value={fProj} onChange={setFProj} options={optionsProj} />
          <Filter label="UF" value={fUf} onChange={setFUf} options={UFS} />
          <Badge variant="secondary">{filtered.length} de {items.length}</Badge>
        </div>
      </div>
    </Card>
  );

  const listView = (
    <Card className="card-elegant overflow-x-auto">
      {!ready ? (
        <div className="text-center py-8 text-muted-foreground">Carregando…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {items.length === 0 ? "Nenhum projeto cadastrado ainda." : "Nenhum resultado para os filtros."}
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-muted/60 border-b">
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2.5">Cliente</th>
              <th className="px-3 py-2.5">Site</th>
              <th className="px-3 py-2.5">Cidade/UF</th>
              <th className="px-3 py-2.5">Projetista</th>
              <th className="px-3 py-2.5">Escopo</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">Solicit.</th>
              <th className="px-3 py-2.5">Prazo</th>
              <th className="px-3 py-2.5">Prazo?</th>
              <th className="px-3 py-2.5 w-24 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-accent/30 cursor-pointer transition-colors" onClick={() => openEdit(p)}>
                <td className="px-3 py-2.5 font-medium">{p.cliente}</td>
                <td className="px-3 py-2.5">{p.site}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{[p.cidade, p.uf].filter(Boolean).join(" / ") || "—"}</td>
                <td className="px-3 py-2.5">{p.projetista || "—"}</td>
                <td className="px-3 py-2.5 text-xs max-w-[220px] truncate">{p.escopo || p.escopo_generico || "—"}</td>
                <td className="px-3 py-2.5"><StatusBadge value={(p.status || "").toLowerCase().replace(/\s+/g, "_")} /></td>
                <td className="px-3 py-2.5 text-xs">{fmtDate(p.data_solicitacao)}</td>
                <td className="px-3 py-2.5 text-xs">{fmtDate(p.prazo_conclusao)}</td>
                <td className="px-3 py-2.5">
                  {p.dentro_prazo === "DENTRO" && <Badge className="bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30 border" variant="outline">Dentro</Badge>}
                  {p.dentro_prazo === "FORA" && <Badge variant="destructive">Fora</Badge>}
                  {!p.dentro_prazo && <span className="text-muted-foreground text-xs">—</span>}
                </td>
                <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex gap-0.5">
                    {p.link_pasta && (
                      <a href={p.link_pasta} target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="h-4 w-4" /></Button>
                      </a>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => doDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );

  return (
    <div className="space-y-4">
      <EngPageHeader
        title="Projetos (Elaboração)"
        description="Controle de elaboração — solicitações, prazos, projetistas e produtividade."
      />

      <KpiGrid>
        <KpiCard label="Total" value={total} icon={FolderKanban} tone="teal" />
        <KpiCard label="Em andamento" value={emAndamento} icon={CalendarClock} tone="warn" />
        <KpiCard label="Não iniciados" value={naoIniciada} icon={CalendarClock} tone="neutral" />
        <KpiCard label="Concluídos" value={concluidos} icon={CheckCircle2} tone="success" />
        <KpiCard label="Dentro do prazo" value={`${taxaSucesso}%`} icon={TrendingUp} tone={taxaSucesso >= 80 ? "success" : taxaSucesso >= 50 ? "warn" : "danger"} hint={`${dentroPrazo} de ${dentroPrazo + foraPrazo}`} />
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
            rows={kanbanRows as any}
            groupKey="status"
            columns={kanbanCols}
            titleKey="site"
            subtitleKey="projetista"
            dateKey="prazo_conclusao"
            priorityKey="prioridade"
            onItemClick={(p) => openEdit(p as Projeto)}
          />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-3 mt-0">
          <KpiGrid>
            <KpiCard label="Fora do prazo" value={foraPrazo} icon={AlertTriangle} tone="danger" />
            <KpiCard label="Dentro do prazo" value={dentroPrazo} icon={CheckCircle2} tone="success" />
            <KpiCard label="Cancelados" value={items.filter((p) => /cancel/i.test(p.status)).length} icon={AlertTriangle} tone="neutral" />
            <KpiCard label="On hold" value={items.filter((p) => /on\s*hold/i.test(p.status)).length} icon={CalendarClock} tone="warn" />
            <KpiCard label="UFs cobertas" value={new Set(items.map((p) => p.uf).filter(Boolean)).size} icon={FolderKanban} tone="teal" />
          </KpiGrid>
          <div className="grid gap-3 md:grid-cols-2">
            <DistribuicaoCard title="Distribuição por status" rows={filtered as any} groupKey="status" />
            <RankingCard title="Top projetistas" rows={filtered as any} groupKey="projetista" />
            <RankingCard title="Top clientes" rows={filtered as any} groupKey="cliente" />
            <DistribuicaoCard title="Local de elaboração" rows={filtered as any} groupKey="local_elaboracao" />
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setOpen(false); setEditId(null); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Editar projeto" : "Novo projeto"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label>Cliente *</Label><SelectFree value={form.cliente} onChange={(v) => setForm({ ...form, cliente: v })} options={optionsCliente} /></div>
            <div><Label>Status</Label><SelectFree value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={DEF_STATUS} /></div>
            <div>
              <Label>UF</Label>
              <Select value={form.uf || undefined} onValueChange={(v) => setForm({ ...form, uf: v })}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>{UFS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Cidade</Label><Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Site *</Label><Input value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} /></div>
            <div><Label>Responsável solicitante</Label><SelectFree value={form.responsavel_solicitante} onChange={(v) => setForm({ ...form, responsavel_solicitante: v })} options={optionsSolic} /></div>
            <div><Label>Projetista</Label><SelectFree value={form.projetista} onChange={(v) => setForm({ ...form, projetista: v })} options={optionsProj} /></div>
            <div>
              <Label>Local da elaboração</Label>
              <Select value={form.local_elaboracao || undefined} onValueChange={(v) => setForm({ ...form, local_elaboracao: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{DEF_LOCAL.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.prioridade || undefined} onValueChange={(v) => setForm({ ...form, prioridade: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{DEF_PRIORIDADE.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Escopo genérico</Label><SelectFree value={form.escopo_generico} onChange={(v) => setForm({ ...form, escopo_generico: v })} options={optionsEscopo} /></div>
            <div><Label>Escopo</Label><Input value={form.escopo} onChange={(e) => setForm({ ...form, escopo: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
            <div><Label>Data solicitação</Label><Input type="date" value={form.data_solicitacao} onChange={(e) => setForm({ ...form, data_solicitacao: e.target.value })} /></div>
            <div><Label>Prazo de conclusão</Label><Input type="date" value={form.prazo_conclusao} onChange={(e) => setForm({ ...form, prazo_conclusao: e.target.value })} /></div>
            <div><Label>Início real</Label><Input type="date" value={form.data_inicio_real} onChange={(e) => setForm({ ...form, data_inicio_real: e.target.value })} /></div>
            <div><Label>Término real</Label><Input type="date" value={form.data_termino_real} onChange={(e) => setForm({ ...form, data_termino_real: e.target.value })} /></div>
            <div><Label>Tempo previsto (HH:MM)</Label><Input value={form.tempo_previsto} onChange={(e) => setForm({ ...form, tempo_previsto: e.target.value })} /></div>
            <div><Label>Tempo real (HH:MM)</Label><Input value={form.tempo_real} onChange={(e) => setForm({ ...form, tempo_real: e.target.value })} /></div>
            <div><Label>Conta</Label><Input value={form.conta} onChange={(e) => setForm({ ...form, conta: e.target.value })} /></div>
            <div><Label>Link da pasta</Label><Input value={form.link_pasta} onChange={(e) => setForm({ ...form, link_pasta: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Observação</Label><Textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjetosElaboracaoPage;
