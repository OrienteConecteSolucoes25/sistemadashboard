import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useComunicacaoAccess } from "../hooks/useComunicacaoAccess";
import { useActiveBrandKit } from "../hooks/useActiveBrandKit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Instagram, Facebook, Linkedin, Music2, Youtube, Plus, Trash2, RefreshCw, Send, ExternalLink, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PROVIDERS = [
  { key: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500" },
  { key: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-500" },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-sky-700" },
  { key: "tiktok", label: "TikTok", icon: Music2, color: "text-foreground" },
  { key: "youtube", label: "YouTube", icon: Youtube, color: "text-red-500" },
] as const;

const STATUS_BADGE: Record<string, string> = {
  connected: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  expired: "bg-amber-500/15 text-amber-700",
  revoked: "bg-destructive/15 text-destructive",
  error: "bg-destructive/15 text-destructive",
};

const QUEUE_BADGE: Record<string, string> = {
  agendado: "bg-blue-500/15 text-blue-700",
  enviando: "bg-amber-500/15 text-amber-700",
  publicado: "bg-emerald-500/15 text-emerald-700",
  erro: "bg-destructive/15 text-destructive",
  cancelado: "bg-muted text-muted-foreground",
};

export default function IntegracoesSociaisPage() {
  const { companyId } = useComunicacaoAccess();
  const { activeBrand } = useActiveBrandKit();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  async function load() {
    if (!companyId) return;
    setLoading(true);
    const [a, q] = await Promise.all([
      supabase.from("comm_social_accounts").select("*").eq("company_id", companyId).eq("is_deleted", false).order("created_at", { ascending: false }),
      supabase.from("comm_social_publish_queue").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(50),
    ]);
    setAccounts(a.data ?? []);
    setQueue(q.data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [companyId]);

  async function disconnect(id: string) {
    if (!confirm("Desconectar esta conta?")) return;
    const { error } = await supabase.from("comm_social_accounts").update({ status: "revoked" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Conta desconectada"); load(); }
  }

  async function retryQueue(id: string) {
    const { data, error } = await supabase.functions.invoke("comm-social-publish", { body: { queue_id: id } });
    if (error || (data as any)?.ok === false) { toast.error((error as any)?.message ?? (data as any)?.error ?? "Falha"); }
    else { toast.success("Reenviado"); load(); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-display font-bold">Integrações Sociais</h1>
          <p className="text-sm text-muted-foreground">
            Conecte contas de Meta (Instagram/Facebook), LinkedIn, TikTok e YouTube. Publique e agende direto pelo calendário.
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" /> Conectar conta
            </Button>
          </DialogTrigger>
          <ConnectDialog
            companyId={companyId}
            clientBrandId={activeBrand?.id ?? null}
            editing={editing}
            onDone={() => { setOpen(false); setEditing(null); load(); }}
          />
        </Dialog>
      </div>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="flex items-start gap-3 py-3 text-xs">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <strong>Scaffold:</strong> a publicação real via Meta Graph API e LinkedIn Marketing API exige aprovação do app na plataforma e tokens OAuth de longa duração.
            Por ora, este módulo permite registrar contas, agendar e simular publicação. Para ativar o fluxo real, peça
            "ativar publicação Meta/LinkedIn" para o Diretor OCS configurar o OAuth.
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="contas">
        <TabsList>
          <TabsTrigger value="contas">Contas conectadas ({accounts.length})</TabsTrigger>
          <TabsTrigger value="fila">Fila de publicações ({queue.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="contas" className="space-y-3 mt-3">
          {loading && <div className="text-sm text-muted-foreground">Carregando...</div>}
          {!loading && accounts.length === 0 && (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma conta conectada ainda.
            </CardContent></Card>
          )}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((acc) => {
              const P = PROVIDERS.find(p => p.key === acc.provider);
              const Icon = P?.icon ?? Instagram;
              return (
                <Card key={acc.id} className="card-elegant">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className={`h-5 w-5 ${P?.color ?? ""}`} />
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">{acc.account_name}</CardTitle>
                          {acc.account_handle && <div className="text-xs text-muted-foreground truncate">@{acc.account_handle}</div>}
                        </div>
                      </div>
                      <Badge className={STATUS_BADGE[acc.status] ?? ""}>{acc.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-xs space-y-2">
                    <div className="text-muted-foreground">
                      Provider: <span className="text-foreground font-medium">{P?.label ?? acc.provider}</span>
                    </div>
                    {acc.token_expires_at && (
                      <div className="text-muted-foreground">
                        Expira: {new Date(acc.token_expires_at).toLocaleDateString("pt-BR")}
                      </div>
                    )}
                    {acc.last_error && <div className="text-destructive">{acc.last_error}</div>}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditing(acc); setOpen(true); }}>
                        <RefreshCw className="h-3 w-3 mr-1" /> Reautenticar
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => disconnect(acc.id)}>
                        <Trash2 className="h-3 w-3 mr-1" /> Desconectar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="pt-4">
            <h3 className="text-xs font-display uppercase text-muted-foreground mb-2">Provedores disponíveis</h3>
            <div className="flex flex-wrap gap-2">
              {PROVIDERS.map(p => {
                const Icon = p.icon;
                return (
                  <Button key={p.key} variant="outline" size="sm" onClick={() => { setEditing({ provider: p.key }); setOpen(true); }}>
                    <Icon className={`h-4 w-4 mr-1 ${p.color}`} /> {p.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fila" className="space-y-2 mt-3">
          {queue.length === 0 && (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma publicação na fila.
            </CardContent></Card>
          )}
          {queue.map((q) => (
            <Card key={q.id} className="card-elegant">
              <CardContent className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={QUEUE_BADGE[q.status] ?? ""}>{q.status}</Badge>
                    <span className="text-xs text-muted-foreground">{q.entidade_tipo}</span>
                    {q.scheduled_for && (
                      <span className="text-xs text-muted-foreground">
                        · {new Date(q.scheduled_for).toLocaleString("pt-BR")}
                      </span>
                    )}
                  </div>
                  {q.caption && <div className="text-sm mt-1 line-clamp-2">{q.caption}</div>}
                  {q.last_error && <div className="text-xs text-destructive mt-1">{q.last_error}</div>}
                </div>
                <div className="flex gap-1 shrink-0">
                  {q.external_url && (
                    <Button size="sm" variant="ghost" asChild>
                      <a href={q.external_url} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                  {(q.status === "erro" || q.status === "agendado") && (
                    <Button size="sm" variant="outline" onClick={() => retryQueue(q.id)}>
                      <Send className="h-3 w-3 mr-1" /> Publicar agora
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ConnectDialog({
  companyId, clientBrandId, editing, onDone,
}: {
  companyId: string | null;
  clientBrandId: string | null;
  editing: any | null;
  onDone: () => void;
}) {
  const [provider, setProvider] = useState(editing?.provider ?? "instagram");
  const [accountName, setAccountName] = useState(editing?.account_name ?? "");
  const [handle, setHandle] = useState(editing?.account_handle ?? "");
  const [externalId, setExternalId] = useState(editing?.external_id ?? "");
  const [pageId, setPageId] = useState(editing?.page_id ?? "");
  const [token, setToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [scopes, setScopes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setProvider(editing?.provider ?? "instagram");
    setAccountName(editing?.account_name ?? "");
    setHandle(editing?.account_handle ?? "");
    setExternalId(editing?.external_id ?? "");
    setPageId(editing?.page_id ?? "");
  }, [editing]);

  async function save() {
    if (!companyId) return toast.error("Empresa não definida");
    if (!accountName.trim()) return toast.error("Informe o nome da conta");
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("comm_social_save_account" as any, {
        _id: editing?.id ?? null,
        _company: companyId,
        _client_brand: clientBrandId,
        _provider: provider,
        _account_name: accountName.trim(),
        _account_handle: handle.trim() || null,
        _external_id: externalId.trim() || null,
        _page_id: pageId.trim() || null,
        _scopes: scopes ? scopes.split(",").map(s => s.trim()).filter(Boolean) : null,
        _token: token || null,
        _refresh_token: refreshToken || null,
        _expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        _metadata: {},
      });
      if (error) throw error;
      const r: any = data;
      if (!r?.ok) {
        if (r?.error === "master_key_missing") {
          toast.error("Chave mestra de credenciais sociais não configurada. Peça a um admin para configurar.");
        } else {
          throw new Error(r?.error ?? "Falha");
        }
      } else {
        toast.success(editing?.id ? "Conta atualizada" : "Conta conectada (scaffold)");
        onDone();
      }
    } catch (e: any) {
      toast.error(e.message ?? "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{editing?.id ? "Reautenticar conta" : "Conectar conta social"}</DialogTitle>
        <DialogDescription className="text-xs">
          Insira as credenciais OAuth obtidas no painel do provedor. As credenciais são cifradas com pgcrypto (master key).
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Provedor</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROVIDERS.map(p => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Nome da conta *</Label>
            <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Oriente Conecte" />
          </div>
          <div>
            <Label className="text-xs">@handle</Label>
            <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="oriente.conecte" />
          </div>
          <div>
            <Label className="text-xs">External ID</Label>
            <Input value={externalId} onChange={(e) => setExternalId(e.target.value)} placeholder="IG/FB/LI ID" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Page ID (Facebook/Instagram Business)</Label>
            <Input value={pageId} onChange={(e) => setPageId(e.target.value)} />
          </div>
        </div>
        <div>
          <Label className="text-xs">Access Token</Label>
          <Textarea value={token} onChange={(e) => setToken(e.target.value)} rows={2} placeholder="EAAB..." />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Refresh Token (opcional)</Label>
            <Input value={refreshToken} onChange={(e) => setRefreshToken(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Expira em</Label>
            <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
        </div>
        <div>
          <Label className="text-xs">Scopes (vírgula)</Label>
          <Input value={scopes} onChange={(e) => setScopes(e.target.value)} placeholder="pages_read_engagement, pages_manage_posts" />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={save} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
          {editing?.id ? "Atualizar" : "Conectar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
