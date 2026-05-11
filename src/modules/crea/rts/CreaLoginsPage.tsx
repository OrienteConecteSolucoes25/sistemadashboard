import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Pencil, Trash2, Eye, EyeOff, Download, Upload, FileSpreadsheet, FileText, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useGovCompany } from "../governanca/lib/useGovCompany";
import { exportData, downloadTemplate as dlTemplate, parseImportFile } from "@/lib/dataIO";

const FIELDS = [
  { key: "regiao", label: "Região" },
  { key: "rt_nome", label: "Responsável Técnico" },
  { key: "senha", label: "Senha" },
  { key: "observacoes", label: "Observações" },
];

const sb: any = supabase;

type Login = {
  id: string;
  company_id: string | null;
  regiao: string;
  rt_nome: string;
  senha: string | null;
  observacoes: string | null;
};

const HEADERS = ["Região", "Responsável Técnico", "Senha", "Observações"];

export default function CreaLoginsPage() {
  const { companyId, loading: cl } = useGovCompany();
  const [rows, setRows] = useState<Login[] | null>(null);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Login | null>(null);
  const [show, setShow] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkReason, setBulkReason] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = async () => {
    if (!companyId) return;
    setRows(null); setSel(new Set());
    const { data, error } = await sb.from("crea_logins")
      .select("*").eq("company_id", companyId).eq("is_deleted", false)
      .order("regiao", { ascending: true });
    if (error) { toast.error(error.message); setRows([]); return; }
    setRows(data ?? []);
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [companyId]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(r => [r.regiao, r.rt_nome, r.observacoes].some(v => (v ?? "").toLowerCase().includes(t)));
  }, [rows, q]);

  const toggle = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSel(s => s.size === filtered.length ? new Set() : new Set(filtered.map(r => r.id)));
  const toggleShow = (id: string) => setShow(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const openNew = () => { setEditing({ id: "", company_id: companyId ?? null, regiao: "", rt_nome: "", senha: "", observacoes: "" }); setOpenForm(true); };
  const openEdit = (r: Login) => { setEditing({ ...r }); setOpenForm(true); };

  const save = async () => {
    if (!editing) return;
    if (!editing.regiao.trim() || !editing.rt_nome.trim()) { toast.error("Região e Responsável são obrigatórios"); return; }
    const payload = {
      company_id: companyId,
      regiao: editing.regiao.trim(),
      rt_nome: editing.rt_nome.trim(),
      senha: editing.senha ?? null,
      observacoes: editing.observacoes ?? null,
    };
    const res = editing.id
      ? await sb.from("crea_logins").update(payload).eq("id", editing.id)
      : await sb.from("crea_logins").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("Login salvo");
    setOpenForm(false); setEditing(null); reload();
  };

  const doBulkDelete = async () => {
    if (bulkReason.trim().length < 3) { toast.error("Informe o motivo (mín. 3 caracteres)"); return; }
    const ids = Array.from(sel);
    const { error } = await sb.from("crea_logins")
      .update({ is_deleted: true, deleted_at: new Date().toISOString(), delete_reason: bulkReason.trim() })
      .in("id", ids);
    if (error) { toast.error(error.message); return; }
    toast.success(`${ids.length} login(s) excluído(s)`);
    setBulkOpen(false); setBulkReason(""); reload();
  };

  const doExport = (format: "xlsx" | "csv") => {
    exportData({ rows: filtered, fields: FIELDS as any, filename: `crea-logins-${Date.now()}`, format, title: "Logins CREA" });
  };

  const downloadTemplate = () => {
    dlTemplate({ fields: FIELDS as any, filename: "modelo-crea-logins", format: "xlsx", title: "Logins CREA" });
  };

  const onPickFile = async (f: File | null) => {
    if (!f || !companyId) return;
    try {
      const p = await parseImportFile(f);
      const idx = (h: string) => p.headers.findIndex(x => x.toLowerCase().trim() === h.toLowerCase());
      const iReg = idx("Região") >= 0 ? idx("Região") : idx("regiao");
      const iRt = idx("Responsável Técnico") >= 0 ? idx("Responsável Técnico") : (idx("Responsável") >= 0 ? idx("Responsável") : idx("rt_nome"));
      const iSenha = idx("Senha");
      const iObs = idx("Observações") >= 0 ? idx("Observações") : idx("OBSERVAÇÕES");
      if (iReg < 0 || iRt < 0) { toast.error("Planilha precisa ter colunas Região e Responsável Técnico"); return; }
      const payload = (p.rows as any[][])
        .map(r => ({
          company_id: companyId,
          regiao: String(r[iReg] ?? "").trim(),
          rt_nome: String(r[iRt] ?? "").trim(),
          senha: iSenha >= 0 ? String(r[iSenha] ?? "").trim() || null : null,
          observacoes: iObs >= 0 ? String(r[iObs] ?? "").trim() || null : null,
        }))
        .filter(x => x.regiao && x.rt_nome);
      if (!payload.length) { toast.warning("Nenhuma linha válida"); return; }
      const { error } = await sb.from("crea_logins").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success(`${payload.length} login(s) importado(s). Edite para completar campos faltantes.`);
      reload();
    } catch (e: any) {
      toast.error("Falha ao importar: " + (e?.message ?? e));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (cl || rows === null) return <Skeleton className="h-64 w-full" />;
  if (!companyId) return <Card><CardContent className="p-6 text-sm text-muted-foreground">Você precisa estar vinculado a uma empresa.</CardContent></Card>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2"><KeyRound className="w-4 h-4 text-primary" /> Logins de portais CREA</h2>
        <p className="text-sm text-muted-foreground">Acessos por região e responsável técnico. Importe pela planilha ou cadastre manualmente.</p>
      </div>

      <Card className="card-elegant">
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="h-9 pl-7" placeholder="Buscar região, RT..." value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <span className="text-xs text-muted-foreground">{filtered.length} de {rows.length}</span>
            <div className="flex-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Exportar</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Exportar</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => doExport("xlsx")}><FileSpreadsheet className="w-4 h-4 mr-2" /> Excel (.xlsx)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => doExport("csv")}><FileText className="w-4 h-4 mr-2" /> CSV (.csv)</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={downloadTemplate}><FileSpreadsheet className="w-4 h-4 mr-2" /> Modelo de importação</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4 mr-1" /> Importar
            </Button>
            <input ref={fileRef} type="file" className="hidden" accept=".xlsx,.xls,.csv"
              onChange={e => onPickFile(e.target.files?.[0] ?? null)} />

            <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Novo login</Button>
          </div>

          {sel.size > 0 && (
            <div className="flex items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
              <span className="font-medium text-primary">{sel.size} selecionado(s)</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSel(new Set())}>Limpar</Button>
                <Button variant="destructive" size="sm" onClick={() => setBulkOpen(true)}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir selecionados
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-auto rounded-md border" style={{ maxHeight: "65vh" }}>
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="w-8">
                    <Checkbox checked={sel.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead>Região</TableHead>
                  <TableHead>Responsável Técnico</TableHead>
                  <TableHead>Senha</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="w-16 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id} className={sel.has(r.id) ? "bg-primary/5" : ""}>
                    <TableCell><Checkbox checked={sel.has(r.id)} onCheckedChange={() => toggle(r.id)} /></TableCell>
                    <TableCell className="font-medium">{r.regiao}</TableCell>
                    <TableCell>
                      <button className="text-primary hover:underline text-left" onClick={() => openEdit(r)}>{r.rt_nome}</button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-mono text-xs">
                        <span>{r.senha ? (show.has(r.id) ? r.senha : "••••••••") : "—"}</span>
                        {r.senha && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleShow(r.id)}>
                            {show.has(r.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs max-w-[280px] truncate" title={r.observacoes ?? ""}>{r.observacoes || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)} title="Editar">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                    Nenhum login. Clique em "Novo login" ou importe pela planilha.
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openForm} onOpenChange={(o) => { setOpenForm(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar login" : "Novo login"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div><Label>Região *</Label><Input value={editing.regiao} onChange={e => setEditing({ ...editing, regiao: e.target.value })} placeholder="Ex.: ALAGOAS (AL)" /></div>
              <div><Label>Responsável Técnico *</Label><Input value={editing.rt_nome} onChange={e => setEditing({ ...editing, rt_nome: e.target.value })} /></div>
              <div><Label>Senha</Label><Input value={editing.senha ?? ""} onChange={e => setEditing({ ...editing, senha: e.target.value })} /></div>
              <div><Label>Observações</Label><Textarea rows={2} value={editing.observacoes ?? ""} onChange={e => setEditing({ ...editing, observacoes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {sel.size} login(s)?</AlertDialogTitle>
            <AlertDialogDescription>Exclusão registrada em auditoria. Informe o motivo.</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea value={bulkReason} onChange={e => setBulkReason(e.target.value)} rows={3} placeholder="Motivo da exclusão" />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); doBulkDelete(); }}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
