import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Download, Upload, FileSpreadsheet, FileText, Trash2, Users, Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { useGovCompany } from "../governanca/lib/useGovCompany";
import {
  RtPessoa, STATUS_RT_LABEL, MODELO_LABEL, ANUIDADE_LABEL, fmtDateBr,
} from "./lib/rtsTypes";
import { listRts, bulkInsertRts, softDeleteRt } from "./lib/rtsApi";
import { downloadTemplateRts, exportRtsCsv, exportRtsXlsx, parseRtsFile } from "./lib/rtsIO";
import NovoRtDialog from "./NovoRtDialog";

const statusColor = (s: string) => {
  if (s === "ativo") return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30";
  if (s === "inativo") return "bg-muted text-muted-foreground border-border";
  if (s === "afastado") return "bg-amber-500/15 text-amber-700 border-amber-500/30";
  if (s === "encerrado") return "bg-rose-500/15 text-rose-700 border-rose-500/30";
  return "bg-muted text-muted-foreground border-border";
};

const anuidadeColor = (a: string) =>
  a === "paga" ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
               : "bg-rose-500/15 text-rose-700 border-rose-500/30";

export default function RtsPessoasPage() {
  const { companyId, loading: cl } = useGovCompany();
  const [rows, setRows] = useState<RtPessoa[] | null>(null);
  const [q, setQ] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<RtPessoa | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkReason, setBulkReason] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = async () => {
    if (!companyId) return;
    setRows(null); setSel(new Set());
    try { setRows(await listRts(companyId)); }
    catch (e: any) { toast.error("Falha: " + (e?.message ?? e)); setRows([]); }
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [companyId]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) =>
      [r.nome, r.cpf, r.registro, r.rnp, r.visto, r.observacao]
        .some((v) => (v ?? "").toLowerCase().includes(t)));
  }, [rows, q]);

  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSel((s) => s.size === filtered.length ? new Set() : new Set(filtered.map((r) => r.id)));

  const onPickFile = async (f: File | null) => {
    if (!f || !companyId) return;
    try {
      const { records, unmatched } = await parseRtsFile(f);
      if (records.length === 0) { toast.warning("Nenhuma linha válida na planilha"); return; }
      const payload = records.map((r) => ({
        nome: r.nome ?? "",
        cpf: r.cpf ?? "",
        uf: r.uf ?? "",
        status: r.status ?? "ativo",
        data_inicio: r.data_inicio ?? null,
        data_termino: r.termino_indefinido ? null : (r.data_termino ?? null),
        termino_indefinido: !!r.termino_indefinido,
        modelo_contrato: r.modelo_contrato ?? "clt",
        visto: r.visto ?? "",
        rnp: r.rnp ?? "",
        registro: r.registro ?? "",
        observacao: r.observacao ?? "",
        anuidade: r.anuidade ?? "nao_paga",
        anuidade_ano: r.anuidade_ano ?? null,
        inclusao_ativa: r.inclusao_ativa !== false,
        company_id: companyId,
      }));
      const n = await bulkInsertRts(payload);
      toast.success(`${n} RT(s) importado(s)${unmatched.length ? ` · ${unmatched.length} colunas ignoradas` : ""}. Edite para completar dados faltantes.`);
      reload();
    } catch (e: any) {
      toast.error("Falha ao importar: " + (e?.message ?? e));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const doBulkDelete = async () => {
    if (bulkReason.trim().length < 3) { toast.error("Informe o motivo (mín. 3 caracteres)"); return; }
    setBulkBusy(true);
    let ok = 0, fail = 0;
    for (const id of Array.from(sel)) {
      const r = await softDeleteRt(id, bulkReason.trim());
      if (r.ok) ok++; else fail++;
    }
    setBulkBusy(false); setBulkOpen(false); setBulkReason("");
    toast[fail ? "warning" : "success"](`${ok} excluído(s)${fail ? `, ${fail} falha(s)` : ""}`);
    reload();
  };

  const openEdit = (r: RtPessoa) => { setEditing(r); setOpenForm(true); };
  const openNew = () => { setEditing(null); setOpenForm(true); };

  if (cl || rows === null) return <Skeleton className="h-64 w-full" />;
  if (!companyId) return <Card><CardContent className="p-6 text-sm text-muted-foreground">Você precisa estar vinculado a uma empresa.</CardContent></Card>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" /> Responsáveis Técnicos
        </h1>
        <p className="text-sm text-muted-foreground">
          Cadastro de RTs com dados contratuais e de registro. Importação/exportação por planilha.
        </p>
      </div>

      <Card className="card-elegant">
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="h-9 pl-7" placeholder="Buscar nome, CPF, registro..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <span className="text-xs text-muted-foreground">{filtered.length} de {rows.length}</span>
            <div className="flex-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Exportar</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Exportar</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => exportRtsXlsx(filtered)}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportRtsCsv(filtered)}>
                  <FileText className="w-4 h-4 mr-2" /> CSV (.csv)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => downloadTemplateRts()}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Modelo de importação (.xlsx)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4 mr-1" /> Importar
            </Button>
            <input ref={fileRef} type="file" className="hidden" accept=".xlsx,.xls,.csv"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)} />

            <Button size="sm" onClick={openNew}>
              <Plus className="w-4 h-4 mr-1" /> Novo RT
            </Button>
          </div>

          {sel.size > 0 && (
            <div className="sticky top-0 z-30 flex items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
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
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>UF</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Inclusão</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Término</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Visto</TableHead>
                  <TableHead>RNP</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Anuidade</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead className="w-16 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className={sel.has(r.id) ? "bg-primary/5" : ""}>
                    <TableCell><Checkbox checked={sel.has(r.id)} onCheckedChange={() => toggle(r.id)} /></TableCell>
                    <TableCell>
                      <button className="font-medium text-primary hover:underline text-left" onClick={() => openEdit(r)}>
                        {r.nome}
                      </button>
                    </TableCell>
                    <TableCell className="text-xs">{r.cpf || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${statusColor(r.status)}`}>
                        {STATUS_RT_LABEL[r.status] ?? r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{fmtDateBr(r.data_inicio)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {r.termino_indefinido ? <span className="italic text-muted-foreground">Indefinido</span> : fmtDateBr(r.data_termino)}
                    </TableCell>
                    <TableCell className="text-xs">{MODELO_LABEL[r.modelo_contrato] ?? r.modelo_contrato}</TableCell>
                    <TableCell className="text-xs">{r.visto || "—"}</TableCell>
                    <TableCell className="text-xs">{r.rnp || "—"}</TableCell>
                    <TableCell className="text-xs">{r.registro || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${anuidadeColor(r.anuidade)}`}>
                        {ANUIDADE_LABEL[r.anuidade] ?? r.anuidade}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-[220px] truncate" title={r.observacao}>{r.observacao || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)} title="Editar">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={13} className="text-center text-sm text-muted-foreground py-8">
                    Nenhum RT cadastrado. Clique em "Novo RT" ou importe pela planilha.
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <NovoRtDialog
        open={openForm}
        onOpenChange={(o) => { setOpenForm(o); if (!o) setEditing(null); }}
        companyId={companyId}
        initial={editing}
        onSaved={() => reload()}
      />

      <AlertDialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {sel.size} RT(s)?</AlertDialogTitle>
            <AlertDialogDescription>Exclusão registrada em auditoria. Informe o motivo.</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea value={bulkReason} onChange={(e) => setBulkReason(e.target.value)} rows={3} placeholder="Motivo da exclusão" />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkBusy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); doBulkDelete(); }} disabled={bulkBusy}>
              {bulkBusy ? "Excluindo…" : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
