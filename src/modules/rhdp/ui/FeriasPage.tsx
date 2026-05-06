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
import { CalendarDays, Plus, CheckCircle2, AlertTriangle, Calculator } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHrdpCompany } from "../hooks/useHrdpCompany";

const sb: any = supabase;

type Employee = { id: string; nome: string; salario_base?: number | null };
type Vacation = {
  id: string;
  employee_id: string;
  periodo_aquisitivo_inicio: string;
  periodo_aquisitivo_fim: string;
  data_inicio: string | null;
  data_fim: string | null;
  dias_programados: number | null;
  dias_abono: number | null;
  status: string;
  observacoes?: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  em_gozo: "Em gozo",
  concluida: "Concluída",
  recusada: "Recusada",
};
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pendente: "secondary",
  aprovada: "default",
  em_gozo: "default",
  concluida: "outline",
  recusada: "destructive",
};

function diffDays(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export default function FeriasPage() {
  const { user } = useAuth();
  const { companyId, ready } = useHrdpCompany();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vacs, setVacs] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Partial<Vacation> | null>(null);

  async function load() {
    if (!companyId) return;
    setLoading(true);
    const [emp, vac] = await Promise.all([
      sb.from("hrdp_employees").select("id, nome, salario_base").eq("company_id", companyId).eq("ativo", true).order("nome"),
      sb.from("hrdp_vacations").select("*").eq("company_id", companyId).eq("is_deleted", false).order("created_at", { ascending: false }),
    ]);
    setEmployees(emp.data ?? []);
    setVacs(vac.data ?? []);
    setLoading(false);
  }

  useEffect(() => { if (ready) load(); }, [ready, companyId]);

  const empById = useMemo(() => Object.fromEntries(employees.map(e => [e.id, e])), [employees]);

  const kpis = useMemo(() => {
    const today = new Date();
    let vencendo = 0, vencidas = 0, emGozo = 0, pendentes = 0;
    for (const v of vacs) {
      if (v.status === "em_gozo") emGozo++;
      if (v.status === "pendente") pendentes++;
      const fim = new Date(v.periodo_aquisitivo_fim);
      const dDays = (fim.getTime() - today.getTime()) / 86400000;
      if (v.status === "pendente" && dDays < 0) vencidas++;
      else if (v.status === "pendente" && dDays <= 60) vencendo++;
    }
    return { vencendo, vencidas, emGozo, pendentes, total: vacs.length };
  }, [vacs]);

  async function approveVacation(v: Vacation) {
    const { error } = await sb.from("hrdp_vacations").update({
      status: "aprovada",
      aprovador_id: user?.id,
      aprovado_em: new Date().toISOString(),
    }).eq("id", v.id);
    if (error) return toast.error(error.message);
    toast.success("Férias aprovadas");
    load();
  }

  async function saveVacation() {
    if (!editing || !companyId) return;
    if (!editing.employee_id || !editing.periodo_aquisitivo_inicio || !editing.periodo_aquisitivo_fim) {
      return toast.error("Preencha colaborador e período aquisitivo");
    }
    const dias = editing.data_inicio && editing.data_fim
      ? diffDays(editing.data_inicio, editing.data_fim) + 1
      : (editing.dias_programados ?? 0);
    const payload: any = {
      company_id: companyId,
      employee_id: editing.employee_id,
      periodo_aquisitivo_inicio: editing.periodo_aquisitivo_inicio,
      periodo_aquisitivo_fim: editing.periodo_aquisitivo_fim,
      data_inicio: editing.data_inicio || null,
      data_fim: editing.data_fim || null,
      dias_programados: dias,
      dias_abono: editing.dias_abono ?? 0,
      status: editing.status ?? "pendente",
      observacoes: editing.observacoes ?? null,
    };
    const q = editing.id
      ? sb.from("hrdp_vacations").update(payload).eq("id", editing.id)
      : sb.from("hrdp_vacations").insert(payload);
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success("Férias salvas");
    setEditing(null);
    load();
  }

  async function recalcProvisions() {
    if (!companyId) return;
    const competencia = new Date().toISOString().slice(0, 7);
    let inserted = 0;
    for (const e of employees) {
      const salario = Number(e.salario_base ?? 0);
      const usadas = vacs.filter(v => v.employee_id === e.id && v.status === "concluida").reduce((s, v) => s + (v.dias_programados ?? 0), 0);
      const direito = 30;
      const saldo = direito - usadas;
      const valor = (salario / 30) * Math.max(0, saldo);
      const adicional = valor / 3;
      const { error } = await sb.from("hrdp_vacation_provisions").upsert({
        company_id: companyId,
        employee_id: e.id,
        competencia,
        dias_direito: direito,
        dias_gozados: usadas,
        saldo_dias: saldo,
        salario_base: salario,
        valor_estimado: valor,
        valor_adicional_um_terco: adicional,
      }, { onConflict: "employee_id,competencia" });
      if (!error) inserted++;
    }
    toast.success(`Provisão calculada para ${inserted} colaborador(es)`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary" /> Férias & Provisão
          </h1>
          <p className="text-sm text-muted-foreground">
            Programação de férias, aprovações e cálculo estimado da provisão mensal.
          </p>
        </div>
        <Button onClick={() => setEditing({ status: "pendente" })}>
          <Plus className="w-4 h-4 mr-1" /> Nova programação
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi title="Total" value={kpis.total} />
        <Kpi title="Pendentes" value={kpis.pendentes} />
        <Kpi title="Vencendo (≤60d)" value={kpis.vencendo} />
        <Kpi title="Vencidas" value={kpis.vencidas} tone="danger" />
        <Kpi title="Em gozo" value={kpis.emGozo} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aviso legal</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Cálculo estimado. Validação humana obrigatória — convenção coletiva pode alterar regras de período aquisitivo, abono e adicional de 1/3.
        </CardContent>
      </Card>

      <Tabs defaultValue="programacoes">
        <TabsList>
          <TabsTrigger value="programacoes">Programações</TabsTrigger>
          <TabsTrigger value="provisao">Provisão</TabsTrigger>
        </TabsList>

        <TabsContent value="programacoes" className="space-y-3">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Período aquisitivo</TableHead>
                    <TableHead>Gozo</TableHead>
                    <TableHead>Dias</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Carregando…</TableCell></TableRow>}
                  {!loading && vacs.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma programação cadastrada</TableCell></TableRow>
                  )}
                  {vacs.map(v => (
                    <TableRow key={v.id}>
                      <TableCell>{empById[v.employee_id]?.nome ?? "—"}</TableCell>
                      <TableCell className="text-xs">{v.periodo_aquisitivo_inicio} → {v.periodo_aquisitivo_fim}</TableCell>
                      <TableCell className="text-xs">{v.data_inicio ? `${v.data_inicio} → ${v.data_fim}` : "—"}</TableCell>
                      <TableCell>{v.dias_programados ?? 0}</TableCell>
                      <TableCell><Badge variant={STATUS_VARIANT[v.status]}>{STATUS_LABEL[v.status] ?? v.status}</Badge></TableCell>
                      <TableCell className="text-right space-x-2">
                        {v.status === "pendente" && (
                          <Button size="sm" variant="outline" onClick={() => approveVacation(v)}>
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Aprovar
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setEditing(v)}>Editar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="provisao" className="space-y-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="w-4 h-4" /> Provisão estimada
              </CardTitle>
              <Button size="sm" onClick={recalcProvisions}>
                <AlertTriangle className="w-4 h-4 mr-1" /> Recalcular mês corrente
              </Button>
            </CardHeader>
            <CardContent>
              <ProvisionTable companyId={companyId} employees={employees} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>{editing?.id ? "Editar férias" : "Nova programação"}</SheetTitle></SheetHeader>
          {editing && (
            <div className="space-y-3 mt-4">
              <div>
                <Label>Colaborador</Label>
                <Select value={editing.employee_id ?? ""} onValueChange={(v) => setEditing({ ...editing, employee_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Período aquisitivo (início)</Label>
                  <Input type="date" value={editing.periodo_aquisitivo_inicio ?? ""} onChange={e => setEditing({ ...editing, periodo_aquisitivo_inicio: e.target.value })} />
                </div>
                <div>
                  <Label>Período aquisitivo (fim)</Label>
                  <Input type="date" value={editing.periodo_aquisitivo_fim ?? ""} onChange={e => setEditing({ ...editing, periodo_aquisitivo_fim: e.target.value })} />
                </div>
                <div>
                  <Label>Gozo (início)</Label>
                  <Input type="date" value={editing.data_inicio ?? ""} onChange={e => setEditing({ ...editing, data_inicio: e.target.value })} />
                </div>
                <div>
                  <Label>Gozo (fim)</Label>
                  <Input type="date" value={editing.data_fim ?? ""} onChange={e => setEditing({ ...editing, data_fim: e.target.value })} />
                </div>
                <div>
                  <Label>Dias abono</Label>
                  <Input type="number" min={0} max={10} value={editing.dias_abono ?? 0} onChange={e => setEditing({ ...editing, dias_abono: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editing.status ?? "pendente"} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={editing.observacoes ?? ""} onChange={e => setEditing({ ...editing, observacoes: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button onClick={saveVacation}>Salvar</Button>
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

function ProvisionTable({ companyId, employees }: { companyId: string | null; employees: Employee[] }) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    if (!companyId) return;
    sb.from("hrdp_vacation_provisions").select("*").eq("company_id", companyId).order("competencia", { ascending: false }).limit(200).then((r: any) => setRows(r.data ?? []));
  }, [companyId, employees.length]);
  const empById = Object.fromEntries(employees.map(e => [e.id, e.nome]));
  if (rows.length === 0) {
    return <div className="text-sm text-muted-foreground py-6 text-center">Nenhuma provisão calculada. Use "Recalcular mês corrente".</div>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Competência</TableHead>
          <TableHead>Colaborador</TableHead>
          <TableHead className="text-right">Saldo dias</TableHead>
          <TableHead className="text-right">Valor estimado</TableHead>
          <TableHead className="text-right">+ 1/3</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(r => (
          <TableRow key={r.id}>
            <TableCell className="text-xs">{r.competencia}</TableCell>
            <TableCell>{empById[r.employee_id] ?? "—"}</TableCell>
            <TableCell className="text-right">{Number(r.saldo_dias ?? 0).toFixed(1)}</TableCell>
            <TableCell className="text-right">R$ {Number(r.valor_estimado ?? 0).toFixed(2)}</TableCell>
            <TableCell className="text-right">R$ {Number(r.valor_adicional_um_terco ?? 0).toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
