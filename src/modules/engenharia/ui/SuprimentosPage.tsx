import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { fmtDate } from "../lib/storage";
import { SCRC_STATUS, listScRcBySolicit, createScRc, updateScRcStatus, deleteScRcMany, type ScRcRow } from "../lib/scrcStore";

interface Solicit {
  id: string;
  numero: string | null;
  descricao: string | null;
  status: string | null;
  prioridade?: string | null;
  solicitante: string | null;
  responsavel: string | null;
  prazo: string | null;
  itens: any;
  data: any;
  created_at: string;
  updated_at: string;
}

const STATUS_SOL = ["aberta", "em_andamento", "concluida", "cancelada"];
const ALL = "__all__";

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  "aberta": "secondary", "em_andamento": "default",
  "concluida": "outline", "cancelada": "destructive",
};

function ScRcPanel({ solicitId, onClose }: { solicitId: string; onClose: () => void }) {
  const [rows, setRows] = useState<ScRcRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [novo, setNovo] = useState({ tipo_documento: "SC", numero_documento: "", categoria: "", conta_financeira: "", centro_custo: "", observacao: "", status: "SOLICITADO" });

  const load = async () => {
    setLoading(true);
    try { setRows(await listScRcBySolicit([solicitId])); } catch (e) { toast.error(String(e)); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [solicitId]);

  const adicionar = async () => {
    if (!novo.numero_documento) { toast.error("Número do documento é obrigatório"); return; }
    try {
      await createScRc({ ...novo, solicit_id: solicitId });
      toast.success("Documento adicionado");
      setNovo({ tipo_documento: "SC", numero_documento: "", categoria: "", conta_financeira: "", centro_custo: "", observacao: "", status: "SOLICITADO" });
      load();
    } catch (e) { toast.error(String(e)); }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><FileText className="h-5 w-5" />SC / RC vinculados</DialogTitle></DialogHeader>

        <Card>
          <CardContent className="pt-4 grid gap-2 md:grid-cols-7 items-end">
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={novo.tipo_documento} onValueChange={(v) => setNovo({ ...novo, tipo_documento: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="SC">SC</SelectItem><SelectItem value="RC">RC</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2"><Label className="text-xs">Nº documento *</Label><Input value={novo.numero_documento} onChange={(e) => setNovo({ ...novo, numero_documento: e.target.value })} /></div>
            <div><Label className="text-xs">Categoria</Label><Input value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })} /></div>
            <div><Label className="text-xs">Conta fin.</Label><Input value={novo.conta_financeira} onChange={(e) => setNovo({ ...novo, conta_financeira: e.target.value })} /></div>
            <div><Label className="text-xs">Centro custo</Label><Input value={novo.centro_custo} onChange={(e) => setNovo({ ...novo, centro_custo: e.target.value })} /></div>
            <Button onClick={adicionar}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
          </CardContent>
        </Card>

        <Card className="mt-2">
          <CardContent className="pt-4 overflow-x-auto">
            {loading ? <div className="text-center py-6 text-muted-foreground">Carregando…</div>
              : rows.length === 0 ? <div className="text-center py-6 text-muted-foreground">Nenhum SC/RC vinculado.</div>
              : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Tipo</TableHead><TableHead>Nº</TableHead>
                    <TableHead>Categoria</TableHead><TableHead>Status</TableHead>
                    <TableHead>Criado</TableHead><TableHead></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell><Badge variant={r.tipo_documento === "SC" ? "default" : "secondary"}>{r.tipo_documento}</Badge></TableCell>
                        <TableCell className="font-medium">{r.numero_documento}</TableCell>
                        <TableCell className="text-xs">{r.categoria || "—"}</TableCell>
                        <TableCell>
                          <Select value={r.status || "SOLICITADO"} onValueChange={async (v) => {
                            try { await updateScRcStatus(r.id, v); toast.success("Status atualizado"); load(); } catch (e) { toast.error(String(e)); }
                          }}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{SCRC_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtDate(r.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={async () => {
                            if (confirm("Excluir?")) { await deleteScRcMany([r.id]); load(); }
                          }}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
          </CardContent>
        </Card>

        <DialogFooter><Button variant="outline" onClick={onClose}><X className="h-4 w-4 mr-1" />Fechar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const SuprimentosPage = () => {
  const [rows, setRows] = useState<Solicit[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [fStatus, setFStatus] = useState(ALL);
  const [scrcCounts, setScrcCounts] = useState<Record<string, number>>({});

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Solicit | null>(null);
  const empty: Solicit = {
    id: "", numero: "", descricao: "", status: "aberta", prioridade: "",
    solicitante: "", responsavel: "", prazo: null, itens: [], data: {},
    created_at: "", updated_at: "",
  };
  const [form, setForm] = useState<Solicit>(empty);

  const [scrcOpen, setScrcOpen] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("eng_suprimentos").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    const list = (data || []) as Solicit[];
    setRows(list);
    if (list.length) {
      const ids = list.map((r) => r.id);
      const { data: scrc } = await supabase.from("eng_solicitacao_sc_rc").select("solicit_id").in("solicit_id", ids);
      const cnt: Record<string, number> = {};
      (scrc || []).forEach((r: any) => { cnt[r.solicit_id] = (cnt[r.solicit_id] || 0) + 1; });
      setScrcCounts(cnt);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    if (fStatus !== ALL && r.status !== fStatus) return false;
    if (busca.trim()) {
      const q = busca.toLowerCase();
      const hay = [r.numero, r.descricao, r.solicitante, r.responsavel, r.status].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [rows, busca, fStatus]);

  const openNew = () => { setForm({ ...empty }); setEditing(null); setOpen(true); };
  const openEdit = (r: Solicit) => { setForm({ ...r }); setEditing(r); setOpen(true); };

  const save = async () => {
    if (!form.descricao && !form.numero) { toast.error("Informe número ou descrição"); return; }
    const payload = {
      numero: form.numero || null, descricao: form.descricao || null,
      status: form.status, solicitante: form.solicitante || null,
      responsavel: form.responsavel || null, prazo: form.prazo || null,
      data: form.data || {}, itens: form.itens || [],
    };
    if (editing) {
      const { error } = await supabase.from("eng_suprimentos").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Atualizado");
    } else {
      const { error } = await supabase.from("eng_suprimentos").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Criado");
    }
    setOpen(false);
    load();
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir solicitação?")) return;
    await supabase.from("eng_solicitacao_sc_rc").delete().eq("solicit_id", id);
    const { error } = await supabase.from("eng_suprimentos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluída");
    load();
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-display font-semibold">Suprimentos</h2>
        <p className="text-xs text-muted-foreground">Solicitações de compra (SC) e requisições (RC) por demanda.</p>
      </div>

      <Card>
        <CardContent className="pt-4 flex flex-wrap items-center gap-2">
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />Nova solicitação</Button>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8 w-56" placeholder="Buscar…" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Status: todos</SelectItem>
                {STATUS_SOL.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Badge variant="secondary">{filtered.length} de {rows.length}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          {loading ? <div className="text-center py-8 text-muted-foreground">Carregando…</div>
            : filtered.length === 0 ? <div className="text-center py-8 text-muted-foreground">Nenhuma solicitação.</div>
            : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Nº</TableHead><TableHead>Descrição</TableHead>
                  <TableHead>Solicitante</TableHead><TableHead>Responsável</TableHead>
                  <TableHead>Prazo</TableHead><TableHead>Status</TableHead>
                  <TableHead>SC/RC</TableHead><TableHead className="text-right">Ações</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.numero || "—"}</TableCell>
                      <TableCell className="max-w-[280px] truncate">{r.descricao || "—"}</TableCell>
                      <TableCell>{r.solicitante || "—"}</TableCell>
                      <TableCell>{r.responsavel || "—"}</TableCell>
                      <TableCell>{fmtDate(r.prazo)}</TableCell>
                      <TableCell><Badge variant={statusVariant[r.status || ""] ?? "outline"}>{r.status || "—"}</Badge></TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => setScrcOpen(r.id)}>
                          <FileText className="h-3.5 w-3.5 mr-1" /> {scrcCounts[r.id] || 0}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => excluir(r.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">{editing ? "Editar solicitação" : "Nova solicitação"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label>Número</Label><Input value={form.numero || ""} onChange={(e) => setForm({ ...form, numero: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status || "aberta"} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_SOL.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Solicitante</Label><Input value={form.solicitante || ""} onChange={(e) => setForm({ ...form, solicitante: e.target.value })} /></div>
            <div><Label>Responsável</Label><Input value={form.responsavel || ""} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} /></div>
            <div><Label>Prazo</Label><Input type="date" value={form.prazo || ""} onChange={(e) => setForm({ ...form, prazo: e.target.value || null })} /></div>
            <div className="md:col-span-2"><Label>Descrição</Label><Textarea rows={3} value={form.descricao || ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {scrcOpen && <ScRcPanel solicitId={scrcOpen} onClose={() => { setScrcOpen(null); load(); }} />}
    </div>
  );
};

export default SuprimentosPage;
