import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Clock, Plus, CheckCircle2, XCircle, Wallet, AlarmClock, Hourglass } from "lucide-react";
import { toast } from "sonner";
import { useHrdpCompany } from "../hooks/useHrdpCompany";

const sb: any = supabase;

const TIPOS = [
  { v: "entrada", l: "Entrada" },
  { v: "almoco_saida", l: "Saída p/ almoço" },
  { v: "almoco_retorno", l: "Retorno do almoço" },
  { v: "saida", l: "Saída" },
];

type Employee = { id: string; nome: string; user_id: string | null };
type TimeEntry = {
  id: string; company_id: string; employee_id: string;
  data_ref: string; tipo: string; hora: string;
  origem: string; justificativa: string | null;
};
type Overtime = {
  id: string; company_id: string; employee_id: string;
  data_ref: string; hora_inicio: string; hora_fim: string;
  total_horas: number | null; tipo: string; motivo: string | null;
  destino: string; status: string; obs_aprovador: string | null;
};
type BankRow = {
  id: string; company_id: string; employee_id: string;
  data_ref: string; horas: number; tipo: string; descricao: string | null;
};

function diffHours(start: string, end: string) {
  const [h1,m1] = start.split(":").map(Number);
  const [h2,m2] = end.split(":").map(Number);
  let mins = (h2*60+m2) - (h1*60+m1);
  if (mins < 0) mins += 24*60;
  return Math.round((mins/60)*100)/100;
}

export default function PontoPage() {
  const { user } = useAuth();
  const { companyId, companies, isAdmin, selectCompany, ready } = useHrdpCompany();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [me, setMe] = useState<Employee | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [overtimes, setOvertimes] = useState<Overtime[]>([]);
  const [bank, setBank] = useState<BankRow[]>([]);
  const [tab, setTab] = useState("ponto");
  const [empFilter, setEmpFilter] = useState<string>("__me__");
  const [periodo, setPeriodo] = useState({
    de: new Date(Date.now()-29*86400000).toISOString().slice(0,10),
    ate: new Date().toISOString().slice(0,10),
  });
  const [openHe, setOpenHe] = useState(false);
  const [editHe, setEditHe] = useState<Partial<Overtime> | null>(null);

  // load employees + identifica colaborador atual
  useEffect(() => {
    if (!ready || !companyId) return;
    (async () => {
      const { data } = await sb.from("hrdp_employees")
        .select("id,nome,user_id").eq("company_id", companyId).eq("is_deleted", false).order("nome");
      setEmployees(data ?? []);
      const self = (data ?? []).find((e: Employee) => e.user_id === user?.id) ?? null;
      setMe(self);
      if (!self && empFilter === "__me__") setEmpFilter(data?.[0]?.id ?? "");
    })();
  }, [ready, companyId, user?.id]);

  const targetEmpId = empFilter === "__me__" ? me?.id : empFilter;

  async function loadAll() {
    if (!companyId) return;
    const baseEntries = sb.from("hrdp_time_entries")
      .select("*").eq("company_id", companyId)
      .gte("data_ref", periodo.de).lte("data_ref", periodo.ate)
      .order("data_ref", { ascending: false }).order("hora", { ascending: true });
    const baseHe = sb.from("hrdp_overtime_requests")
      .select("*").eq("company_id", companyId)
      .gte("data_ref", periodo.de).lte("data_ref", periodo.ate)
      .order("created_at",{ascending:false});
    const baseBank = sb.from("hrdp_time_bank")
      .select("*").eq("company_id", companyId)
      .order("data_ref",{ascending:false});

    const [e, h, b] = await Promise.all([
      targetEmpId ? baseEntries.eq("employee_id", targetEmpId) : baseEntries,
      targetEmpId ? baseHe.eq("employee_id", targetEmpId) : baseHe,
      targetEmpId ? baseBank.eq("employee_id", targetEmpId) : baseBank,
    ]);
    setEntries(e.data ?? []);
    setOvertimes(h.data ?? []);
    setBank(b.data ?? []);
  }
  useEffect(() => { loadAll(); }, [companyId, targetEmpId, periodo.de, periodo.ate]);

  // ------ Bater ponto rápido (self) ------
  async function baterPonto(tipo: string) {
    if (!me) { toast.error("Você não está cadastrado como colaborador desta empresa"); return; }
    const now = new Date();
    const payload = {
      company_id: companyId,
      employee_id: me.id,
      data_ref: now.toISOString().slice(0,10),
      tipo,
      hora: now.toTimeString().slice(0,8),
      origem: "web",
      created_by: user?.id,
    };
    const { error } = await sb.from("hrdp_time_entries").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(`Ponto registrado: ${TIPOS.find(t=>t.v===tipo)?.l}`);
    loadAll();
  }

  // ------ Hora extra ------
  function newHe() {
    const empId = targetEmpId || me?.id || employees[0]?.id;
    if (!empId) { toast.error("Sem colaborador alvo"); return; }
    setEditHe({
      employee_id: empId, data_ref: new Date().toISOString().slice(0,10),
      hora_inicio: "18:00", hora_fim: "20:00", tipo: "dia_util",
      destino: "pagar", status: "pendente", motivo: "",
    });
    setOpenHe(true);
  }
  async function saveHe() {
    if (!editHe || !companyId) return;
    const total = diffHours(editHe.hora_inicio!, editHe.hora_fim!);
    const payload: any = {
      ...editHe, company_id: companyId, total_horas: total, created_by: user?.id,
    };
    const { error } = await sb.from("hrdp_overtime_requests").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Solicitação de HE criada");
    setOpenHe(false); setEditHe(null);
    loadAll();
  }
  async function decideHe(row: Overtime, status: "aprovada" | "recusada") {
    const obs = status === "recusada" ? prompt("Motivo da recusa (opcional):") ?? "" : "";
    const { error } = await sb.from("hrdp_overtime_requests").update({
      status, aprovador_id: user?.id, aprovado_em: new Date().toISOString(), obs_aprovador: obs,
    }).eq("id", row.id);
    if (error) { toast.error(error.message); return; }

    // Se aprovado e destino = banco_horas, lançar crédito
    if (status === "aprovada" && row.destino === "banco_horas" && row.total_horas) {
      await sb.from("hrdp_time_bank").insert({
        company_id: row.company_id, employee_id: row.employee_id,
        data_ref: row.data_ref, horas: row.total_horas, tipo: "credito",
        origem_he: row.id, descricao: `HE ${row.tipo} aprovada`, created_by: user?.id,
      });
    }
    toast.success(`HE ${status}`);
    loadAll();
  }

  // ------ Banco de horas: lançamento manual ------
  const [bankForm, setBankForm] = useState({ horas: "", tipo: "compensacao", descricao: "" });
  async function lancarBanco() {
    if (!targetEmpId || !companyId) { toast.error("Selecione um colaborador"); return; }
    const h = Number(bankForm.horas);
    if (isNaN(h) || h === 0) { toast.error("Informe horas (use - para débito)"); return; }
    const { error } = await sb.from("hrdp_time_bank").insert({
      company_id: companyId, employee_id: targetEmpId,
      data_ref: new Date().toISOString().slice(0,10),
      horas: h, tipo: bankForm.tipo, descricao: bankForm.descricao || null, created_by: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    setBankForm({ horas: "", tipo: "compensacao", descricao: "" });
    toast.success("Lançamento adicionado");
    loadAll();
  }

  const saldoBanco = useMemo(
    () => Math.round(bank.reduce((s, r) => s + Number(r.horas || 0), 0) * 100) / 100,
    [bank]
  );
  const heMes = useMemo(() => {
    const m = new Date().toISOString().slice(0,7);
    return overtimes.filter(o => o.data_ref.startsWith(m) && o.status === "aprovada")
      .reduce((s, o) => s + Number(o.total_horas ?? 0), 0);
  }, [overtimes]);
  const hePend = overtimes.filter(o => o.status === "pendente").length;

  // Espelho do dia (ponto)
  const espelho = useMemo(() => {
    const map = new Map<string, TimeEntry[]>();
    entries.forEach(e => {
      const k = `${e.data_ref}__${e.employee_id}`;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    });
    return Array.from(map.entries()).map(([k, list]) => {
      const [data_ref, employee_id] = k.split("__");
      const get = (t: string) => list.find(x => x.tipo === t)?.hora?.slice(0,5) ?? "—";
      return { data_ref, employee_id, list, ent: get("entrada"), as: get("almoco_saida"), ar: get("almoco_retorno"), sai: get("saida") };
    }).sort((a,b) => b.data_ref.localeCompare(a.data_ref));
  }, [entries]);

  const empName = (id: string) => employees.find(e => e.id === id)?.nome ?? "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" /> Ponto · Hora Extra · Banco de Horas
          </h1>
          <p className="text-sm text-muted-foreground">
            Marcações de ponto, solicitações de HE e saldo do banco de horas.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <Select value={companyId ?? ""} onValueChange={selectCompany}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Empresa" /></SelectTrigger>
              <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Select value={empFilter} onValueChange={setEmpFilter}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Colaborador" /></SelectTrigger>
            <SelectContent>
              {me && <SelectItem value="__me__">Eu ({me.nome})</SelectItem>}
              {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Banner regulatório */}
      <div className="text-[11px] text-muted-foreground border rounded p-2 bg-muted/30">
        Cálculos referenciais (jornada e adicionais conforme convenção coletiva). Aprovação humana é obrigatória.
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Saldo banco de horas</div>
          <div className={`text-2xl font-bold ${saldoBanco>=0?"text-primary":"text-destructive"}`}>{saldoBanco}h</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">HE aprovada (mês)</div>
          <div className="text-2xl font-bold">{Math.round(heMes*100)/100}h</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">HE pendentes</div>
          <div className="text-2xl font-bold text-amber-500">{hePend}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Marcações no período</div>
          <div className="text-2xl font-bold">{entries.length}</div></CardContent></Card>
      </div>

      {/* Bater ponto rápido — apenas para "eu" */}
      {me && empFilter === "__me__" && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlarmClock className="w-4 h-4" /> Bater ponto agora</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {TIPOS.map(t => (
              <Button key={t.v} variant="outline" onClick={() => baterPonto(t.v)}>{t.l}</Button>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ponto">Espelho de ponto</TabsTrigger>
          <TabsTrigger value="he">Hora extra</TabsTrigger>
          <TabsTrigger value="banco">Banco de horas</TabsTrigger>
        </TabsList>

        {/* ---- Espelho ---- */}
        <TabsContent value="ponto" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base">Espelho do período</CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-xs">De</Label>
                <Input type="date" className="w-40" value={periodo.de} onChange={(e)=>setPeriodo({...periodo, de: e.target.value})} />
                <Label className="text-xs">Até</Label>
                <Input type="date" className="w-40" value={periodo.ate} onChange={(e)=>setPeriodo({...periodo, ate: e.target.value})} />
              </div>
            </CardHeader>
            <CardContent>
              {espelho.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">Nenhuma marcação no período.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      {empFilter !== "__me__" && <TableHead>Colaborador</TableHead>}
                      <TableHead>Entrada</TableHead>
                      <TableHead>Almoço (saída)</TableHead>
                      <TableHead>Almoço (retorno)</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead>Marcações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {espelho.map(row => (
                      <TableRow key={`${row.data_ref}-${row.employee_id}`}>
                        <TableCell className="font-medium">{row.data_ref}</TableCell>
                        {empFilter !== "__me__" && <TableCell>{empName(row.employee_id)}</TableCell>}
                        <TableCell>{row.ent}</TableCell>
                        <TableCell>{row.as}</TableCell>
                        <TableCell>{row.ar}</TableCell>
                        <TableCell>{row.sai}</TableCell>
                        <TableCell><Badge variant="outline">{row.list.length}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- HE ---- */}
        <TabsContent value="he" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Hourglass className="w-4 h-4" /> Solicitações de Hora Extra</CardTitle>
              <Button size="sm" onClick={newHe}><Plus className="w-4 h-4 mr-1" /> Nova HE</Button>
            </CardHeader>
            <CardContent>
              {overtimes.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">Sem solicitações.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-32"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overtimes.map(o => (
                      <TableRow key={o.id}>
                        <TableCell>{o.data_ref}</TableCell>
                        <TableCell>{empName(o.employee_id)}</TableCell>
                        <TableCell>{o.hora_inicio?.slice(0,5)}–{o.hora_fim?.slice(0,5)}</TableCell>
                        <TableCell>{o.total_horas ?? "—"}h</TableCell>
                        <TableCell><Badge variant="outline">{o.tipo}</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{o.destino}</Badge></TableCell>
                        <TableCell>
                          {o.status === "aprovada" && <Badge>aprovada</Badge>}
                          {o.status === "recusada" && <Badge variant="destructive">recusada</Badge>}
                          {o.status === "pendente" && <Badge className="bg-amber-500">pendente</Badge>}
                        </TableCell>
                        <TableCell>
                          {o.status === "pendente" && (
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={()=>decideHe(o,"aprovada")}>
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={()=>decideHe(o,"recusada")}>
                                <XCircle className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Banco ---- */}
        <TabsContent value="banco" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wallet className="w-4 h-4" /> Lançar movimento</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div>
                <Label className="text-xs">Horas (use − para débito)</Label>
                <Input type="number" step="0.25" value={bankForm.horas} onChange={(e)=>setBankForm({...bankForm, horas: e.target.value})} />
              </div>
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={bankForm.tipo} onValueChange={(v)=>setBankForm({...bankForm, tipo: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["credito","compensacao","ajuste","expirado"].map(t=> <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Descrição</Label>
                <Input value={bankForm.descricao} onChange={(e)=>setBankForm({...bankForm, descricao: e.target.value})} />
              </div>
              <div className="md:col-span-4">
                <Button onClick={lancarBanco}>Lançar</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Movimentos · saldo {saldoBanco}h</CardTitle></CardHeader>
            <CardContent>
              {bank.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">Sem movimentos no banco.</div>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Data</TableHead><TableHead>Colaborador</TableHead>
                    <TableHead>Horas</TableHead><TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {bank.map(b => (
                      <TableRow key={b.id}>
                        <TableCell>{b.data_ref}</TableCell>
                        <TableCell>{empName(b.employee_id)}</TableCell>
                        <TableCell className={b.horas>=0?"text-primary font-medium":"text-destructive font-medium"}>
                          {b.horas>0?"+":""}{b.horas}h
                        </TableCell>
                        <TableCell><Badge variant="outline">{b.tipo}</Badge></TableCell>
                        <TableCell className="max-w-xs truncate">{b.descricao ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sheet HE */}
      <Sheet open={openHe} onOpenChange={setOpenHe}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader><SheetTitle>Nova solicitação de hora extra</SheetTitle></SheetHeader>
          {editHe && (
            <div className="space-y-3 mt-4">
              <div>
                <Label>Colaborador</Label>
                <Select value={editHe.employee_id} onValueChange={(v)=>setEditHe({...editHe, employee_id: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={editHe.data_ref ?? ""} onChange={(e)=>setEditHe({...editHe, data_ref: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Início</Label>
                  <Input type="time" value={editHe.hora_inicio ?? ""} onChange={(e)=>setEditHe({...editHe, hora_inicio: e.target.value})} />
                </div>
                <div>
                  <Label>Fim</Label>
                  <Input type="time" value={editHe.hora_fim ?? ""} onChange={(e)=>setEditHe({...editHe, hora_fim: e.target.value})} />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Total estimado: <b>{editHe.hora_inicio && editHe.hora_fim ? diffHours(editHe.hora_inicio, editHe.hora_fim) : 0}h</b>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Tipo</Label>
                  <Select value={editHe.tipo} onValueChange={(v)=>setEditHe({...editHe, tipo: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["dia_util","fim_de_semana","feriado","noturno"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Destino</Label>
                  <Select value={editHe.destino} onValueChange={(v)=>setEditHe({...editHe, destino: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pagar">Pagar</SelectItem>
                      <SelectItem value="banco_horas">Banco de horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Motivo</Label>
                <Textarea rows={3} value={editHe.motivo ?? ""} onChange={(e)=>setEditHe({...editHe, motivo: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={()=>setOpenHe(false)}>Cancelar</Button>
                <Button onClick={saveHe}>Solicitar</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
