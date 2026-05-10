import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useGovCompany } from "../lib/useGovCompany";

export type SimpleField = { key: string; label: string; type?: "text" | "textarea" | "color" };

export function SimpleCrudTab({
  table, title, description, fields, extraDefaults = {},
}: {
  table: string;
  title: string;
  description: string;
  fields: SimpleField[];
  extraDefaults?: Record<string, any>;
}) {
  const { companyId } = useGovCompany();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  async function load() {
    if (!companyId) return;
    setLoading(true);
    const { data, error } = await (supabase as any).from(table)
      .select("*").eq("company_id", companyId).eq("is_deleted", false)
      .order("nome", { ascending: true });
    if (error) toast.error(error.message); else setRows(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [companyId]);

  function openNew() { setEditing(null); setForm({}); setOpen(true); }
  function openEdit(r: any) { setEditing(r); setForm(r); setOpen(true); }

  async function save() {
    if (!companyId) return;
    if (!form.nome || !String(form.nome).trim()) { toast.error("Informe o nome"); return; }
    const payload: any = { ...extraDefaults };
    for (const f of fields) payload[f.key] = form[f.key] ?? null;
    payload.company_id = companyId;
    const sb: any = supabase;
    if (editing) {
      const { error } = await sb.from(table).update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Atualizado");
    } else {
      const { error } = await sb.from(table).insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Criado");
    }
    setOpen(false);
    load();
  }

  async function remove(r: any) {
    const reason = prompt(`Motivo para excluir "${r.nome}"?`);
    if (!reason || reason.trim().length < 3) return;
    const { data, error } = await (supabase as any).rpc("crea_soft_delete", {
      _table: table, _id: r.id, _reason: reason,
    });
    if (error) return toast.error(error.message);
    if (!data?.ok) return toast.error(data?.error ?? "Erro");
    toast.success("Excluído");
    load();
  }

  return (
    <Card className="card-elegant">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" />Novo</Button>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> :
         rows.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum registro. Clique em "Novo".</p> :
         <Table>
           <TableHeader><TableRow>
             {fields.map(f => <TableHead key={f.key}>{f.label}</TableHead>)}
             <TableHead className="w-32 text-right">Ações</TableHead>
           </TableRow></TableHeader>
           <TableBody>
             {rows.map(r => (
               <TableRow key={r.id}>
                 {fields.map(f => (
                   <TableCell key={f.key}>
                     {f.type === "color" && r[f.key]
                       ? <Badge style={{ background: r[f.key], color: "#fff" }}>{r[f.key]}</Badge>
                       : (r[f.key] ?? "—")}
                   </TableCell>
                 ))}
                 <TableCell className="text-right">
                   <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                   <Button size="icon" variant="ghost" onClick={() => remove(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                 </TableCell>
               </TableRow>
             ))}
           </TableBody>
         </Table>}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} · {title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {fields.map(f => (
              <div key={f.key} className="space-y-1">
                <Label>{f.label}</Label>
                {f.type === "textarea"
                  ? <Textarea value={form[f.key] ?? ""} onChange={(e) => setForm(s => ({ ...s, [f.key]: e.target.value }))} />
                  : f.type === "color"
                  ? <Input type="color" value={form[f.key] ?? "#2BBDC0"} onChange={(e) => setForm(s => ({ ...s, [f.key]: e.target.value }))} />
                  : <Input value={form[f.key] ?? ""} onChange={(e) => setForm(s => ({ ...s, [f.key]: e.target.value }))} />}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
