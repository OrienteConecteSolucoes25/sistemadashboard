import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, Search, Trash2, Pencil, Upload, Download } from "lucide-react";
import type { CrudConfig, FieldSchema } from "@/modules/engenharia/ui/crud/types";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { exportData, downloadTemplate, parseImportFile, type IOFormat } from "@/lib/dataIO";
import { creaSoftDelete, mapAdaptive, type CreaTable } from "@/modules/crea/lib/creaCrud";

const sb: any = supabase;

const fmt = (v: any, f: FieldSchema) => {
  if (v === null || v === undefined || v === "") return <span className="text-muted-foreground">—</span>;
  if (f.type === "boolean") return v ? "Sim" : "Não";
  if (f.type === "date") return new Date(v).toLocaleDateString("pt-BR");
  if (f.type === "number" && typeof v === "number") return v.toLocaleString("pt-BR");
  return String(v).slice(0, 80);
};

const FormField = ({ field, value, onChange }: any) => {
  switch (field.type) {
    case "textarea":
      return <Textarea rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />;
    case "number":
      return <Input type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} />;
    case "date":
      return <Input type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} />;
    case "boolean":
      return <Switch checked={!!value} onCheckedChange={onChange} />;
    case "select":
      return (
        <Select value={value ?? ""} onValueChange={(v) => onChange(v || null)}>
          <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
          <SelectContent>{(field.options ?? []).map((o: string) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
      );
    default:
      return <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />;
  }
};

interface Props {
  config: CrudConfig;
  /** Tabelas globais (sem company_id) ex.: crea_norms, crea_links_oficiais */
  isGlobal?: boolean;
}

export default function CreaCrudPage({ config, isGlobal = false }: Props) {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterUf, setFilterUf] = useState<string>("__all");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const [delTarget, setDelTarget] = useState<{ id: string; label: string } | null>(null);
  const [delReason, setDelReason] = useState("");
  const [delBusy, setDelBusy] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ records: any[]; headers: string[]; extras: string[] } | null>(null);
  const [importing, setImporting] = useState(false);

  const hasUf = useMemo(() => config.fields.some((f) => f.key === "uf"), [config]);
  // Colunas: campos conhecidos + chaves dinâmicas vindas do `data` (modo adaptativo)
  const dynamicKeys = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => { if (r?.data && typeof r.data === "object") Object.keys(r.data).forEach((k) => set.add(k)); });
    return Array.from(set);
  }, [rows]);

  const listFields = useMemo(() => config.fields.filter((f) => f.inList !== false), [config]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await sb.from(config.table).select("*").eq("is_deleted", false).order("created_at", { ascending: false }).limit(500);
    if (error) toast.error(error.message);
    setRows(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [config.table]);

  const filtered = useMemo(() => {
    let out = rows;
    if (filterUf !== "__all") out = out.filter((r) => (r.uf ?? "") === filterUf);
    if (search.trim()) {
      const q = search.toLowerCase();
      const keys = config.searchKeys ?? config.fields.filter((f) => f.type === "text" || f.type === "textarea").map((f) => f.key);
      out = out.filter((r) => keys.some((k) => String(r[k] ?? "").toLowerCase().includes(q))
        || JSON.stringify(r.data ?? {}).toLowerCase().includes(q));
    }
    return out;
  }, [rows, search, filterUf, config]);

  const startNew = () => {
    const empty: any = {};
    config.fields.forEach((f) => { empty[f.key] = f.type === "boolean" ? false : null; });
    setEditing(empty); setOpenForm(true);
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
    if (editing.data) payload.data = editing.data;
    if (!isGlobal) {
      // Tenta company do usuário; admin pode editar sem company
      const { data: cu } = await sb.from("company_users").select("company_id").eq("user_id", user?.id).maybeSingle();
      if (cu?.company_id) payload.company_id = editing.company_id ?? cu.company_id;
      else if (editing.company_id) payload.company_id = editing.company_id;
    }
    if (editing.id) {
      const { error } = await sb.from(config.table).update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await sb.from(config.table).insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Salvo");
    setOpenForm(false); setEditing(null); load();
  };

  const askDelete = (row: any) => {
    const label = row.numero ?? row.nome ?? row.titulo ?? row.empresa ?? row.tipo ?? row.id;
    setDelTarget({ id: row.id, label: String(label) });
    setDelReason("");
  };

  const confirmDelete = async () => {
    if (!delTarget) return;
    if (delReason.trim().length < 3) { toast.error("Informe o motivo (mín. 3 caracteres)."); return; }
    setDelBusy(true);
    const r = await creaSoftDelete(config.table as CreaTable, delTarget.id, delReason.trim());
    setDelBusy(false);
    if (!r.ok) { toast.error(r.error ?? "Falha ao excluir."); return; }
    toast.success("Excluído (soft delete) e registrado na auditoria.");
    setDelTarget(null); load();
  };

  // ============ Export adaptativo ============
  // Inclui colunas dinâmicas vindas de `data`
  const exportFields: FieldSchema[] = useMemo(() => {
    const dyn: FieldSchema[] = dynamicKeys.map((k) => ({ key: `data.${k}`, label: k, type: "text" }));
    return [...config.fields, ...dyn];
  }, [config.fields, dynamicKeys]);

  const expandRow = (r: any) => {
    const out: any = { ...r };
    if (r.data && typeof r.data === "object") for (const k of Object.keys(r.data)) out[`data.${k}`] = r.data[k];
    return out;
  };

  const doExport = async (format: IOFormat) => {
    if (filtered.length === 0) return toast.warning("Nada para exportar");
    await exportData({ rows: filtered.map(expandRow), fields: exportFields, filename: config.table, format, title: config.title });
    toast.success(`Exportado (${format.toUpperCase()})`);
  };

  const doTemplate = async (format: IOFormat) => {
    await downloadTemplate({ fields: config.fields, filename: config.table, format, title: config.title });
    toast.success("Modelo baixado");
  };

  // ============ Import adaptativo ============
  const onPickFile = async (f: File | null) => {
    setPreview(null);
    if (!f) return;
    try {
      const parsed = await parseImportFile(f);
      const records = mapAdaptive(parsed.rows as any, parsed.headers, config.fields);
      const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, "_");
      const known = new Set([...config.fields.map((f) => f.key), ...config.fields.map((f) => norm(f.label))]);
      const extras = parsed.headers.filter((h) => !known.has(norm(h)));
      setPreview({ records, headers: parsed.headers, extras });
    } catch (e: any) {
      toast.error("Falha ao ler: " + (e?.message ?? e));
    }
  };

  const commitImport = async () => {
    if (!preview || preview.records.length === 0) return;
    setImporting(true);
    try {
      // Anexa company_id se necessário
      let companyId: string | null = null;
      if (!isGlobal) {
        const { data: cu } = await sb.from("company_users").select("company_id").eq("user_id", user?.id).maybeSingle();
        companyId = cu?.company_id ?? null;
      }
      const enriched = preview.records.map((r) => companyId ? { ...r, company_id: companyId } : r);
      const chunk = 200;
      let n = 0;
      for (let i = 0; i < enriched.length; i += chunk) {
        const slice = enriched.slice(i, i + chunk);
        const { error } = await sb.from(config.table).insert(slice);
        if (error) throw error;
        n += slice.length;
      }
      toast.success(`${n} registros importados (${preview.extras.length} colunas extras preservadas no campo "data")`);
      setImportOpen(false); setPreview(null);
      load();
    } catch (e: any) {
      toast.error("Erro: " + (e?.message ?? e));
    } finally {
      setImporting(false);
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
        {hasUf && (
          <Select value={filterUf} onValueChange={setFilterUf}>
            <SelectTrigger className="w-32"><SelectValue placeholder="UF" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todas UFs</SelectItem>
              {(config.fields.find((f) => f.key === "uf")?.options ?? []).map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Badge variant="secondary">{filtered.length} registros</Badge>

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Exportar</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Exportar (adapta-se ao formato importado)</DropdownMenuLabel>
              {(["xlsx","csv","docx"] as IOFormat[]).map((f) => (
                <DropdownMenuItem key={f} onClick={() => doExport(f)}>{f.toUpperCase()}</DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Modelo (cabeçalhos padrão)</DropdownMenuLabel>
              {(["xlsx","csv"] as IOFormat[]).map((f) => (
                <DropdownMenuItem key={"t"+f} onClick={() => doTemplate(f)}>Modelo {f.toUpperCase()}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-1" /> Importar
          </Button>
          <Button onClick={startNew}><Plus className="w-4 h-4 mr-1" /> Novo</Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <ScrollArea className="w-full">
          <table className="text-sm min-w-max">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                {listFields.map((f) => <th key={f.key} className="text-left px-3 py-2 font-medium whitespace-nowrap">{f.label}</th>)}
                {dynamicKeys.map((k) => <th key={k} className="text-left px-3 py-2 font-medium whitespace-nowrap text-muted-foreground italic">{k}</th>)}
                <th className="px-3 py-2 w-24 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={listFields.length + dynamicKeys.length + 1} className="px-3 py-8 text-center text-muted-foreground">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={listFields.length + dynamicKeys.length + 1} className="px-3 py-8 text-center text-muted-foreground">Nenhum registro.</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="border-t hover:bg-accent/40 cursor-pointer" onClick={() => { setEditing(r); setOpenForm(true); }}>
                  {listFields.map((f) => <td key={f.key} className="px-3 py-2 whitespace-nowrap">{fmt(r[f.key], f)}</td>)}
                  {dynamicKeys.map((k) => <td key={k} className="px-3 py-2 whitespace-nowrap text-xs">{String(r.data?.[k] ?? "—").slice(0,60)}</td>)}
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditing(r); setOpenForm(true); }}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); askDelete(r); }}><Trash2 className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>

      {/* Form */}
      <Dialog open={openForm} onOpenChange={(o) => { setOpenForm(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? `Editar ${config.title}` : `Novo ${config.title}`}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3 md:grid-cols-2">
              {config.fields.map((f) => (
                <div key={f.key} className={f.full || f.type === "textarea" ? "md:col-span-2" : ""}>
                  <Label>{f.label}{f.required && " *"}</Label>
                  <FormField field={f} value={editing[f.key]} onChange={(v: any) => setEditing({ ...editing, [f.key]: v })} />
                </div>
              ))}
              {editing.data && Object.keys(editing.data).length > 0 && (
                <div className="md:col-span-2 border-t pt-3">
                  <Label className="text-xs uppercase text-muted-foreground">Colunas extras (importadas)</Label>
                  <div className="grid gap-2 md:grid-cols-2 mt-1">
                    {Object.keys(editing.data).map((k) => (
                      <div key={k}>
                        <Label className="text-xs">{k}</Label>
                        <Input value={editing.data[k] ?? ""} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, [k]: e.target.value } })} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm (motivo, sem senha — RPC do CREA usa motivo + auditoria) */}
      <Dialog open={!!delTarget} onOpenChange={(o) => { if (!o && !delBusy) setDelTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir registro</DialogTitle>
            <DialogDescription>Exclusão lógica registrada na auditoria do CREA.</DialogDescription>
          </DialogHeader>
          <div className="text-sm"><strong>Registro:</strong> {delTarget?.label}</div>
          <div>
            <Label>Motivo *</Label>
            <Textarea rows={2} value={delReason} onChange={(e) => setDelReason(e.target.value)} placeholder="Ex.: registro duplicado" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDelTarget(null)} disabled={delBusy}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={delBusy}>Confirmar exclusão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import adaptativo */}
      <Dialog open={importOpen} onOpenChange={(o) => { if (!importing) { setImportOpen(o); if (!o) setPreview(null); } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Importar · {config.title}</DialogTitle>
            <DialogDescription>
              O sistema se adapta à sua planilha: colunas conhecidas vão para campos próprios; colunas extras são preservadas em <code>data</code> e aparecem na exportação.
            </DialogDescription>
          </DialogHeader>
          <Input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={(e) => onPickFile(e.target.files?.[0] ?? null)} />
          {preview && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{preview.records.length} linhas</Badge>
                <Badge variant="outline">{preview.headers.length} colunas</Badge>
                {preview.extras.length > 0 && <Badge>{preview.extras.length} extras preservadas</Badge>}
              </div>
              {preview.extras.length > 0 && (
                <p className="text-xs text-muted-foreground">Extras: {preview.extras.join(", ")}</p>
              )}
              <div className="border rounded max-h-72 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>{preview.headers.map((h) => <th key={h} className="text-left px-2 py-1 whitespace-nowrap">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.records.slice(0, 15).map((r, i) => (
                      <tr key={i} className="border-t">
                        {preview.headers.map((h, j) => {
                          const key = config.fields.find((f) => f.key === h.toLowerCase().trim().replace(/\s+/g,"_") || f.label.toLowerCase() === h.toLowerCase())?.key;
                          const val = key ? r[key] : r.data?.[h];
                          return <td key={j} className="px-2 py-1 whitespace-nowrap">{String(val ?? "")}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setImportOpen(false)} disabled={importing}>Cancelar</Button>
            <Button onClick={commitImport} disabled={!preview || importing}>
              <Upload className="w-4 h-4 mr-1" /> {importing ? "Importando..." : "Importar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
