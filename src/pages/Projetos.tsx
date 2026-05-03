import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Eye } from "lucide-react";

type Projeto = { id: string; nome: string; cliente: string | null; status: string; created_at: string };
type Group = { id: string; name: string; color: string };

const Projetos = () => {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Projeto[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tags, setTags] = useState<Record<string, string[]>>({});
  const [moduleRestricted, setModuleRestricted] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", cliente: "", groupId: "" });

  const load = async () => {
    const [{ data: ps }, { data: gs }, { data: ms }] = await Promise.all([
      supabase.from("projetos").select("*").order("created_at", { ascending: false }),
      supabase.from("visibility_groups").select("id,name,color"),
      supabase.from("module_visibility_settings").select("restricted").eq("module_key", "projetos").maybeSingle(),
    ]);
    setItems(ps || []);
    setGroups(gs || []);
    setModuleRestricted(!!ms?.restricted);
    if (ps && ps.length) {
      const { data: rv } = await supabase
        .from("record_visibility")
        .select("record_id, group_id")
        .eq("record_table", "projetos")
        .in("record_id", ps.map((p) => p.id));
      const map: Record<string, string[]> = {};
      (rv || []).forEach((r: any) => {
        map[r.record_id] = [...(map[r.record_id] || []), r.group_id];
      });
      setTags(map);
    } else setTags({});
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!form.nome) return;
    const { data, error } = await supabase
      .from("projetos")
      .insert({ nome: form.nome, cliente: form.cliente || null })
      .select()
      .single();
    if (error) return toast.error(error.message);
    if (form.groupId && data) {
      await supabase.from("record_visibility").insert({
        record_table: "projetos",
        record_id: data.id,
        group_id: form.groupId,
      });
    }
    setForm({ nome: "", cliente: "", groupId: "" });
    setOpen(false);
    toast.success("Projeto criado");
    load();
  };

  const del = async (id: string) => {
    await supabase.from("record_visibility").delete().eq("record_table", "projetos").eq("record_id", id);
    const { error } = await supabase.from("projetos").delete().eq("id", id);
    if (error) toast.error(error.message);
    else load();
  };

  const toggleTag = async (recordId: string, groupId: string) => {
    const has = tags[recordId]?.includes(groupId);
    if (has) {
      await supabase.from("record_visibility").delete().eq("record_table", "projetos").eq("record_id", recordId).eq("group_id", groupId);
    } else {
      await supabase.from("record_visibility").insert({ record_table: "projetos", record_id: recordId, group_id: groupId });
    }
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projetos</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Eye className="w-4 h-4" />
            {moduleRestricted
              ? "Módulo restrito por grupo — você vê apenas projetos marcados com seus grupos."
              : "Módulo aberto — todos os usuários veem todos os projetos."}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Novo projeto</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo projeto</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
                <div><Label>Cliente</Label><Input value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} /></div>
                <div>
                  <Label>Grupo de visibilidade inicial</Label>
                  <Select value={form.groupId} onValueChange={(v) => setForm({ ...form, groupId: v })}>
                    <SelectTrigger><SelectValue placeholder="Nenhum (visível só para admin se restrito)" /></SelectTrigger>
                    <SelectContent>
                      {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={add}>Criar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-3">
        {items.length === 0 && (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum projeto visível.</CardContent></Card>
        )}
        {items.map((p) => (
          <Card key={p.id}>
            <CardHeader className="pb-2 flex-row justify-between items-start">
              <div>
                <CardTitle className="text-base">{p.nome}</CardTitle>
                <div className="text-sm text-muted-foreground">{p.cliente || "—"}</div>
              </div>
              {isAdmin && (
                <Button variant="ghost" size="icon" onClick={() => del(p.id)}><Trash2 className="w-4 h-4" /></Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {groups.map((g) => {
                  const active = tags[p.id]?.includes(g.id);
                  return (
                    <Badge
                      key={g.id}
                      variant={active ? "default" : "outline"}
                      style={active ? { backgroundColor: g.color, borderColor: g.color } : { borderColor: g.color, color: g.color }}
                      className={isAdmin ? "cursor-pointer" : ""}
                      onClick={() => isAdmin && toggleTag(p.id, g.id)}
                    >
                      {g.name}
                    </Badge>
                  );
                })}
                {!isAdmin && !tags[p.id]?.length && <span className="text-xs text-muted-foreground">sem grupos</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Projetos;
