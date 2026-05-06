import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Inbox, Plus, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHrdpCompany } from "../hooks/useHrdpCompany";

const sb: any = supabase;

type Employee = { id: string; nome: string; user_id?: string | null };
type Req = {
  id: string;
  employee_id: string;
  tipo: string;
  titulo: string;
  descricao?: string | null;
  prioridade: string;
  status: string;
  data_abertura: string;
  prazo_sla: string | null;
  sla_dias: number | null;
  aprovador_id?: string | null;
  aprovado_em?: string | null;
  concluido_em?: string | null;
  resposta?: string | null;
};

const TIPOS = [
  { v: "ferias", l: "Férias" },
  { v: "atestado", l: "Atestado / Afastamento" },
  { v: "adiantamento", l: "Adiantamento salarial" },
  { v: "documento", l: "2ª via documento" },
  { v: "alteracao_cadastral", l: "Alteração cadastral" },
  { v: "outros", l: "Outros" },
];
const PRIO = [
  { v: "baixa", l: "Baixa", days: 7 },
  { v: "normal", l: "Normal", days: 3 },
  { v: "alta", l: "Alta", days: 1 },
  { v: "urgente", l: "Urgente", days: 1 },
];
const STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  em_analise: "Em análise",
  aprovada: "Aprovada",
  recusada: "Recusada",
  concluida: "Concluída",
};
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  aberta: "secondary",
  em_analise: "default",
  aprovada: "default",
  recusada: "destructive",
  concluida: "outline",
};

function slaTone(prazo: string | null, status: string): { label: string; tone: "ok" | "warn" | "danger" } {
  if (!prazo || ["aprovada", "recusada", "concluida"].includes(status)) return { label: "—", tone: "ok" };
  const ms = new Date(prazo).getTime() - Date.now();
  if (ms < 0) return { label: "Vencido", tone: "danger" };
  const h = Math.floor(ms / 3600000);
  if (h < 24) return { label: `${h}h restantes`, tone: "warn" };
  return { label: `${Math.floor(h / 24)}d restantes`, tone: "ok" };
}

export default function SolicitacoesPage() {
  const { user } = useAuth();
  const { companyId, ready } = useHrdpCompany();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Partial<Req> | null>(null);
  const [respondendo, setRespondendo] = useState<Req | null>(null);
  const [respostaTxt, setRespostaTxt] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  async function load() {
    if (!companyId) return;
    setLoading(true);
    const [emp, r] = await Promise.all([
      sb.from("hrdp_employees").select("id, nome, user_id").eq("company_id", companyId).eq("ativo", true).order("nome"),
      sb.from("hrdp_employee_requests").select("*").eq("company_id", companyId).eq("is_deleted", false).order("data_abertura", { ascending: false }),
    ]);
    setEmployees(emp.data ?? []);
    setReqs(r.data ?? []);
    setLoading(false);
  }
  useEffect(() => { if (ready) load(); }, [ready, companyId]);

  const empById = useMemo(() => Object.fromEntries(employees.map(e => [e.id, e])), [employees]);
  const myEmployee = useMemo(() => employees.find(e => e.user_id === user?.id) ?? null, [employees, user]);

  const filtered = useMemo(() => {
    if (filterStatus === "todos") return reqs;
    return reqs.filter(r => r.status === filterStatus);
  }, [reqs, filterStatus]);

  const kpis = useMemo(() => {
    const now = Date.now();
    let abertas = 0, vencidas = 0, hoje = 0, concluidas = 0;
    for (const r of reqs) {
      if (["aprovada", "concluida"].includes(r.status)) concluidas++;
      if (["aberta", "em_analise"].includes(r.status)) {
        abertas++;
        if (r.prazo_sla && new Date(r.prazo_sla).getTime() < now) vencidas++;
        if (r.prazo_sla && new Date(r.prazo_sla).toDateString() === new Date().toDateString()) hoje++;
      }
    }
    return { total: reqs.length, abertas, vencidas, hoje, concluidas };
  }, [reqs]);

  async function saveReq() {
    if (!editing || !companyId) return;
    const empId = editing.employee_id ?? myEmployee?.id;
    if (!empId) return toast.error("Selecione o colaborador");
    if (!editing.tipo || !editing.titulo) return toast.error("Tipo e título são obrigatórios");
    const prio = editing.prioridade ?? "normal";
    const slaDias = PRIO.find(p => p.v === prio)?.days ?? 3;
    const payload: any = {
      company_id: companyId,
      employee_id: empId,
      tipo: editing.tipo,
      titulo: editing.titulo,
      descricao: editing.descricao ?? null,
      prioridade: prio,
      sla_dias: slaDias,
      status: "aberta",
    };
    const q = editing.id
      ? sb.from("hrdp_employee_requests").update(payload).eq("id", editing.id)
      : sb.from("hrdp_employee_requests").insert(payload);
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success("Solicitação registrada");
    setEditing(null);
    load();
  }

  async function changeStatus(r: Req, status: string, resposta?: string) {
    const upd: any = { status };
    if (status === "aprovada" || status === "recusada") {
      upd.aprovador_id = user?.id;
      upd.aprovado_em = new Date().toISOString();
    }
    if (status === "concluida") upd.concluido_em = new Date().toISOString();
    if (resposta !== undefined) upd.resposta = resposta;
    const { error } = await sb.from("hrdp_employee_requests").update(upd).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    setRespondendo(null); setRespostaTxt("");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Inbox className="w-6 h-6 text-primary" /> Solicitações
          </h1>
          <p className="text-sm text-muted-foreground">
            Fila de pedidos do colaborador (férias, atestado, adiantamento, documentos) com SLA de aprovação.
          </p>
        </div>
        <Button onClick={() => setEditing({ prioridade: "normal", tipo: "outros" })}>
          <Plus className="w-4 h-4 mr-1" /> Nova solicitação
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi title="Total" value={kpis.total} />
        <Kpi title="Abertas" value={kpis.abertas} />
        <Kpi title="Vence hoje" value={kpis.hoje} />
        <Kpi title="SLA vencido" value={kpis.vencidas} tone="danger" />
        <Kpi title="Concluídas" value={kpis.concluidas} />
      </div>

      <Tabs value={filterStatus} onValueChange={setFilterStatus}>
        <TabsList>
          <TabsTrigger value="todos">Todas</TabsTrigger>
          <TabsTrigger value="aberta">Abertas</TabsTrigger>
          <TabsTrigger value="em_analise">Em análise</TabsTrigger>
          <TabsTrigger value="aprovada">Aprovadas</TabsTrigger>
          <TabsTrigger value="recusada">Recusadas</TabsTrigger>
          <TabsTrigger value="concluida">Concluídas</TabsTrigger>
        </TabsList>

        <TabsContent value={filterStatus} className="mt-3">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Aberta em</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Carregando…</TableCell></TableRow>}
                  {!loading && filtered.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhuma solicitação</TableCell></TableRow>
                  )}
                  {filtered.map(r => {
                    const sla = slaTone(r.prazo_sla, r.status);
                    return (
                      <TableRow key={r.id}>
                        <TableCell>{empById[r.employee_id]?.nome ?? "—"}</TableCell>
                        <TableCell className="text-xs">{TIPOS.find(t => t.v === r.tipo)?.l ?? r.tipo}</TableCell>
                        <TableCell className="max-w-[280px] truncate">{r.titulo}</TableCell>
                        <TableCell><Badge variant="outline">{r.prioridade}</Badge></TableCell>
                        <TableCell className="text-xs">{new Date(r.data_abertura).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="text-xs">
                          <span className={
                            sla.tone === "danger" ? "text-destructive font-medium" :
                            sla.tone === "warn" ? "text-amber-600 font-medium" : ""
                          }>
                            {sla.tone === "danger" && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                            {sla.tone === "warn" && <Clock className="w-3 h-3 inline mr-1" />}
                            {sla.label}
                          </span>
                        </TableCell>
                        <TableCell><Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge></TableCell>
                        <TableCell className="text-right space-x-1">
                          {["aberta", "em_analise"].includes(r.status) && (
                            <>
                              {r.status === "aberta" && (
                                <Button size="sm" variant="ghost" onClick={() => changeStatus(r, "em_analise")}>Analisar</Button>
                              )}
                              <Button size="sm" variant="outline" onClick={() => { setRespondendo(r); setRespostaTxt(""); }}>
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Responder
                              </Button>
                            </>
                          )}
                          {r.status === "aprovada" && (
                            <Button size="sm" variant="outline" onClick={() => changeStatus(r, "concluida")}>Concluir</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>Nova solicitação</SheetTitle></SheetHeader>
          {editing && (
            <div className="space-y-3 mt-4">
              <div>
                <Label>Colaborador</Label>
                <Select value={editing.employee_id ?? myEmployee?.id ?? ""} onValueChange={(v) => setEditing({ ...editing, employee_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={editing.tipo ?? "outros"} onValueChange={(v) => setEditing({ ...editing, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS.map(t => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridade (define SLA)</Label>
                  <Select value={editing.prioridade ?? "normal"} onValueChange={(v) => setEditing({ ...editing, prioridade: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIO.map(p => <SelectItem key={p.v} value={p.v}>{p.l} ({p.days}d)</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Título</Label>
                <Input value={editing.titulo ?? ""} onChange={e => setEditing({ ...editing, titulo: e.target.value })} />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea rows={4} value={editing.descricao ?? ""} onChange={e => setEditing({ ...editing, descricao: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button onClick={saveReq}>Abrir solicitação</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={!!respondendo} onOpenChange={(o) => !o && setRespondendo(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle>Responder solicitação</SheetTitle></SheetHeader>
          {respondendo && (
            <div className="space-y-3 mt-4">
              <div className="text-sm">
                <div className="font-medium">{respondendo.titulo}</div>
                <div className="text-muted-foreground text-xs mt-1">{respondendo.descricao}</div>
              </div>
              <div>
                <Label>Resposta / parecer</Label>
                <Textarea rows={5} value={respostaTxt} onChange={e => setRespostaTxt(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <Button variant="destructive" onClick={() => changeStatus(respondendo, "recusada", respostaTxt)}>
                  <XCircle className="w-4 h-4 mr-1" /> Recusar
                </Button>
                <Button onClick={() => changeStatus(respondendo, "aprovada", respostaTxt)}>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Kpi({ title, value, tone }: { title: string; value: number; tone?: "danger" }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className={`text-2xl font-bold ${tone === "danger" ? "text-destructive" : ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
