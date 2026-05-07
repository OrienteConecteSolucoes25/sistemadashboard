import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, Users, KeyRound, Activity, RefreshCw, ShieldAlert, Database, ListChecks, FolderKanban } from "lucide-react";
import { CadastrosGeraisTab } from "./admin/CadastrosGeraisTab";

type Profile = { id: string; email: string | null; full_name: string | null };
type RoleRow = { user_id: string; role: string };

const ENG_ROLES = ["engenharia", "planejamento", "diretoria", "suprimentos", "fibra", "admin"] as const;
type EngRole = (typeof ENG_ROLES)[number];

export default function EngAdminPage() {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Apenas administradores podem acessar a Administração da Engenharia.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" /> Admin · Engenharia
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestão administrativa, papéis, permissões, segurança e auditoria do módulo de Engenharia.
        </p>
      </div>
      <Tabs defaultValue="visao">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="visao"><Activity className="w-4 h-4 mr-1" /> Visão geral</TabsTrigger>
          <TabsTrigger value="usuarios"><Users className="w-4 h-4 mr-1" /> Usuários & Papéis</TabsTrigger>
          <TabsTrigger value="permissoes"><ListChecks className="w-4 h-4 mr-1" /> Permissões por módulo</TabsTrigger>
          <TabsTrigger value="seguranca"><KeyRound className="w-4 h-4 mr-1" /> Segurança</TabsTrigger>
          <TabsTrigger value="sync"><Database className="w-4 h-4 mr-1" /> Sincronizações</TabsTrigger>
          <TabsTrigger value="auditoria"><ShieldAlert className="w-4 h-4 mr-1" /> Auditoria</TabsTrigger>
          <TabsTrigger value="cadastros"><FolderKanban className="w-4 h-4 mr-1" /> Cadastros gerais</TabsTrigger>
        </TabsList>
        <TabsContent value="visao" className="mt-4"><VisaoGeralTab /></TabsContent>
        <TabsContent value="usuarios" className="mt-4"><UsuariosTab /></TabsContent>
        <TabsContent value="permissoes" className="mt-4"><PermissoesTab /></TabsContent>
        <TabsContent value="seguranca" className="mt-4"><SegurancaTab /></TabsContent>
        <TabsContent value="sync" className="mt-4"><SyncTab /></TabsContent>
        <TabsContent value="auditoria" className="mt-4"><AuditoriaTab /></TabsContent>
        <TabsContent value="cadastros" className="mt-4"><CadastrosGeraisTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ============== Visão geral ============== */
function VisaoGeralTab() {
  const [stats, setStats] = useState({ total: 0, deletes: 0, failed: 0, last7: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const seven = new Date(Date.now() - 7 * 86400000).toISOString();
    const [{ count: total }, { count: deletes }, { count: failed }, { count: last7 }, { data: profs }] = await Promise.all([
      supabase.from("eng_auditoria").select("id", { count: "exact", head: true }),
      supabase.from("eng_auditoria").select("id", { count: "exact", head: true }).eq("acao", "soft_delete"),
      supabase.from("eng_auditoria").select("id", { count: "exact", head: true }).eq("acao", "soft_delete_failed"),
      supabase.from("eng_auditoria").select("id", { count: "exact", head: true }).gte("created_at", seven),
      supabase.from("user_roles").select("user_id").in("role", ["engenharia","planejamento","diretoria","suprimentos","fibra"]),
    ]);
    setStats({
      total: total ?? 0, deletes: deletes ?? 0, failed: failed ?? 0, last7: last7 ?? 0,
      users: new Set((profs ?? []).map((p: any) => p.user_id)).size,
    });
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const cards = [
    { label: "Eventos auditados (total)", value: stats.total, icon: Activity, tone: "text-primary" },
    { label: "Exclusões (soft)", value: stats.deletes, icon: ShieldAlert, tone: "text-destructive" },
    { label: "Tentativas inválidas", value: stats.failed, icon: KeyRound, tone: "text-amber-600" },
    { label: "Eventos nos últimos 7 dias", value: stats.last7, icon: RefreshCw, tone: "text-blue-600" },
    { label: "Usuários com papel de Engenharia", value: stats.users, icon: Users, tone: "text-emerald-600" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="py-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <div className="text-2xl font-bold">{loading ? "…" : c.value.toLocaleString("pt-BR")}</div>
            </div>
            <c.icon className={`w-8 h-8 ${c.tone}`} />
          </CardContent>
        </Card>
      ))}
      <Card className="sm:col-span-2 lg:col-span-3">
        <CardHeader><CardTitle className="text-base">Atalhos</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/app/engenharia/rastreabilidade">Abrir Rastreabilidade</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/app/engenharia/configuracoes">Configurações de Engenharia</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/app/adm">Visibilidade global (ADM)</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============== Usuários & Papéis ============== */
function UsuariosTab() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: ps }, { data: rs }] = await Promise.all([
      supabase.from("profiles").select("id,email,full_name").order("full_name"),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    setProfiles(ps ?? []);
    setRoles((rs ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const rolesByUser = useMemo(() => {
    const m: Record<string, string[]> = {};
    roles.forEach((r) => { (m[r.user_id] ??= []).push(r.role); });
    return m;
  }, [roles]);

  const filtered = profiles.filter((p) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return (p.full_name ?? "").toLowerCase().includes(q) || (p.email ?? "").toLowerCase().includes(q);
  });

  const toggleRole = async (uid: string, role: EngRole, has: boolean) => {
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role as any);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: role as any });
      if (error) return toast.error(error.message);
    }
    await supabase.rpc("eng_log_audit" as any, {
      _acao: has ? "role_removed" : "role_assigned",
      _modulo: "Admin Engenharia",
      _entidade_tipo: "user_roles",
      _entidade_id: uid,
      _nome_entidade: role,
    });
    toast.success("Papel atualizado");
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4" /> Papéis dos usuários da Engenharia
        </CardTitle>
        <Input placeholder="Buscar usuário..." value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-sm" />
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2">Usuário</th>
              {ENG_ROLES.map((r) => <th key={r} className="px-2 py-2 text-center capitalize">{r}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={ENG_ROLES.length + 1} className="px-3 py-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : filtered.map((p) => {
              const ur = rolesByUser[p.id] ?? [];
              return (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="font-medium">{p.full_name || p.email}</div>
                    <div className="text-xs text-muted-foreground">{p.email}</div>
                  </td>
                  {ENG_ROLES.map((role) => {
                    const has = ur.includes(role);
                    return (
                      <td key={role} className="px-2 py-2 text-center">
                        <Switch checked={has} onCheckedChange={() => toggleRole(p.id, role, has)} />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

/* ============== Permissões por módulo ============== */
function PermissoesTab() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [perms, setPerms] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const MODULES = [
    "sites","atividades","pendencias","suprimentos","materiais","rfi",
    "demandas","projetos","fibra","energia","art","relatorios","governanca",
  ];

  const load = async () => {
    setLoading(true);
    const [{ data: ps }, { data: pp }] = await Promise.all([
      supabase.from("profiles").select("id,email,full_name").order("full_name"),
      supabase.from("eng_module_permissions").select("*"),
    ]);
    setProfiles(ps ?? []);
    setPerms(pp ?? []);
    if (!selected && ps?.length) setSelected(ps[0].id);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const userPerms = useMemo(() => {
    const m: Record<string, any> = {};
    perms.filter((p) => p.user_id === selected).forEach((p) => { m[p.module] = p; });
    return m;
  }, [perms, selected]);

  const upsert = async (mod: string, field: "can_view"|"can_edit"|"can_delete", value: boolean) => {
    if (!selected) return;
    const existing = userPerms[mod];
    const payload: any = { user_id: selected, module: mod, can_view: existing?.can_view ?? true, can_edit: existing?.can_edit ?? false, can_delete: existing?.can_delete ?? false, [field]: value };
    if (existing) {
      const { error } = await (supabase.from("eng_module_permissions").update(payload).eq("id", existing.id) as any);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await (supabase.from("eng_module_permissions").insert(payload) as any);
      if (error) return toast.error(error.message);
    }
    await supabase.rpc("eng_log_audit" as any, {
      _acao: "perm_changed", _modulo: "Admin Engenharia",
      _entidade_tipo: "eng_module_permissions", _entidade_id: selected,
      _nome_entidade: `${mod}.${field}=${value}`,
    });
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Permissões granulares por módulo (sobrescreve papéis)</CardTitle>
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="max-w-sm"><SelectValue placeholder="Escolher usuário" /></SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>)}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2">Módulo</th>
              <th className="px-2 py-2 text-center">Visualizar</th>
              <th className="px-2 py-2 text-center">Editar</th>
              <th className="px-2 py-2 text-center">Excluir</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : MODULES.map((mod) => {
              const p = userPerms[mod];
              return (
                <tr key={mod} className="border-t">
                  <td className="px-3 py-2 capitalize">{mod}</td>
                  <td className="px-2 py-2 text-center"><Switch checked={p?.can_view ?? true} onCheckedChange={(v) => upsert(mod, "can_view", v)} /></td>
                  <td className="px-2 py-2 text-center"><Switch checked={p?.can_edit ?? false} onCheckedChange={(v) => upsert(mod, "can_edit", v)} /></td>
                  <td className="px-2 py-2 text-center"><Switch checked={p?.can_delete ?? false} onCheckedChange={(v) => upsert(mod, "can_delete", v)} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

/* ============== Segurança (senha de exclusão) ============== */
function SegurancaTab() {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const change = async () => {
    if (pwd.length < 6) return toast.error("A senha deve ter pelo menos 6 caracteres.");
    if (pwd !== confirm) return toast.error("As senhas não conferem.");
    setBusy(true);
    const { data, error } = await (supabase.rpc as any)("eng_set_delete_password", { _new_password: pwd });
    setBusy(false);
    if (error || !data?.ok) {
      toast.error(error?.message ?? data?.error ?? "Falha ao atualizar senha.");
      return;
    }
    toast.success("Senha de exclusão atualizada com sucesso.");
    setPwd(""); setConfirm("");
  };

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><KeyRound className="w-4 h-4" /> Senha de confirmação para exclusão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-w-md">
          <p className="text-xs text-muted-foreground">
            Esta senha é exigida em todo modal de exclusão de registros da Engenharia. É armazenada apenas como hash criptografado no servidor.
          </p>
          <div>
            <Label>Nova senha</Label>
            <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="new-password" />
          </div>
          <div>
            <Label>Confirmar nova senha</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </div>
          <Button onClick={change} disabled={busy}>{busy ? "Atualizando..." : "Atualizar senha"}</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Recomendações</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <div>• A exclusão sempre exige permissão + senha + motivo.</div>
          <div>• Tentativas inválidas ficam registradas em <Badge variant="outline">soft_delete_failed</Badge>.</div>
          <div>• Registros excluídos podem ser restaurados manualmente pelo banco (<code>is_deleted=false</code>).</div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============== Sincronizações ============== */
function SyncTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("eng_sync_runs").select("*").order("ran_at", { ascending: false }).limit(100);
    setRows(data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="w-4 h-4" /> Últimas execuções de sincronização
          <Button size="sm" variant="ghost" onClick={load} className="ml-auto"><RefreshCw className={`w-4 h-4 ${loading?"animate-spin":""}`} /></Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2">Data</th>
              <th className="text-left px-3 py-2">Tipo</th>
              <th className="text-left px-3 py-2">Modo</th>
              <th className="text-left px-3 py-2">Linhas</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Mensagem</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Sem execuções.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2 whitespace-nowrap">{new Date(r.ran_at).toLocaleString("pt-BR")}</td>
                <td className="px-3 py-2">{r.kind}</td>
                <td className="px-3 py-2">{r.mode ?? "—"}</td>
                <td className="px-3 py-2">{r.row_count ?? "—"}</td>
                <td className="px-3 py-2">
                  <Badge variant={r.status === "ok" ? "default" : "destructive"}>{r.status}</Badge>
                </td>
                <td className="px-3 py-2 max-w-[320px] truncate">{r.message ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

/* ============== Auditoria (resumo + link) ============== */
function AuditoriaTab() {
  const [latest, setLatest] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("eng_auditoria").select("*").order("created_at", { ascending: false }).limit(15);
      setLatest(data ?? []); setLoading(false);
    })();
  }, []);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> Últimos 15 eventos
          <Button asChild size="sm" variant="outline" className="ml-auto">
            <Link to="/app/engenharia/rastreabilidade">Abrir rastreabilidade completa</Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2">Data</th>
              <th className="text-left px-3 py-2">Ação</th>
              <th className="text-left px-3 py-2">Módulo</th>
              <th className="text-left px-3 py-2">Registro</th>
              <th className="text-left px-3 py-2">Motivo / Obs.</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : latest.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                <td className="px-3 py-2"><Badge variant={r.acao === "soft_delete" ? "destructive" : "outline"}>{r.acao}</Badge></td>
                <td className="px-3 py-2">{r.modulo ?? "—"}</td>
                <td className="px-3 py-2">{r.payload?.nome_entidade ?? r.payload?.entidade_id ?? "—"}</td>
                <td className="px-3 py-2 max-w-[320px] truncate">{r.observacoes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
