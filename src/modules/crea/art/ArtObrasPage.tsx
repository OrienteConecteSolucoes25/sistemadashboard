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
  Plus, Search, Download, Upload, FileSpreadsheet, FileText, Trash2, FileSignature,
} from "lucide-react";
import { toast } from "sonner";
import { useGovCompany } from "../governanca/lib/useGovCompany";
import { ArtObra, STATUS_LABEL, TIPOS_OBRA_LABEL, fmtDateBr } from "./lib/artObrasTypes";
import { listObras, bulkInsertObras, softDeleteObra } from "./lib/artObrasApi";
import { downloadTemplate, exportObrasCsv, exportObrasXlsx, parseObrasFile } from "./lib/artObrasIO";
import NovaObraDialog from "./NovaObraDialog";
import ObraArtSheet from "./ObraArtSheet";

const statusColor = (s: string) => {
  if (s === "concluida") return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30";
  if (s === "cancelada") return "bg-rose-500/15 text-rose-700 border-rose-500/30";
  if (s === "em_andamento") return "bg-blue-500/15 text-blue-700 border-blue-500/30";
  if (s === "aguardando_assinatura") return "bg-amber-500/15 text-amber-700 border-amber-500/30";
  return "bg-muted text-muted-foreground border-border";
};

export default function ArtObrasPage() {
  const { companyId, loading: cl } = useGovCompany();
  const [rows, setRows] = useState<ArtObra[] | null>(null);
  const [q, setQ] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [active, setActive] = useState<ArtObra | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkReason, setBulkReason] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = async () => {
    if (!companyId) return;
    setRows(null); setSel(new Set());
    try { setRows(await listObras(companyId)); }
    catch (e: any) { toast.error("Falha: " + (e?.message ?? e)); setRows([]); }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [companyId]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) =>
      [r.obra, r.cidade, r.uf, r.cliente, r.coordenador, r.escopo, r.responsavel, r.observacao]
        .some((v) => (v ?? "").toLowerCase().includes(t)));
  }, [rows, q]);

  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSel((s) => s.size === filtered.length ? new Set() : new Set(filtered.map((r) => r.id)));

  const onPickFile = async (f: File | null) => {
    if (!f || !companyId) return;
    try {
      const { records, unmatched } = await parseObrasFile(f);
      if (records.length === 0) { toast.warning("Nenhuma linha válida na planilha"); return; }
      const payload = records.map((r) => ({
        obra: r.obra ?? "",
        tipo_obra: r.tipo_obra ?? "civil",
        cidade: r.cidade ?? "",
        uf: r.uf ?? "BA",
        escopo: r.escopo ?? "",
        cliente: r.cliente ?? "",
        coordenador: r.coordenador ?? "",
        status: r.status ?? "pendente",
        observacao: r.observacao ?? "",
        responsavel: r.responsavel || null,
        data_criacao_art: r.data_criacao_art ?? null,
        data_validacao: r.data_validacao ?? null,
        data_envio_pagamento: r.data_envio_pagamento ?? null,
        data_pasta: r.data_pasta ?? null,
        company_id: companyId,
      }));
      const n = await bulkInsertObras(payload);
      toast.success(`${n} obras importadas${unmatched.length ? ` · ${unmatched.length} colunas ignoradas` : ""}`);
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
      const r = await softDeleteObra(id, bulkReason.trim());
      if (r.ok) ok++; else fail++;
    }
    setBulkBusy(false); setBulkOpen(false); setBulkReason("");
    toast[fail ? "warning" : "success"](`${ok} excluída(s)${fail ? `, ${fail} falha(s)` : ""}`);
    reload();
  };

  if (cl || rows === null) return <Skeleton className="h-64 w-full" />;
  if (!companyId) return <Card><CardContent className="p-6 text-sm text-muted-foreground">Você precisa estar vinculado a uma empresa.</CardContent></Card>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-primary" /> ART · Obras
        </h1>
        <p className="text-sm text-muted-foreground">
          Cadastro de obras com ciclo de ART. Importação/exportação seguem o modelo da planilha CREA.
        </p>
      </div>

      <Card className="card-elegant">
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="h-9 pl-7" placeholder="Buscar obra, cidade, cliente..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <span className="text-xs text-muted-foreground">{filtered.length} de {rows.length}</span>
            <div className="flex-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Exportar</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Exportar (no formato da planilha)</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => exportObrasXlsx(filtered)}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportObrasCsv(filtered)}>
                  <FileText className="w-4 h-4 mr-2" /> CSV (.csv)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => downloadTemplate()}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Modelo vazio (.xlsx)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4 mr-1" /> Importar
            </Button>
            <input
              ref={fileRef} type="file" className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />

            <Button size="sm" onClick={() => setOpenNew(true)}>
              <Plus className="w-4 h-4 mr-1" /> Nova obra
            </Button>
          </div>

          {sel.size > 0 && (
            <div className="sticky top-0 z-30 flex items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
              <span className="font-medium text-primary">{sel.size} selecionada(s)</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSel(new Set())}>Limpar</Button>
                <Button variant="destructive" size="sm" onClick={() => setBulkOpen(true)}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir selecionadas
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-auto rounded-md border" style={{ maxHeight: "65vh" }}>
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="w-8">
                    <Checkbox
                      checked={sel.size === filtered.length && filtered.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Obra</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>UF</TableHead>
                  <TableHead>Escopo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Coordenador</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Criação ART</TableHead>
                  <TableHead>Validada</TableHead>
                  <TableHead>Envio pagto</TableHead>
                  <TableHead>Pasta</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className={sel.has(r.id) ? "bg-primary/5" : ""}>
                    <TableCell><Checkbox checked={sel.has(r.id)} onCheckedChange={() => toggle(r.id)} /></TableCell>
                    <TableCell>
                      <button
                        className="font-medium text-primary hover:underline text-left"
                        onClick={() => setActive(r)}
                      >{r.obra}</button>
                    </TableCell>
                    <TableCell className="text-xs">{TIPOS_OBRA_LABEL[r.tipo_obra] ?? r.tipo_obra}</TableCell>
                    <TableCell className="text-xs">{r.cidade}</TableCell>
                    <TableCell className="text-xs">{r.uf}</TableCell>
                    <TableCell className="text-xs max-w-[180px] truncate" title={r.escopo}>{r.escopo}</TableCell>
                    <TableCell className="text-xs">{r.cliente}</TableCell>
                    <TableCell className="text-xs">{r.coordenador}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${statusColor(r.status)}`}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.responsavel ?? "—"}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{fmtDateBr(r.data_criacao_art)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{fmtDateBr(r.data_validacao)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{fmtDateBr(r.data_envio_pagamento)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{fmtDateBr(r.data_pasta)}</TableCell>
                    <TableCell className="text-xs max-w-[220px] truncate" title={r.observacao}>{r.observacao}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={15} className="text-center text-sm text-muted-foreground py-8">
                    Nenhuma obra cadastrada. Clique em "Nova obra" ou importe a planilha.
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <NovaObraDialog
        open={openNew}
        onOpenChange={setOpenNew}
        companyId={companyId}
        onSaved={() => reload()}
      />

      <ObraArtSheet
        obra={active}
        open={!!active}
        onOpenChange={(o) => !o && setActive(null)}
        onChanged={() => reload()}
      />

      <AlertDialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {sel.size} obra(s)?</AlertDialogTitle>
            <AlertDialogDescription>Exclusão registrada em auditoria. Informe o motivo.</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea value={bulkReason} onChange={(e) => setBulkReason(e.target.value)} rows={3}
            placeholder="Motivo da exclusão" />
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
