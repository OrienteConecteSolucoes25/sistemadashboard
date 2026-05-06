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
import { Wallet, Plus, FileText, CheckCircle2, AlertTriangle, DollarSign, Users, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useHrdpCompany } from "../hooks/useHrdpCompany";

const sb: any = supabase;

type Closing = {
  id: string;
  competencia: string;
  status: string;
  total_proventos: number;
  total_descontos: number;
  total_liquido: number;
  qtd_colaboradores: number;
  observacoes: string | null;
  fechado_em: string | null;
};
type Payslip = {
  id: string;
  closing_id: string | null;
  employee_id: string;
  competencia: string;
  salario_base: number;
  proventos: number;
  descontos: number;
  liquido: number;
  rubricas: Array<{ tipo: string; codigo?: string; descricao: string; valor: number }>;
  status: string;
  observacoes: string | null;
};
type Employee = { id: string; nome: string };

const STATUS_FECH: Record<string, { l: string; v: "default" | "secondary" | "destructive" | "outline" }> = {
  aberto: { l: "Aberto", v: "outline" },
  em_conferencia: { l: "Em conferência", v: "secondary" },
  fechado: { l: "Fechado", v: "default" },
  reaberto: { l: "Reaberto", v: "destructive" },
};
const STATUS_HOL: Record<string, { l: string; v: "default" | "secondary" | "destructive" | "outline" }> = {
  rascunho: { l: "Rascunho", v: "outline" },
  conferido: { l: "Conferido", v: "secondary" },
  publicado: { l: "Publicado", v: "default" },
};

function brl(n: number) {
  return (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function competenciaAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function FolhaPage() {
  const { companyId, ready } = useHrdpCompany();
  const [tab, setTab] = useState("fechamentos");
  const [closings, setClosings] = useState<Closing[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  const [openClosing, setOpenClosing] = useState(false);
  const [editClosing, setEditClosing] = useState<Partial<Closing> | null>(null);
  const [openPayslip, setOpenPayslip] = useState(false);
  const [editPayslip, setEditPayslip] = useState<Partial<Payslip> | null>(null);

  const empById = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e.nome])), [employees]);

  async function load() {
    if (!companyId) return;
    setLoading(true);
    const [c, p, e] = await Promise.all([
      sb.from("hrdp_payroll_closings").select("*").eq("company_id", companyId).eq("is_deleted", false).order("competencia", { ascending: false }),
      sb.from("hrdp_payslips").select("*").eq("company_id", companyId).eq("is_deleted", false).order("competencia", { ascending: false }),
      sb.from("hrdp_employees").select("id,nome").eq("company_id", companyId).eq("is_deleted", false).order("nome"),
    ]);
    setClosings(c.data ?? []);
    setPayslips(p.data ?? []);
    setEmployees(e.data ?? []);
    setLoading(false);
  }

  useEffect(() => { if (ready && companyId) load(); }, [ready, companyId]);

  const kpis = useMemo(() => {
    const compAtual = competenciaAtual();
    const fechAtual = closings.find((c) => c.competencia === compAtual);
    const abertos = closings.filter((c) => c.status !== "fechado").length;
    const totalLiq = closings.filter((c) => c.competencia === compAtual).reduce((s, c) => s + Number(c.total_liquido || 0), 0);
    const holsRasc = payslips.filter((p) => p.status === "rascunho").length;
    return { fechAtual, abertos, totalLiq, holsRasc };
  }, [closings, payslips]);

  async function saveClosing() {
    if (!editClosing || !companyId) return;
    if (!editClosing.competencia || !/^\d{4}-\d{2}$/.test(editClosing.competencia)) {
      toast.error("Competência inválida (use AAAA-MM)"); return;
    }
    const payload: any = {
      company_id: companyId,
      competencia: editClosing.competencia,
      status: editClosing.status ?? "aberto",
      observacoes: editClosing.observacoes ?? null,
    };
    if (editClosing.id) {
      if (payload.status === "fechado") {
        payload.fechado_em = new Date().toISOString();
      }
      const { error } = await sb.from("hrdp_payroll_closings").update(payload).eq("id", editClosing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await sb.from("hrdp_payroll_closings").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Fechamento salvo");
    setOpenClosing(false); setEditClosing(null); load();
  }

  async function recomputeClosing(c: Closing) {
    const list = payslips.filter((p) => p.competencia === c.competencia);
    const totals = list.reduce(
      (acc, p) => {
        acc.prov += Number(p.proventos || 0);
        acc.desc += Number(p.descontos || 0);
        acc.liq += Number(p.liquido || 0);
        return acc;
      },
      { prov: 0, desc: 0, liq: 0 },
    );
    const { error } = await sb.from("hrdp_payroll_closings").update({
      total_proventos: totals.prov,
      total_descontos: totals.desc,
      total_liquido: totals.liq,
      qtd_colaboradores: list.length,
    }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Totais recalculados");
    load();
  }

  function openNewPayslip(closing?: Closing) {
    setEditPayslip({
      competencia: closing?.competencia ?? competenciaAtual(),
      closing_id: closing?.id ?? null,
      salario_base: 0, proventos: 0, descontos: 0, liquido: 0,
      rubricas: [], status: "rascunho",
    });
    setOpenPayslip(true);
  }

  async function savePayslip() {
    if (!editPayslip || !companyId) return;
    if (!editPayslip.employee_id) return toast.error("Selecione o colaborador");
    if (!editPayslip.competencia) return toast.error("Competência obrigatória");
    const proventos = Number(editPayslip.proventos || 0);
    const descontos = Number(editPayslip.descontos || 0);
    const liquido = proventos - descontos;
    const payload: any = {
      company_id: companyId,
      employee_id: editPayslip.employee_id,
      competencia: editPayslip.competencia,
      closing_id: editPayslip.closing_id ?? null,
      salario_base: Number(editPayslip.salario_base || 0),
      proventos, descontos, liquido,
      rubricas: editPayslip.rubricas ?? [],
      status: editPayslip.status ?? "rascunho",
      observacoes: editPayslip.observacoes ?? null,
    };
    if (editPayslip.id) {
      const { error } = await sb.from("hrdp_payslips").update(payload).eq("id", editPayslip.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await sb.from("hrdp_payslips").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Holerite salvo");
    setOpenPayslip(false); setEditPayslip(null); load();
  }

  function addRubrica(tipo: "provento" | "desconto") {
    const cur = editPayslip?.rubricas ?? [];
    setEditPayslip({ ...editPayslip!, rubricas: [...cur, { tipo, descricao: "", valor: 0 }] });
  }
  function updateRubrica(idx: number, patch: any) {
    const cur = [...(editPayslip?.rubricas ?? [])];
    cur[idx] = { ...cur[idx], ...patch };
    setEditPayslip({ ...editPayslip!, rubricas: cur });
  }
  function removeRubrica(idx: number) {
    const cur = [...(editPayslip?.rubricas ?? [])];
    cur.splice(idx, 1);
    setEditPayslip({ ...editPayslip!, rubricas: cur });
  }
  function recalcFromRubricas() {
    const cur = editPayslip?.rubricas ?? [];
    const prov = cur.filter((r) => r.tipo === "provento").reduce((s, r) => s + Number(r.valor || 0), 0);
    const desc = cur.filter((r) => r.tipo === "desconto").reduce((s, r) => s + Number(r.valor || 0), 0);
    setEditPayslip({ ...editPayslip!, proventos: prov, descontos: desc, liquido: prov - desc });
  }

  if (!ready) return <div className="p-4 text-sm text-muted-foreground">Carregando…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" /> Folha & Holerite
          </h1>
          <p className="text-sm text-muted-foreground">Fechamento mensal, conferência e disponibilização de holerites.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setEditClosing({ competencia: competenciaAtual(), status: "aberto" }); setOpenClosing(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Novo fechamento
          </Button>
          <Button onClick={() => openNewPayslip()}>
            <FileText className="w-4 h-4 mr-1" /> Novo holerite
          </Button>
        </div>
      </div>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-3 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <strong>Folha auxiliar (não-oficial).</strong> Cálculos de encargos, FGTS, INSS, IRRF e eSocial não são emitidos aqui.
            Use estes valores apenas para conferência interna. A folha oficial deve ser validada pela contabilidade.
            Holerites são <strong>privados</strong> — cada colaborador vê apenas o próprio.
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiBox icon={<DollarSign className="w-4 h-4" />} label="Líquido (mês atual)" value={brl(kpis.totalLiq)} />
        <KpiBox icon={<FileText className="w-4 h-4" />} label="Fechamentos abertos" value={String(kpis.abertos)} />
        <KpiBox icon={<Users className="w-4 h-4" />} label="Colaboradores (mês)" value={String(kpis.fechAtual?.qtd_colaboradores ?? 0)} />
        <KpiBox icon={<Lock className="w-4 h-4" />} label="Holerites em rascunho" value={String(kpis.holsRasc)} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="fechamentos">Fechamentos</TabsTrigger>
          <TabsTrigger value="holerites">Holerites</TabsTrigger>
        </TabsList>

        <TabsContent value="fechamentos" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Fechamentos mensais</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competência</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Colab.</TableHead>
                    <TableHead className="text-right">Proventos</TableHead>
                    <TableHead className="text-right">Descontos</TableHead>
                    <TableHead className="text-right">Líquido</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {closings.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">Nenhum fechamento ainda.</TableCell></TableRow>
                  )}
                  {closings.map((c) => {
                    const st = STATUS_FECH[c.status] ?? STATUS_FECH.aberto;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.competencia}</TableCell>
                        <TableCell><Badge variant={st.v}>{st.l}</Badge></TableCell>
                        <TableCell className="text-right">{c.qtd_colaboradores}</TableCell>
                        <TableCell className="text-right">{brl(Number(c.total_proventos))}</TableCell>
                        <TableCell className="text-right">{brl(Number(c.total_descontos))}</TableCell>
                        <TableCell className="text-right font-semibold">{brl(Number(c.total_liquido))}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="sm" variant="ghost" onClick={() => recomputeClosing(c)}>Recalcular</Button>
                          <Button size="sm" variant="ghost" onClick={() => openNewPayslip(c)}>+ Holerite</Button>
                          <Button size="sm" variant="outline" onClick={() => { setEditClosing(c); setOpenClosing(true); }}>Abrir</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holerites" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Holerites</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competência</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Proventos</TableHead>
                    <TableHead className="text-right">Descontos</TableHead>
                    <TableHead className="text-right">Líquido</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslips.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">Nenhum holerite registrado.</TableCell></TableRow>
                  )}
                  {payslips.map((p) => {
                    const st = STATUS_HOL[p.status] ?? STATUS_HOL.rascunho;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.competencia}</TableCell>
                        <TableCell>{empById[p.employee_id] ?? "—"}</TableCell>
                        <TableCell><Badge variant={st.v}>{st.l}</Badge></TableCell>
                        <TableCell className="text-right">{brl(Number(p.proventos))}</TableCell>
                        <TableCell className="text-right">{brl(Number(p.descontos))}</TableCell>
                        <TableCell className="text-right font-semibold">{brl(Number(p.liquido))}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => { setEditPayslip(p); setOpenPayslip(true); }}>Editar</Button>
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

      {/* Sheet Fechamento */}
      <Sheet open={openClosing} onOpenChange={setOpenClosing}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>{editClosing?.id ? "Editar fechamento" : "Novo fechamento"}</SheetTitle></SheetHeader>
          <div className="space-y-3 py-4">
            <div>
              <Label>Competência (AAAA-MM)</Label>
              <Input value={editClosing?.competencia ?? ""} onChange={(e) => setEditClosing({ ...editClosing!, competencia: e.target.value })} placeholder="2026-05" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={editClosing?.status ?? "aberto"} onValueChange={(v) => setEditClosing({ ...editClosing!, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_FECH).map(([k, v]) => <SelectItem key={k} value={k}>{v.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={editClosing?.observacoes ?? ""} onChange={(e) => setEditClosing({ ...editClosing!, observacoes: e.target.value })} />
            </div>
            <Button className="w-full" onClick={saveClosing}><CheckCircle2 className="w-4 h-4 mr-1" /> Salvar</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet Holerite */}
      <Sheet open={openPayslip} onOpenChange={setOpenPayslip}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader><SheetTitle>{editPayslip?.id ? "Editar holerite" : "Novo holerite"}</SheetTitle></SheetHeader>
          <div className="space-y-3 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Colaborador</Label>
                <Select value={editPayslip?.employee_id ?? ""} onValueChange={(v) => setEditPayslip({ ...editPayslip!, employee_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Competência</Label>
                <Input value={editPayslip?.competencia ?? ""} onChange={(e) => setEditPayslip({ ...editPayslip!, competencia: e.target.value })} placeholder="2026-05" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Salário base</Label>
                <Input type="number" step="0.01" value={editPayslip?.salario_base ?? 0} onChange={(e) => setEditPayslip({ ...editPayslip!, salario_base: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editPayslip?.status ?? "rascunho"} onValueChange={(v) => setEditPayslip({ ...editPayslip!, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_HOL).map(([k, v]) => <SelectItem key={k} value={k}>{v.l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Rubricas</Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => addRubrica("provento")}>+ Provento</Button>
                  <Button size="sm" variant="outline" onClick={() => addRubrica("desconto")}>+ Desconto</Button>
                  <Button size="sm" variant="ghost" onClick={recalcFromRubricas}>Recalcular</Button>
                </div>
              </div>
              {(editPayslip?.rubricas ?? []).length === 0 && (
                <div className="text-xs text-muted-foreground">Nenhuma rubrica. Adicione proventos e descontos.</div>
              )}
              <div className="space-y-2">
                {(editPayslip?.rubricas ?? []).map((r, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <Badge className="col-span-2 justify-center" variant={r.tipo === "provento" ? "default" : "secondary"}>
                      {r.tipo === "provento" ? "Provento" : "Desconto"}
                    </Badge>
                    <Input className="col-span-6" placeholder="Descrição" value={r.descricao} onChange={(e) => updateRubrica(idx, { descricao: e.target.value })} />
                    <Input className="col-span-3" type="number" step="0.01" placeholder="Valor" value={r.valor} onChange={(e) => updateRubrica(idx, { valor: Number(e.target.value) })} />
                    <Button className="col-span-1" size="sm" variant="ghost" onClick={() => removeRubrica(idx)}>×</Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div>
                <Label className="text-xs">Proventos</Label>
                <Input type="number" step="0.01" value={editPayslip?.proventos ?? 0} onChange={(e) => setEditPayslip({ ...editPayslip!, proventos: Number(e.target.value), liquido: Number(e.target.value) - Number(editPayslip?.descontos || 0) })} />
              </div>
              <div>
                <Label className="text-xs">Descontos</Label>
                <Input type="number" step="0.01" value={editPayslip?.descontos ?? 0} onChange={(e) => setEditPayslip({ ...editPayslip!, descontos: Number(e.target.value), liquido: Number(editPayslip?.proventos || 0) - Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs">Líquido</Label>
                <Input type="number" step="0.01" value={editPayslip?.liquido ?? 0} readOnly />
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea value={editPayslip?.observacoes ?? ""} onChange={(e) => setEditPayslip({ ...editPayslip!, observacoes: e.target.value })} />
            </div>

            <Button className="w-full" onClick={savePayslip}><CheckCircle2 className="w-4 h-4 mr-1" /> Salvar holerite</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function KpiBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground flex items-center gap-1">{icon}{label}</div>
        <div className="text-xl font-bold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
