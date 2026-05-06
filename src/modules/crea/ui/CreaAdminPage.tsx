import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Shield, Users, KeyRound, BookOpen, Settings, ShieldAlert, Plus } from "lucide-react";

const sb: any = supabase;

const CREA_ROLES = ["crea_admin","crea_analista","crea_responsavel_tecnico","crea_auditor","crea_visualizador"] as const;

export default function CreaAdminPage() {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Card><CardContent className="py-12 text-center text-muted-foreground">Apenas administradores podem acessar a Administração do CREA.</CardContent></Card>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6 text-primary" /> Admin · CREA & ART</h1>
        <p className="text-sm text-muted-foreground">Papéis, chave-mestra, fontes da IA e auditoria.</p>
      </div>
      <Tabs defaultValue="papeis">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="papeis"><Users className="w-4 h-4 mr-1" /> Papéis</TabsTrigger>
          <TabsTrigger value="masterkey"><KeyRound className="w-4 h-4 mr-1" /> Chave-mestra</TabsTrigger>
          <TabsTrigger value="fontes"><BookOpen className="w-4 h-4 mr-1" /> Fontes IA</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-1" /> Configurações</TabsTrigger>
          <TabsTrigger value="auditoria"><ShieldAlert className="w-4 h-4 mr-1" /> Auditoria</TabsTrigger>
        </TabsList>
        <TabsContent value="papeis" className="mt-4"><PapeisTab /></TabsContent>
        <TabsContent value="masterkey" className="mt-4"><MasterKeyTab /></TabsContent>
        <TabsContent value="fontes" className="mt-4"><FontesTab /></TabsContent>
        <TabsContent value="settings" className="mt-4"><SettingsTab /></TabsContent>
        <TabsContent value="auditoria" className="mt-4"><AuditTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function PapeisTab() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [filter, setFilter] = useState("");

  const load = async () => {
    const [{ data: ps }, { data: rs }] = await Promise.all([
      sb.from("profiles").select("id,email,full_name").order("full_name"),
      sb.from("user_roles").select("user_id,role").in("role", CREA_ROLES as any),
    ]);
    setProfiles(ps ?? []); setRoles(rs ?? []);
  };
  useEffect(() => { load(); }, []);

  const rolesByUser = useMemo(() => {
    const m: Record<string,string[]> = {};
    roles.forEach(r => (m[r.user_id] ??= []).push(r.role));
    return m;
  }, [roles]);

  const toggle = async (uid: string, role: string, has: boolean) => {
    if (has) {
      const { error } = await sb.from("user_roles").delete().eq("user_id", uid).eq("role", role);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await sb.from("user_roles").insert({ user_id: uid, role });
      if (error) return toast.error(error.message);
    }
    toast.success("Papel atualizado"); load();
  };

  const filtered = profiles.filter(p => !filter || (p.full_name??"").toLowerCase().includes(filter.toLowerCase()) || (p.email??"").toLowerCase().includes(filter.toLowerCase()));

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Papéis CREA</CardTitle><Input placeholder="Buscar..." value={filter} onChange={e=>setFilter(e.target.value)} className="max-w-sm" /></CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr><th className="text-left px-3 py-2">Usuário</th>{CREA_ROLES.map(r=><th key={r} className="px-2 py-2 text-center text-xs">{r.replace("crea_","")}</th>)}</tr></thead>
          <tbody>{filtered.map(p=>{
            const ur = rolesByUser[p.id] ?? [];
            return (
              <tr key={p.id} className="border-t">
                <td className="px-3 py-2"><div className="font-medium">{p.full_name || p.email}</div><div className="text-xs text-muted-foreground">{p.email}</div></td>
                {CREA_ROLES.map(role=>{
                  const has = ur.includes(role);
                  return <td key={role} className="px-2 py-2 text-center"><Switch checked={has} onCheckedChange={()=>toggle(p.id,role,has)} /></td>;
                })}
              </tr>
            );
          })}</tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function MasterKeyTab() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [pwd, setPwd] = useState("");
  useEffect(() => { (async () => {
    const { data } = await sb.from("crea_admin_config").select("key").eq("key","credentials_master_key").maybeSingle();
    setHasKey(!!data);
  })(); }, []);
  const save = async () => {
    if (pwd.length < 12) return toast.error("Mín. 12 caracteres");
    const { data, error } = await sb.rpc("crea_set_master_key",{ _pwd: pwd });
    if (error || !data?.ok) return toast.error(error?.message ?? data?.error);
    toast.success("Chave atualizada"); setPwd(""); setHasKey(true);
  };
  return (
    <Card><CardHeader><CardTitle className="text-base">Chave-mestra de credenciais</CardTitle></CardHeader>
      <CardContent className="space-y-3 max-w-md">
        <p className="text-xs text-muted-foreground">Status: <Badge variant={hasKey?"default":"destructive"}>{hasKey?"definida":"não definida"}</Badge></p>
        <Label>{hasKey ? "Rotacionar (substituir) chave" : "Definir chave-mestra"}</Label>
        <Input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Mínimo 12 caracteres" />
        <Button onClick={save}>Salvar</Button>
        <p className="text-xs text-muted-foreground">⚠️ Trocar a chave invalida a leitura de senhas existentes — re-cadastre as senhas após a rotação.</p>
      </CardContent>
    </Card>
  );
}

function FontesTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const load = async () => {
    const { data } = await sb.from("crea_ai_sources").select("*").eq("is_deleted",false).order("created_at",{ascending:false});
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);
  const startNew = () => { setEditing({ titulo:"", tipo:"DN", uf:"BR", conteudo:"", link:"", ativo:true }); setOpen(true); };
  const save = async () => {
    if (!editing.titulo || !editing.conteudo) return toast.error("Título e conteúdo são obrigatórios");
    const payload = { ...editing };
    if (editing.id) { const { error } = await sb.from("crea_ai_sources").update(payload).eq("id",editing.id); if (error) return toast.error(error.message); }
    else { const { error } = await sb.from("crea_ai_sources").insert(payload); if (error) return toast.error(error.message); }
    toast.success("Salvo"); setOpen(false); setEditing(null); load();
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Fontes para o Assistente IA</CardTitle><Button size="sm" onClick={startNew}><Plus className="w-4 h-4 mr-1" /> Nova fonte</Button></CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr><th className="px-3 py-2 text-left">Título</th><th className="px-3 py-2">Tipo</th><th className="px-3 py-2">UF</th><th className="px-3 py-2">Ativa</th></tr></thead>
          <tbody>{rows.map(r=>(
            <tr key={r.id} className="border-t cursor-pointer hover:bg-muted/40" onClick={()=>{setEditing(r); setOpen(true);}}>
              <td className="px-3 py-2">{r.titulo}</td><td className="px-3 py-2 text-center"><Badge variant="outline">{r.tipo}</Badge></td>
              <td className="px-3 py-2 text-center">{r.uf}</td><td className="px-3 py-2 text-center">{r.ativo?"Sim":"Não"}</td>
            </tr>
          ))}</tbody>
        </table>
      </CardContent>
      <Dialog open={open} onOpenChange={(o)=>{setOpen(o); if (!o) setEditing(null);}}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing?.id?"Editar":"Nova"} fonte</DialogTitle></DialogHeader>
          {editing && (<div className="grid gap-3">
            <div><Label>Título *</Label><Input value={editing.titulo} onChange={e=>setEditing({...editing,titulo:e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tipo</Label><Input value={editing.tipo??""} onChange={e=>setEditing({...editing,tipo:e.target.value})} placeholder="DN, PL, Resolução..." /></div>
              <div><Label>UF</Label><Input value={editing.uf??""} onChange={e=>setEditing({...editing,uf:e.target.value.toUpperCase()})} /></div>
            </div>
            <div><Label>Link</Label><Input value={editing.link??""} onChange={e=>setEditing({...editing,link:e.target.value})} /></div>
            <div><Label>Conteúdo *</Label><Textarea rows={8} value={editing.conteudo??""} onChange={e=>setEditing({...editing,conteudo:e.target.value})} /></div>
            <div className="flex items-center gap-2"><Switch checked={!!editing.ativo} onCheckedChange={v=>setEditing({...editing,ativo:v})} /><Label>Ativa</Label></div>
          </div>)}
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function SettingsTab() {
  return <Card><CardContent className="py-8 text-sm text-muted-foreground">Configurações por empresa em <code>crea_module_settings</code> são atualizadas pela própria área da empresa. Aqui apenas inspecionamos.</CardContent></Card>;
}

function AuditTab() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { (async () => {
    const { data } = await sb.from("crea_audit_logs").select("*").order("created_at",{ascending:false}).limit(200);
    setRows(data ?? []);
  })(); }, []);
  return (
    <Card><CardContent className="overflow-x-auto p-0">
      <table className="w-full text-xs">
        <thead className="bg-muted/50"><tr><th className="px-3 py-2 text-left">Quando</th><th className="px-3 py-2 text-left">Ação</th><th className="px-3 py-2 text-left">Entidade</th><th className="px-3 py-2 text-left">Obs</th></tr></thead>
        <tbody>{rows.map(r=>(
          <tr key={r.id} className="border-t"><td className="px-3 py-1.5">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
          <td className="px-3 py-1.5"><Badge variant="outline">{r.action}</Badge></td>
          <td className="px-3 py-1.5">{r.nome_entidade}</td><td className="px-3 py-1.5 text-muted-foreground">{r.observacoes}</td></tr>
        ))}</tbody>
      </table>
    </CardContent></Card>
  );
}
