import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import type { CrudConfig, FieldSchema } from "./types";
import { DeleteWithPasswordModal } from "@/components/DeleteWithPasswordModal";
import { makeEditKeyHandler } from "../../lib/keyboardEdit";
import { SOFT_DELETE_TABLES, type SoftDeleteTable } from "@/modules/engenharia/lib/deleteWithAudit";
import { DataActionsToolbar } from "@/components/DataActionsToolbar";

const formatCell = (val: any, f: FieldSchema) => {
  if (val === null || val === undefined || val === "") return <span className="text-muted-foreground">—</span>;
  if (f.type === "boolean") return val ? "Sim" : "Não";
  if (f.type === "date") return new Date(val).toLocaleDateString("pt-BR");
  if (f.type === "number" && typeof val === "number") return val.toLocaleString("pt-BR");
  if (typeof val === "object") return <span className="font-mono text-xs">{JSON.stringify(val).slice(0, 60)}</span>;
  return String(val);
};

const FormField = ({ field, value, onChange }: { field: FieldSchema; value: any; onChange: (v: any) => void }) => {
  const common = `w-full`;
  switch (field.type) {
    case "textarea":
      return <Textarea rows={3} className={common} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />;
    case "number":
      return <Input type="number" className={common} value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} placeholder={field.placeholder} />;
    case "date":
      return <Input type="date" className={common} value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} />;
    case "boolean":
      return <div className="flex items-center"><Switch checked={!!value} onCheckedChange={onChange} /></div>;
    case "select":
      return (
        <Select value={value ?? ""} onValueChange={(v) => onChange(v || null)}>
          <SelectTrigger className={common}><SelectValue placeholder={field.placeholder || "Selecionar"} /></SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    default:
      return <Input className={common} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />;
  }
};

const CrudPage = ({ config }: { config: CrudConfig }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

  const supportsSoftDelete = (SOFT_DELETE_TABLES as readonly string[]).includes(config.table);

  const listFields = useMemo(() => config.fields.filter((f) => f.inList !== false).slice(0, 6), [config]);
  const searchKeys = config.searchKeys ?? config.fields.filter((f) => f.type === "text" || f.type === "textarea").map((f) => f.key);

  const load = async () => {
    setLoading(true);
    const orderCol = config.orderBy?.column ?? "created_at";
    const asc = config.orderBy?.ascending ?? false;
    let query: any = supabase.from(config.table as any).select("*").order(orderCol, { ascending: asc });
    if (supportsSoftDelete) query = query.eq("is_deleted", false);
    const { data, error } = await (query as any);
    if (error) toast.error(error.message);
    setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [config.table]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q)));
  }, [rows, search, searchKeys]);

  const startNew = () => {
    const empty: any = {};
    config.fields.forEach((f) => { empty[f.key] = f.type === "boolean" ? false : null; });
    setEditing(empty);
    setOpenForm(true);
  };

  const save = async () => {
    if (!editing) return;
    for (const f of config.fields) {
      if (f.required && (editing[f.key] === null || editing[f.key] === undefined || editing[f.key] === "")) {
        toast.error(`${f.label} é obrigatório`); return;
      }
    }
    const payload: any = {};
    config.fields.forEach((f) => { payload[f.key] = editing[f.key] ?? null; });

    if (editing.id) {
      const { error } = await (supabase.from(config.table as any).update(payload).eq("id", editing.id) as any);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await (supabase.from(config.table as any).insert(payload) as any);
      if (error) return toast.error(error.message);
    }
    toast.success("Salvo");
    setOpenForm(false);
    setEditing(null);
    load();
  };

  const askDelete = (row: any) => {
    const label = row.titulo ?? row.nome ?? row.numero ?? row.descricao ?? row.id;
    if (supportsSoftDelete) {
      setDeleteTarget({ id: row.id, label: String(label) });
    } else {
      // Fallback: tabelas sem soft delete continuam com confirm simples
      if (!confirm(`Excluir "${label}"?`)) return;
      void (async () => {
        const { error } = await (supabase.from(config.table as any).delete().eq("id", row.id) as any);
        if (error) return toast.error(error.message);
        load();
      })();
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold">{config.title}</h2>
        {config.description && <p className="text-xs text-muted-foreground">{config.description}</p>}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Badge variant="secondary">{filtered.length} registros</Badge>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <DataActionsToolbar
            table={config.table}
            title={config.title}
            fields={config.fields}
            rows={filtered}
            onImported={load}
          />
          <Button onClick={startNew}><Plus className="w-4 h-4 mr-1" /> Novo</Button>
        </div>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {listFields.map((f) => <th key={f.key} className="text-left px-3 py-2 font-medium">{f.label}</th>)}
              <th className="px-3 py-2 w-24 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={listFields.length + 1} className="px-3 py-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={listFields.length + 1} className="px-3 py-8 text-center text-muted-foreground">Nenhum registro.</td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id} className="border-t hover:bg-accent/40 cursor-pointer" title="Duplo-clique para editar" onDoubleClick={() => { setEditing(r); setOpenForm(true); }}>
                {listFields.map((f) => <td key={f.key} className="px-3 py-2">{formatCell(r[f.key], f)}</td>)}
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <Button size="icon" variant="ghost" title="Editar" onClick={(e) => { e.stopPropagation(); setEditing(r); setOpenForm(true); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" title="Excluir" onClick={(e) => { e.stopPropagation(); askDelete(r); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={openForm} onOpenChange={(o) => { setOpenForm(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? `Editar ${config.title}` : `Novo ${config.title}`}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3 md:grid-cols-2">
              {config.fields.map((f) => (
                <div key={f.key} className={f.full || f.type === "textarea" ? "md:col-span-2" : ""}>
                  <Label>{f.label}{f.required && " *"}</Label>
                  <FormField field={f} value={editing[f.key]} onChange={(v) => setEditing({ ...editing, [f.key]: v })} />
                </div>
              ))}
            </div>
          )}
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {supportsSoftDelete && (
        <DeleteWithPasswordModal
          open={!!deleteTarget}
          onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
          table={config.table as SoftDeleteTable}
          recordId={deleteTarget?.id ?? null}
          recordLabel={deleteTarget?.label ?? null}
          moduleLabel={config.title}
          onDeleted={() => { setDeleteTarget(null); load(); }}
        />
      )}
    </div>
  );
};

export default CrudPage;
