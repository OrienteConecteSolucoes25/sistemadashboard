import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, Copy } from "lucide-react";

type Group = { id: string; name: string; color: string; description: string | null };
type Profile = { id: string; email: string | null; full_name: string | null };
type ModuleSetting = { module_key: string; module_label: string; restricted: boolean };

const Adm = () => {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/app" replace />;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">ADM — Controle de Visibilidade</h1>
        <p className="text-sm text-muted-foreground">
          Defina quais usuários veem as mesmas coisas, em quais módulos.
        </p>
      </div>
      <Tabs defaultValue="grupos">
        <TabsList>
          <TabsTrigger value="grupos">Grupos</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="modulos">Módulos</TabsTrigger>
        </TabsList>
        <TabsContent value="grupos"><GruposTab /></TabsContent>
        <TabsContent value="usuarios"><UsuariosTab /></TabsContent>
        <TabsContent value="modulos"><ModulosTab /></TabsContent>
      </Tabs>
    </div>
  );
};

// ===== Grupos =====
const GruposTab = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [form, setForm] = useState({ name: "", color: "#6366f1", description: "" });
  const load = async () => {
    const { data } = await supabase.from("visibility_groups").select("*").order("name");
    setGroups(data || []);
  };
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!form.name) return;
    const { error } = await supabase.from("visibility_groups").insert(form);
    if (error) return toast.error(error.message);
    setForm({ name: "", color: "#6366f1", description: "" });
    toast.success("Grupo criado");
    load();
  };
  const del = async (id: string) => {
    const { error } = await supabase.from("visibility_groups").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };
  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader><CardTitle>Novo grupo</CardTitle></CardHeader>
        <CardContent className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Cor</Label><Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-20" /></div>
          <div className="flex-1 min-w-[200px]"><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <Button onClick={add}><Plus className="w-4 h-4 mr-2" />Adicionar</Button>
        </CardContent>
      </Card>
      <div className="grid gap-2">
        {groups.map((g) => (
          <Card key={g.id}>
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: g.color }} />
                <div>
                  <div className="font-medium">{g.name}</div>
                  {g.description && <div className="text-xs text-muted-foreground">{g.description}</div>}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => del(g.id)}><Trash2 className="w-4 h-4" /></Button>
            </CardContent>
          </Card>
        ))}
        {!groups.length && <p className="text-sm text-muted-foreground text-center py-6">Nenhum grupo criado ainda.</p>}
      </div>
    </div>
  );
};

// ===== Usuários =====
const UsuariosTab = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberships, setMemberships] = useState<Record<string, string[]>>({});
  const [editing, setEditing] = useState<Profile | null>(null);
  const [editGroups, setEditGroups] = useState<string[]>([]);
  const [mirrorOpen, setMirrorOpen] = useState<Profile | null>(null);
  const [mirrorSource, setMirrorSource] = useState("");

  const load = async () => {
    const [{ data: ps }, { data: gs }, { data: ms }] = await Promise.all([
      supabase.from("profiles").select("id,email,full_name"),
      supabase.from("visibility_groups").select("*").order("name"),
      supabase.from("user_visibility_groups").select("user_id,group_id"),
    ]);
    setProfiles(ps || []);
    setGroups(gs || []);
    const map: Record<string, string[]> = {};
    (ms || []).forEach((m: any) => {
      map[m.user_id] = [...(map[m.user_id] || []), m.group_id];
    });
    setMemberships(map);
  };
  useEffect(() => { load(); }, []);

  const openEdit = (p: Profile) => {
    setEditing(p);
    setEditGroups(memberships[p.id] || []);
  };
  const saveEdit = async () => {
    if (!editing) return;
    await supabase.from("user_visibility_groups").delete().eq("user_id", editing.id);
    if (editGroups.length) {
      await supabase.from("user_visibility_groups").insert(editGroups.map((g) => ({ user_id: editing.id, group_id: g })));
    }
    await supabase.from("visibility_audit").insert({
      action: "update_user_groups",
      details: { user_id: editing.id, groups: editGroups },
    });
    toast.success("Grupos atualizados");
    setEditing(null);
    load();
  };

  const mirror = async () => {
    if (!mirrorOpen || !mirrorSource) return;
    const sourceGroups = memberships[mirrorSource] || [];
    await supabase.from("user_visibility_groups").delete().eq("user_id", mirrorOpen.id);
    if (sourceGroups.length) {
      await supabase.from("user_visibility_groups").insert(sourceGroups.map((g) => ({ user_id: mirrorOpen.id, group_id: g })));
    }
    await supabase.from("visibility_audit").insert({
      action: "mirror_user",
      details: { target: mirrorOpen.id, source: mirrorSource },
    });
    toast.success("Usuário espelhado");
    setMirrorOpen(null);
    setMirrorSource("");
    load();
  };

  return (
    <div className="space-y-2 mt-4">
      {profiles.map((p) => {
        const ugs = memberships[p.id] || [];
        return (
          <Card key={p.id}>
            <CardContent className="py-3 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="font-medium">{p.full_name || p.email}</div>
                <div className="text-xs text-muted-foreground">{p.email}</div>
              </div>
              <div className="flex flex-wrap gap-1 flex-1">
                {ugs.length ? ugs.map((gid) => {
                  const g = groups.find((x) => x.id === gid);
                  if (!g) return null;
                  return <Badge key={gid} style={{ backgroundColor: g.color }}>{g.name}</Badge>;
                }) : <span className="text-xs text-muted-foreground">sem grupos</span>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(p)}>Editar grupos</Button>
                <Button variant="outline" size="sm" onClick={() => setMirrorOpen(p)}>
                  <Copy className="w-3 h-3 mr-1" />Espelhar
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Grupos de {editing?.full_name || editing?.email}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {groups.map((g) => (
              <label key={g.id} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={editGroups.includes(g.id)}
                  onCheckedChange={(v) =>
                    setEditGroups(v ? [...editGroups, g.id] : editGroups.filter((x) => x !== g.id))
                  }
                />
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />
                {g.name}
              </label>
            ))}
            {!groups.length && <p className="text-sm text-muted-foreground">Crie grupos primeiro.</p>}
          </div>
          <DialogFooter><Button onClick={saveEdit}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!mirrorOpen} onOpenChange={(o) => !o && setMirrorOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Espelhar visibilidade</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong>{mirrorOpen?.full_name || mirrorOpen?.email}</strong> passará a ver as mesmas coisas que o usuário escolhido abaixo.
          </p>
          <Select value={mirrorSource} onValueChange={setMirrorSource}>
            <SelectTrigger><SelectValue placeholder="Escolher usuário-fonte" /></SelectTrigger>
            <SelectContent>
              {profiles.filter((p) => p.id !== mirrorOpen?.id).map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter><Button onClick={mirror} disabled={!mirrorSource}>Espelhar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ===== Módulos =====
const ModulosTab = () => {
  const [mods, setMods] = useState<ModuleSetting[]>([]);
  const load = async () => {
    const { data } = await supabase.from("module_visibility_settings").select("module_key,module_label,restricted").order("module_label");
    setMods(data || []);
  };
  useEffect(() => { load(); }, []);
  const toggle = async (key: string, restricted: boolean) => {
    const { error } = await supabase.from("module_visibility_settings").update({ restricted }).eq("module_key", key);
    if (error) toast.error(error.message);
    else {
      await supabase.from("visibility_audit").insert({ action: "toggle_module", details: { module: key, restricted } });
      load();
    }
  };
  return (
    <div className="space-y-2 mt-4">
      <p className="text-sm text-muted-foreground">
        Quando ativado, apenas usuários com pelo menos um grupo em comum com o registro verão o registro. Admins sempre veem tudo.
      </p>
      {mods.map((m) => (
        <Card key={m.module_key}>
          <CardContent className="py-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{m.module_label}</div>
              <div className="text-xs text-muted-foreground">{m.module_key}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{m.restricted ? "Restrito por grupo" : "Aberto a todos"}</span>
              <Switch checked={m.restricted} onCheckedChange={(v) => toggle(m.module_key, v)} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Adm;
