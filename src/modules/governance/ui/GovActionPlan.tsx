import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ActionPlan {
  id: string; module_key: string; titulo: string; descricao: string | null;
  ofensor: string | null; causa_raiz: string | null; acao: string | null;
  resultado_esperado: string | null; responsavel: string | null;
  prazo: string | null; prioridade: string; status: string; observacoes: string | null;
  created_at: string;
}
const STATUS = ["planejada", "em_andamento", "concluida", "atrasada", "cancelada"];
const PRIOR = ["baixa", "media", "alta", "critica"];

const STATUS_COLOR: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  concluida: "default", em_andamento: "secondary", atrasada: "destructive",
  planejada: "outline", cancelada: "outline",
};

export function GovActionPlan({ moduleKey, canEdit }: { moduleKey: string; canEdit: boolean }) {
  const { user } = useAuth();
  const [items, setItems] = useState<ActionPlan[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<ActionPlan>>({});
  const [search, setSearch] = useState("");

  const load = async () => {
    const { data } = await supabase.from("governance_action_plan").select("*").eq("module_key", moduleKey).order("created_at", { ascending: false });
    setItems((data ?? []) as ActionPlan[]);
  };
  useEffect(() => { load(); }, [moduleKey]);

  useEffect(() => {
    const ch = supabase.channel(`gov-ap-${moduleKey}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "governance_action_plan", filter: `module_key=eq.${moduleKey}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [moduleKey]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) => [i.titulo, i.acao, i.responsavel, i.ofensor, i.causa_raiz].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [items, search]);

  const save = async () => {
    if (!editing.titulo) { toast.error("Título é obrigatório"); return; }
    const payload: any = {
      module_key: moduleKey,
      titulo: editing.titulo, descricao: editing.descricao ?? null,
      ofensor: editing.ofensor ?? null, causa_raiz: editing.causa_raiz ?? null,
      acao: editing.acao ?? null, resultado_esperado: editing.resultado_esperado ?? null,
      responsavel: editing.responsavel ?? null, prazo: editing.prazo ?? null,
      prioridade: editing.prioridade ?? "media", status: editing.status ?? "planejada",
      observacoes: editing.observacoes ?? null,
    };
    if (editing.id) {
      const { error } = await supabase.from("governance_action_plan").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
    } else {
      payload.created_by = user?.id;
      const { error } = await supabase.from("governance_action_plan").insert(payload);
      if (error) { toast.error(error.message); return; }
    }
    toast.success("Salvo"); setOpen(false); setEditing({}); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta ação?")) return;
    const { error } = await supabase.from("governance_action_plan").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Excluído"); load();
  };

  return (
    <Card><CardContent className="p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Input placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        {canEdit && (
          <Button size="sm" onClick={() => { setEditing({ status: "planejada", prioridade: "media" }); setOpen(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1" />Nova ação
          </Button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead><TableHead>Ofensor</TableHead><TableHead>Responsável</TableHead>
            <TableHead>Prazo</TableHead><TableHead>Prioridade</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Sem ações</TableCell></TableRow> :
            filtered.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">{i.titulo}</TableCell>
                <TableCell className="text-xs">{i.ofensor ?? "—"}</TableCell>
                <TableCell className="text-xs">{i.responsavel ?? "—"}</TableCell>
                <TableCell className="text-xs">{i.prazo ? new Date(i.prazo).toLocaleDateString("pt-BR") : "—"}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{i.prioridade}</Badge></TableCell>
                <TableCell><Badge variant={STATUS_COLOR[i.status] ?? "outline"} className="text-[10px]">{i.status}</Badge></TableCell>
                <TableCell>
                  {canEdit && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(i); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(i.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing.id ? "Editar ação" : "Nova ação"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Título</Label><Input value={editing.titulo ?? ""} onChange={(e) => setEditing({ ...editing, titulo: e.target.value })} /></div>
            <div><Label>Ofensor</Label><Input value={editing.ofensor ?? ""} onChange={(e) => setEditing({ ...editing, ofensor: e.target.value })} /></div>
            <div><Label>Causa Raiz</Label><Input value={editing.causa_raiz ?? ""} onChange={(e) => setEditing({ ...editing, causa_raiz: e.target.value })} /></div>
            <div className="col-span-2"><Label>Ação</Label><Textarea value={editing.acao ?? ""} onChange={(e) => setEditing({ ...editing, acao: e.target.value })} /></div>
            <div className="col-span-2"><Label>Resultado Esperado</Label><Input value={editing.resultado_esperado ?? ""} onChange={(e) => setEditing({ ...editing, resultado_esperado: e.target.value })} /></div>
            <div><Label>Responsável</Label><Input value={editing.responsavel ?? ""} onChange={(e) => setEditing({ ...editing, responsavel: e.target.value })} /></div>
            <div><Label>Prazo</Label><Input type="date" value={editing.prazo ?? ""} onChange={(e) => setEditing({ ...editing, prazo: e.target.value })} /></div>
            <div><Label>Prioridade</Label>
              <Select value={editing.prioridade ?? "media"} onValueChange={(v) => setEditing({ ...editing, prioridade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIOR.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={editing.status ?? "planejada"} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Observações</Label><Textarea value={editing.observacoes ?? ""} onChange={(e) => setEditing({ ...editing, observacoes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardContent></Card>
  );
}
