import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { KeyRound, Plus, Eye, EyeOff, Copy, ShieldAlert, Lock } from "lucide-react";

const sb: any = supabase;

export default function CredenciaisPage() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMaster, setHasMaster] = useState<boolean | null>(null);

  // master key dialog
  const [mkOpen, setMkOpen] = useState(false);
  const [mk, setMk] = useState("");

  // form
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  // reveal
  const [revealId, setRevealId] = useState<string | null>(null);
  const [revealReason, setRevealReason] = useState("");
  const [revealed, setRevealed] = useState<{ login: string; senha: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await sb.from("crea_credentials").select("id,uf,portal_url,login,status,observacoes,updated_at").eq("is_deleted", false).order("updated_at", { ascending: false });
    setRows(data ?? []);
    const { data: cfg } = await sb.from("crea_admin_config").select("key").eq("key", "credentials_master_key").maybeSingle();
    setHasMaster(!!cfg);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const saveMaster = async () => {
    if (mk.length < 12) { toast.error("Use pelo menos 12 caracteres."); return; }
    const { data, error } = await sb.rpc("crea_set_master_key", { _pwd: mk });
    if (error || !data?.ok) { toast.error(error?.message ?? data?.error ?? "Falha"); return; }
    toast.success("Chave-mestra definida.");
    setMkOpen(false); setMk(""); load();
  };

  const startNew = () => { setEditing({ uf: "", portal_url: "", login: "", senha: "", status: "ativo", observacoes: "" }); setFormOpen(true); };

  const saveCredential = async () => {
    if (!editing.uf || !editing.login) { toast.error("UF e Login são obrigatórios."); return; }
    const { data: cu } = await sb.from("company_users").select("company_id").eq("user_id", (await sb.auth.getUser()).data.user?.id).maybeSingle();
    const { data, error } = await sb.rpc("crea_save_credential", {
      _id: editing.id ?? null, _company: cu?.company_id ?? null, _uf: editing.uf,
      _empresa_crea: editing.empresa_crea_id ?? null, _rt: editing.rt_id ?? null,
      _portal: editing.portal_url ?? null, _login: editing.login, _senha: editing.senha ?? null,
      _status: editing.status ?? "ativo", _obs: editing.observacoes ?? null,
    });
    if (error || !data?.ok) { toast.error(error?.message ?? data?.error ?? "Falha"); return; }
    toast.success("Credencial salva."); setFormOpen(false); setEditing(null); load();
  };

  const doReveal = async () => {
    if (revealReason.trim().length < 3) { toast.error("Informe o motivo."); return; }
    const { data, error } = await sb.rpc("crea_reveal_credential", { _id: revealId, _reason: revealReason.trim() });
    if (error || !data?.ok) { toast.error(error?.message ?? data?.error ?? "Falha"); return; }
    setRevealed({ login: data.login, senha: data.senha });
    // auto-hide em 30s
    setTimeout(() => { setRevealed(null); setRevealId(null); setRevealReason(""); }, 30000);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><KeyRound className="w-6 h-6 text-primary" /> Credenciais CREA</h1>
        <p className="text-sm text-muted-foreground">Logins e senhas dos portais CREA. Senhas cifradas; revelação exige motivo e fica auditada.</p>
      </div>

      {hasMaster === false && (
        <Alert variant="destructive">
          <ShieldAlert className="w-4 h-4" />
          <AlertTitle>Chave-mestra não definida</AlertTitle>
          <AlertDescription className="space-y-2">
            <div>Antes de cadastrar credenciais, um administrador precisa definir a chave-mestra de cifragem.</div>
            {isAdmin && <Button size="sm" variant="outline" onClick={() => setMkOpen(true)}><Lock className="w-4 h-4 mr-1" /> Definir chave-mestra</Button>}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => {
          const csv = ["uf,portal,login,senha_mascarada,status",
            ...rows.map(r => `${r.uf},${r.portal_url ?? ""},${r.login},••••••••,${r.status}`)].join("\n");
          const blob = new Blob([csv], { type: "text/csv" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob); a.download = "credenciais-crea.csv"; a.click();
          toast.success("Exportado (senhas mascaradas)");
        }}>Exportar (mascarado)</Button>
        <Button onClick={startNew} disabled={hasMaster === false}><Plus className="w-4 h-4 mr-1" /> Nova credencial</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Credenciais cadastradas ({rows.length})</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2">UF</th>
                <th className="text-left px-3 py-2">Portal</th>
                <th className="text-left px-3 py-2">Login</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-right px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Carregando...</td></tr>
                : rows.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhuma credencial.</td></tr>
                : rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2"><Badge variant="outline">{r.uf}</Badge></td>
                  <td className="px-3 py-2 max-w-xs truncate">{r.portal_url ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.login}</td>
                  <td className="px-3 py-2"><Badge variant="secondary">{r.status}</Badge></td>
                  <td className="px-3 py-2 text-right">
                    <Button size="sm" variant="ghost" onClick={() => { setRevealId(r.id); setRevealed(null); setRevealReason(""); }}>
                      <Eye className="w-4 h-4 mr-1" /> Revelar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Master key */}
      <Dialog open={mkOpen} onOpenChange={setMkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chave-mestra de cifragem</DialogTitle>
            <DialogDescription>Mín. 12 caracteres. Guarde em local seguro — sem ela, senhas existentes não podem ser reveladas.</DialogDescription>
          </DialogHeader>
          <Input type="password" value={mk} onChange={(e) => setMk(e.target.value)} />
          <DialogFooter><Button onClick={saveMaster}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form */}
      <Dialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar" : "Nova"} credencial</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>UF *</Label><Input value={editing.uf} onChange={(e) => setEditing({ ...editing, uf: e.target.value.toUpperCase().slice(0,2) })} /></div>
                <div><Label>Status</Label><Input value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} /></div>
              </div>
              <div><Label>Portal (URL)</Label><Input value={editing.portal_url ?? ""} onChange={(e) => setEditing({ ...editing, portal_url: e.target.value })} /></div>
              <div><Label>Login *</Label><Input value={editing.login} onChange={(e) => setEditing({ ...editing, login: e.target.value })} /></div>
              <div><Label>Senha {editing.id && "(deixe em branco para manter)"}</Label><Input type="password" value={editing.senha ?? ""} onChange={(e) => setEditing({ ...editing, senha: e.target.value })} /></div>
              <div><Label>Observações</Label><Textarea rows={2} value={editing.observacoes ?? ""} onChange={(e) => setEditing({ ...editing, observacoes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={saveCredential}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reveal */}
      <Dialog open={!!revealId} onOpenChange={(o) => { if (!o) { setRevealId(null); setRevealed(null); setRevealReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revelar senha</DialogTitle>
            <DialogDescription>Esta ação fica auditada. Informe o motivo.</DialogDescription>
          </DialogHeader>
          {revealed ? (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Login</div>
              <div className="font-mono p-2 bg-muted rounded">{revealed.login}</div>
              <div className="text-xs text-muted-foreground">Senha (oculta em 30s)</div>
              <div className="font-mono p-2 bg-muted rounded flex items-center justify-between">
                <span>{revealed.senha}</span>
                <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(revealed.senha); toast.success("Copiada"); }}><Copy className="w-4 h-4" /></Button>
              </div>
            </div>
          ) : (
            <>
              <Label>Motivo *</Label>
              <Textarea rows={2} value={revealReason} onChange={(e) => setRevealReason(e.target.value)} />
              <DialogFooter><Button onClick={doReveal}><EyeOff className="w-4 h-4 mr-1" /> Revelar</Button></DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
