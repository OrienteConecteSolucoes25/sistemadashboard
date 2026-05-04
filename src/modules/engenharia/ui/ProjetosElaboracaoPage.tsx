import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Download, Upload, FileDown, Search, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useProjetos, type Projeto } from "../hooks/useProjetos";
import {
  emptyProjeto, computeDerived, rowToProjeto, projetoToExportRow, PROJETO_HEADERS,
  DEF_CLIENTES, DEF_ESCOPOS_GENERICOS, DEF_PROJETISTAS, DEF_SOLICITANTES,
  DEF_STATUS, DEF_LOCAL, DEF_PRIORIDADE, UFS,
} from "../lib/projetosImport";
import { exportXlsx, downloadTemplate, readXlsxFile, fmtDate, uid } from "../lib/storage";

const ALL = "__all__";
const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  "CONCLUÍDO": "default", "EM ANDAMENTO": "secondary",
  "NÃO INICIADA": "outline", "CANCELADA": "destructive", "ON HOLD": "outline",
};

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

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold">Projetos (Elaboração)</h2>
        <p className="text-xs text-muted-foreground">Controle de elaboração — solicitações, prazos, projetistas e produtividade.</p>
      </div>

      <Card>
        <CardContent className="pt-4 flex flex-wrap items-center gap-2">
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />Novo projeto</Button>
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
              <Input className="pl-8 w-56" placeholder="Buscar…" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <Filter label="Cliente" value={fCliente} onChange={setFCliente} options={optionsCliente} />
            <Filter label="Status" value={fStatus} onChange={setFStatus} options={DEF_STATUS} />
            <Filter label="Projetista" value={fProj} onChange={setFProj} options={optionsProj} />
            <Filter label="UF" value={fUf} onChange={setFUf} options={UFS} />
            <Badge variant="secondary">{filtered.length} de {items.length}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          {!ready ? (
            <div className="text-center py-8 text-muted-foreground">Carregando…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {items.length === 0 ? "Nenhum projeto cadastrado ainda." : "Nenhum resultado para os filtros."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Cidade/UF</TableHead>
                  <TableHead>Projetista</TableHead>
                  <TableHead>Escopo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Solicit.</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Prazo?</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.cliente}</TableCell>
                    <TableCell>{p.site}</TableCell>
                    <TableCell>{[p.cidade, p.uf].filter(Boolean).join(" / ") || "—"}</TableCell>
                    <TableCell>{p.projetista || "—"}</TableCell>
                    <TableCell className="text-xs">{p.escopo || p.escopo_generico || "—"}</TableCell>
                    <TableCell><Badge variant={statusVariant[p.status] ?? "outline"}>{p.status || "—"}</Badge></TableCell>
                    <TableCell>{fmtDate(p.data_solicitacao)}</TableCell>
                    <TableCell>{fmtDate(p.prazo_conclusao)}</TableCell>
                    <TableCell>
                      {p.dentro_prazo === "DENTRO" && <Badge variant="default">Dentro</Badge>}
                      {p.dentro_prazo === "FORA" && <Badge variant="destructive">Fora</Badge>}
                      {!p.dentro_prazo && <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        {p.link_pasta && (
                          <a href={p.link_pasta} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button>
                          </a>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => doDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
