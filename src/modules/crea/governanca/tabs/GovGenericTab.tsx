import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Trash2, Pencil, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { DataActionsToolbar } from "@/components/DataActionsToolbar";
import ImportColumnPickerModal from "@/modules/crea/ui/ImportColumnPickerModal";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGovCompany } from "../lib/useGovCompany";
import type { FieldSchema } from "@/modules/engenharia/ui/crud/types";

interface Props {
  table: string;
  title: string;
  description?: string;
  fields: FieldSchema[];
  /** chave usada como rótulo do registro (default: "numero") */
  labelKey?: string;
}

const sb: any = supabase;

const fmt = (v: any) => {
  if (v === null || v === undefined || v === "") return <span className="text-muted-foreground">—</span>;
  if (typeof v === "number") return v.toLocaleString("pt-BR");
  return String(v);
};

export function GovGenericTab({ table, title, description, fields, labelKey = "numero" }: Props) {
  const { companyId, loading: loadingCompany } = useGovCompany();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [delIds, setDelIds] = useState<string[]>([]);
  const [delReason, setDelReason] = useState("");
  const [delBusy, setDelBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const listFields = useMemo(() => fields.filter(f => f.inList !== false), [fields]);
  const searchKeys = useMemo(() => fields.filter(f => f.type === "text" || f.type === "textarea").map(f => f.key), [fields]);

  const load = async () => {
    if (!companyId) { setRows([]); return; }
    setLoading(true);
    const { data, error } = await sb.from(table).select("*")
      .eq("company_id", companyId).eq("is_deleted", false)
      .order("created_at", { ascending: false }).limit(2000);
    if (error) toast.error(error.message);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [companyId, table]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(r => searchKeys.some(k => String(r[k] ?? "").toLowerCase().includes(q)));
  }, [rows, search, searchKeys]);

  const sel = useBulkSelection(filtered);

  useEffect(() => { setPage(1); }, [search, pageSize, companyId, table]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const paged = useMemo(() => filtered.slice(pageStart, pageStart + pageSize), [filtered, pageStart, pageSize]);

  const startNew = () => {
    const empty: any = {};
    fields.forEach(f => { empty[f.key] = null; });
    setEditing(empty);
    setOpenForm(true);
  };

  const save = async () => {
    if (!editing || !companyId) return;
    const payload: any = { company_id: companyId };
    fields.forEach(f => { payload[f.key] = editing[f.key] ?? null; });
    if (editing.id) {
      const { error } = await sb.from(table).update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await sb.from(table).insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Salvo");
    setOpenForm(false); setEditing(null); load();
  };

  const askDelete = (ids: string[]) => {
    if (ids.length === 0) return;
    setDelIds(ids); setDelReason(""); setDelOpen(true);
  };

  const confirmDelete = async () => {
    if (delReason.trim().length < 3) { toast.error("Motivo obrigatório (mín. 3 chars)"); return; }
    setDelBusy(true);
    const msgMap: Record<string, string> = {
      forbidden: "Sem permissão para excluir nesta empresa.",
      invalid_table: "Tabela não permite exclusão.",
      reason_required: "Informe o motivo da exclusão.",
      not_found: "Registro não encontrado.",
    };
    // Tenta a versão em lote (uma única chamada → muito mais rápido)
    const { data: bulk, error: bulkErr } = await sb.rpc("crea_soft_delete_bulk", {
      _table: table, _ids: delIds, _reason: delReason.trim(),
    });
    let ok = 0;
    let lastErr: string | undefined;
    if (!bulkErr && bulk?.ok) {
      ok = Number(bulk.deleted ?? 0);
      if (Number(bulk.forbidden ?? 0) > 0) lastErr = "forbidden";
      else if (Number(bulk.not_found ?? 0) > 0) lastErr = "not_found";
    } else {
      // Fallback: chamada individual (compat com RPC antigo)
      lastErr = bulkErr?.message ?? bulk?.error;
      for (const id of delIds) {
        const { data, error } = await sb.rpc("crea_soft_delete", { _table: table, _id: id, _reason: delReason.trim() });
        if (error) { lastErr = error.message; continue; }
        if (data?.ok) ok++;
        else lastErr = data?.error ?? "unknown";
      }
    }
    setDelBusy(false);
    if (ok === delIds.length) toast.success(`${ok} registro(s) excluído(s)`);
    else if (ok === 0) toast.error(`Falha ao excluir: ${msgMap[lastErr ?? ""] ?? lastErr ?? "erro desconhecido"}`);
    else toast.warning(`${ok} de ${delIds.length} excluídos. ${msgMap[lastErr ?? ""] ?? lastErr ?? ""}`);
    setDelOpen(false); setDelIds([]); sel.clear(); load();
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>

      <BulkActionsBar count={sel.count} onClear={sel.clear} onDelete={() => askDelete(Array.from(sel.selected))} />

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Badge variant="secondary">{filtered.length} registros</Badge>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <DataActionsToolbar table={table} title={title} fields={fields} rows={filtered} onImported={load} canImport={false} />
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-1" /> Importar
          </Button>
          <Button onClick={startNew}><Plus className="w-4 h-4 mr-1" /> Novo</Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr>
                <th className="px-2 py-2 w-8">
                  <Checkbox checked={sel.allChecked} onCheckedChange={() => sel.toggleAll()} />
                </th>
                {listFields.map(f => <th key={f.key} className="text-left px-3 py-2 font-medium whitespace-nowrap">{f.label}</th>)}
                <th className="px-3 py-2 w-24 text-right whitespace-nowrap sticky right-0 bg-muted/50">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading || loadingCompany ? (
                <tr><td colSpan={listFields.length + 2} className="px-3 py-8 text-center text-muted-foreground">Carregando…</td></tr>
              ) : !companyId ? (
                <tr><td colSpan={listFields.length + 2} className="px-3 py-8 text-center text-muted-foreground">Sem empresa vinculada.</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={listFields.length + 2} className="px-3 py-8 text-center text-muted-foreground">Nenhum registro.</td></tr>
              ) : paged.map(r => (
                <tr key={r.id} className="border-t hover:bg-accent/40">
                  <td className="px-2 py-2"><Checkbox checked={sel.isSelected(r.id)} onCheckedChange={() => sel.toggle(r.id)} /></td>
                  {listFields.map(f => <td key={f.key} className="px-3 py-2 max-w-xs truncate" title={String(r[f.key] ?? "")}>{fmt(r[f.key])}</td>)}
                  <td className="px-3 py-2 text-right whitespace-nowrap sticky right-0 bg-background">
                    <Button size="icon" variant="ghost" title="Editar" onClick={() => { setEditing(r); setOpenForm(true); }}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" title="Excluir" onClick={() => askDelete([r.id])}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between gap-2 flex-wrap px-3 py-2 border-t bg-muted/20 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                Mostrando {pageStart + 1}–{Math.min(pageStart + pageSize, filtered.length)} de {filtered.length}
              </span>
              <select
                className="h-7 rounded-md border bg-background px-2 text-xs"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={50}>50/pág</option>
                <option value={100}>100/pág</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setPage(1)} disabled={currentPage === 1}>«</Button>
              <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹ Anterior</Button>
              {(() => {
                const pages: number[] = [];
                const start = Math.max(1, currentPage - 2);
                const end = Math.min(totalPages, start + 4);
                for (let i = start; i <= end; i++) pages.push(i);
                return pages.map(p => (
                  <Button
                    key={p}
                    size="sm"
                    variant={p === currentPage ? "default" : "outline"}
                    className="h-7 w-7 p-0"
                    onClick={() => setPage(p)}
                  >{p}</Button>
                ));
              })()}
              <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Próxima ›</Button>
              <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages}>»</Button>
            </div>
          </div>
        )}
      </Card>

      <ImportColumnPickerModal
        open={importOpen}
        onOpenChange={setImportOpen}
        table={table}
        title={title}
        fields={fields}
        companyId={companyId}
        onImported={load}
      />

      <Dialog open={openForm} onOpenChange={(o) => { setOpenForm(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar" : "Novo"} · {title}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3 md:grid-cols-2">
              {fields.map(f => (
                <div key={f.key} className={f.full || f.type === "textarea" ? "md:col-span-2" : ""}>
                  <Label className="text-xs">{f.label}</Label>
                  {f.type === "textarea"
                    ? <Textarea rows={2} value={editing[f.key] ?? ""} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })} />
                    : <Input
                        type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                        value={editing[f.key] ?? ""}
                        onChange={(e) => setEditing({ ...editing, [f.key]: f.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : (e.target.value || null) })}
                      />}
                </div>
              ))}
            </div>
          )}
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={delOpen} onOpenChange={(o) => { if (!delBusy) setDelOpen(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              {delIds.length === 1 ? "1 registro será excluído (soft delete)." : `${delIds.length} registros serão excluídos (soft delete).`} Fica registrado em auditoria.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Motivo da exclusão *</Label>
            <Textarea rows={2} value={delReason} onChange={(e) => setDelReason(e.target.value)} placeholder="Ex.: cadastro duplicado" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDelOpen(false)} disabled={delBusy}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={delBusy}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default GovGenericTab;
