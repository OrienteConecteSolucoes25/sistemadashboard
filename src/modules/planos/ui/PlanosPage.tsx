import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePlanosAccess } from "../hooks/usePlanosAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, MessageCircle, CreditCard, Building2, Package, Bell, Calculator, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { paymentStatus, ymNow, whatsappLink, buildBillingMessage } from "../lib/billing";
import CalculadoraTab from "./CalculadoraTab";
import CompanySheet from "./CompanySheet";
import ImpersonateButton from "./ImpersonateButton";

type Company = { id: string; nome: string; cnpj?: string; contato_nome?: string; contato_email?: string; contato_whatsapp?: string; pix_chave?: string; ativo: boolean };
type Catalog = { key: string; label: string; grupo: string; sempre_obrigatorio: boolean; ordem: number };
type Pkg = { id: string; nome: string; descricao?: string; modules: string[] };
type Plan = { id: string; company_id: string; valor_mensal: number; dia_vencimento: number; modules: string[]; status: string; observacoes?: string };
type Payment = { id: string; company_plan_id: string; competencia: string; valor_pago: number; data_pagamento: string };

const sb: any = supabase;

export default function PlanosPage() {
  const { isFinanceiro, checking } = usePlanosAccess();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [catalog, setCatalog] = useState<Catalog[]>([]);
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [editing, setEditing] = useState<Company | null>(null);
  const [planEditor, setPlanEditor] = useState<{ company: Company; plan: Plan | null } | null>(null);
  const [paymentModal, setPaymentModal] = useState<Plan | null>(null);
  const [openSheet, setOpenSheet] = useState<Company | null>(null);

  async function reload() {
    const [{ data: c }, { data: p }, { data: pay }, { data: cat }, { data: pk }] = await Promise.all([
      sb.from("companies").select("*").order("nome"),
      sb.from("company_plans").select("*"),
      sb.from("company_plan_payments").select("*"),
      sb.from("plan_modules_catalog").select("*").eq("ativo", true).order("ordem"),
      sb.from("plan_packages").select("*").eq("ativo", true).order("nome"),
    ]);
    setCompanies(c ?? []);
    setPlans(p ?? []);
    setPayments(pay ?? []);
    setCatalog(cat ?? []);
    setPackages(pk ?? []);
  }
  useEffect(() => { if (isFinanceiro) reload(); }, [isFinanceiro]);

  if (checking) return null;
  if (!isFinanceiro) return <Navigate to="/app" replace />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="w-6 h-6 text-primary" /> Planos de Usuários</h1>
          <p className="text-sm text-muted-foreground">Gerencie empresas, assinaturas e pagamentos do ERP OCS.</p>
        </div>
      </div>

      <Tabs defaultValue="empresas" className="w-full">
        <TabsList>
          <TabsTrigger value="empresas"><Building2 className="w-4 h-4 mr-1" /> Empresas</TabsTrigger>
          <TabsTrigger value="pagamentos"><CreditCard className="w-4 h-4 mr-1" /> Pagamentos</TabsTrigger>
          <TabsTrigger value="calculadora"><Calculator className="w-4 h-4 mr-1" /> Calculadora</TabsTrigger>
          <TabsTrigger value="avisos"><Bell className="w-4 h-4 mr-1" /> Avisos</TabsTrigger>
          <TabsTrigger value="catalogo"><Package className="w-4 h-4 mr-1" /> Catálogo & Pacotes</TabsTrigger>
        </TabsList>

        <TabsContent value="empresas" className="space-y-4">
          <CompaniesTab
            companies={companies} plans={plans} payments={payments}
            onEdit={(c) => setEditing(c)}
            onPlan={(c) => setPlanEditor({ company: c, plan: plans.find(p => p.company_id === c.id) ?? null })}
            onWhatsApp={(c, p) => sendWhatsApp(c, p, payments.filter(x => x.company_plan_id === p.id))}
            onNew={() => setEditing({ id: "", nome: "", ativo: true } as Company)}
            onOpenSheet={(c) => setOpenSheet(c)}
          />
        </TabsContent>

        <TabsContent value="pagamentos" className="space-y-4">
          <PaymentsTab companies={companies} plans={plans} payments={payments} onRegister={(p) => setPaymentModal(p)} onReload={reload} />
        </TabsContent>

        <TabsContent value="calculadora" className="space-y-4">
          <CalculadoraTab />
        </TabsContent>

        <TabsContent value="avisos" className="space-y-4">
          <BillingRunsTab />
        </TabsContent>

        <TabsContent value="catalogo" className="space-y-4">
          <CatalogTab catalog={catalog} packages={packages} onReload={reload} />
        </TabsContent>
      </Tabs>

      {openSheet && <CompanySheet company={openSheet} onClose={() => setOpenSheet(null)} onChanged={reload} />}

      {editing && (
        <CompanyModal
          company={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await reload(); }}
        />
      )}
      {planEditor && (
        <PlanModal
          company={planEditor.company}
          plan={planEditor.plan}
          catalog={catalog}
          packages={packages}
          onClose={() => setPlanEditor(null)}
          onSaved={async () => { setPlanEditor(null); await reload(); }}
        />
      )}
      {paymentModal && (
        <PaymentModal
          plan={paymentModal}
          company={companies.find(c => c.id === paymentModal.company_id)!}
          onClose={() => setPaymentModal(null)}
          onSaved={async () => { setPaymentModal(null); await reload(); }}
        />
      )}
    </div>
  );
}

function sendWhatsApp(company: Company, plan: Plan, pays: Payment[]) {
  if (!company.contato_whatsapp) { toast.error("Empresa sem WhatsApp cadastrado"); return; }
  const st = paymentStatus(plan, pays);
  const tipo = st.status === "atrasado" ? "atrasado" : st.status === "vence_hoje" ? "d0" : "d-3";
  const msg = buildBillingMessage({
    empresa: company.nome, valor: Number(plan.valor_mensal), competencia: st.competencia,
    due: st.due, pix: company.pix_chave || "(PIX não cadastrado)", tipo,
  });
  window.open(whatsappLink(company.contato_whatsapp, msg), "_blank");
}

/* ============== Tabs ============== */
function CompaniesTab({ companies, plans, payments, onEdit, onPlan, onWhatsApp, onNew, onOpenSheet }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Empresas ({companies.length})</CardTitle>
        <Button size="sm" onClick={onNew}><Plus className="w-4 h-4 mr-1" /> Nova empresa</Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead><TableHead>WhatsApp</TableHead>
              <TableHead>Valor</TableHead><TableHead>Vencimento</TableHead>
              <TableHead>Status mês</TableHead><TableHead>Abas</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((c: Company) => {
              const plan = plans.find((p: Plan) => p.company_id === c.id);
              const pays = plan ? payments.filter((x: Payment) => x.company_plan_id === plan.id) : [];
              const st = plan ? paymentStatus(plan, pays) : null;
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <button className="text-left hover:underline text-primary inline-flex items-center gap-1" onClick={() => onOpenSheet(c)}>
                      {c.nome} <ExternalLink className="w-3 h-3" />
                    </button>
                    <div className="text-xs text-muted-foreground">{c.cnpj}</div>
                  </TableCell>
                  <TableCell className="text-sm">{c.contato_whatsapp || "—"}</TableCell>
                  <TableCell>{plan ? Number(plan.valor_mensal).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}</TableCell>
                  <TableCell>{plan ? `dia ${plan.dia_vencimento}` : "—"}</TableCell>
                  <TableCell>{st ? <StatusBadge st={st.status} /> : "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{plan?.modules?.length ?? 0}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <ImpersonateButton company={c} />
                    <Button size="icon" variant="ghost" onClick={() => onEdit(c)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => onPlan(c)}>Plano</Button>
                    {plan && c.contato_whatsapp && (
                      <Button size="icon" variant="ghost" onClick={() => onWhatsApp(c, plan)} title="Cobrar WhatsApp">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {companies.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhuma empresa cadastrada.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ st }: { st: string }) {
  const map: any = {
    pago: { label: "Pago", cls: "bg-green-500/15 text-green-700 dark:text-green-400" },
    em_dia: { label: "Em dia", cls: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
    d3: { label: "D-3", cls: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400" },
    vence_hoje: { label: "Vence hoje", cls: "bg-orange-500/15 text-orange-700 dark:text-orange-400" },
    atrasado: { label: "Atrasado", cls: "bg-red-500/15 text-red-700 dark:text-red-400" },
  };
  const v = map[st] ?? map.em_dia;
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${v.cls}`}>{v.label}</span>;
}

function PaymentsTab({ companies, plans, payments, onRegister, onReload }: any) {
  return (
    <Card>
      <CardHeader><CardTitle>Pagamentos registrados</CardTitle></CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          {plans.map((p: Plan) => {
            const c = companies.find((x: Company) => x.id === p.company_id);
            const pays = payments.filter((x: Payment) => x.company_plan_id === p.id);
            const st = paymentStatus(p, pays);
            return (
              <div key={p.id} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{c?.nome}</div>
                  <div className="text-xs text-muted-foreground">{ymNow()} · <StatusBadge st={st.status} /></div>
                </div>
                <Button size="sm" variant="outline" onClick={() => onRegister(p)}><Plus className="w-4 h-4 mr-1" /> Registrar</Button>
              </div>
            );
          })}
        </div>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Empresa</TableHead><TableHead>Competência</TableHead>
            <TableHead>Valor</TableHead><TableHead>Data</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {payments.slice().sort((a: any, b: any) => b.data_pagamento.localeCompare(a.data_pagamento)).map((pay: Payment) => {
              const plan = plans.find((p: Plan) => p.id === pay.company_plan_id);
              const c = plan ? companies.find((x: Company) => x.id === plan.company_id) : null;
              return (
                <TableRow key={pay.id}>
                  <TableCell>{c?.nome ?? "—"}</TableCell>
                  <TableCell>{pay.competencia}</TableCell>
                  <TableCell>{Number(pay.valor_pago).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                  <TableCell>{new Date(pay.data_pagamento).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function BillingRunsTab() {
  const [runs, setRuns] = useState<any[]>([]);
  useEffect(() => {
    sb.from("plan_billing_runs").select("*").order("enviado_em", { ascending: false }).limit(100).then(({ data }: any) => setRuns(data ?? []));
  }, []);
  return (
    <Card>
      <CardHeader><CardTitle>Avisos enviados</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Quando</TableHead><TableHead>Tipo</TableHead><TableHead>Competência</TableHead><TableHead>Canal</TableHead></TableRow></TableHeader>
          <TableBody>
            {runs.map(r => (
              <TableRow key={r.id}>
                <TableCell>{new Date(r.enviado_em).toLocaleString("pt-BR")}</TableCell>
                <TableCell><Badge variant="outline">{r.tipo}</Badge></TableCell>
                <TableCell>{r.competencia}</TableCell>
                <TableCell>{r.canal}</TableCell>
              </TableRow>
            ))}
            {runs.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sem avisos ainda.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function CatalogTab({ catalog, packages, onReload }: any) {
  const [newPkg, setNewPkg] = useState({ nome: "", descricao: "", modules: [] as string[] });
  async function savePkg() {
    if (!newPkg.nome) return toast.error("Informe um nome");
    const { error } = await sb.from("plan_packages").insert(newPkg);
    if (error) return toast.error(error.message);
    toast.success("Pacote criado");
    setNewPkg({ nome: "", descricao: "", modules: [] });
    onReload();
  }
  const grupos = Array.from(new Set(catalog.map((c: any) => c.grupo)));
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle>Catálogo de abas</CardTitle></CardHeader>
        <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
          {grupos.map((g: any) => (
            <div key={g}>
              <div className="text-xs font-semibold text-muted-foreground mb-1">{g}</div>
              <div className="space-y-1">
                {catalog.filter((c: Catalog) => c.grupo === g).map((c: Catalog) => (
                  <div key={c.key} className="flex items-center justify-between text-sm py-1 border-b">
                    <span>{c.label} {c.sempre_obrigatorio && <Badge variant="secondary" className="ml-1 text-[10px]">obrigatório</Badge>}</span>
                    <code className="text-xs text-muted-foreground">{c.key}</code>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Pacotes pré-prontos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {packages.map((p: Pkg) => (
            <div key={p.id} className="border rounded-lg p-3">
              <div className="font-medium">{p.nome}</div>
              <div className="text-xs text-muted-foreground mb-1">{p.descricao}</div>
              <div className="text-xs">{p.modules.length} abas</div>
            </div>
          ))}
          <div className="border-t pt-3 space-y-2">
            <div className="font-medium text-sm">Novo pacote</div>
            <Input placeholder="Nome" value={newPkg.nome} onChange={(e) => setNewPkg({ ...newPkg, nome: e.target.value })} />
            <Input placeholder="Descrição" value={newPkg.descricao} onChange={(e) => setNewPkg({ ...newPkg, descricao: e.target.value })} />
            <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
              {catalog.map((c: Catalog) => (
                <label key={c.key} className="flex items-center gap-2 text-xs">
                  <Checkbox checked={newPkg.modules.includes(c.key)} onCheckedChange={(v) => setNewPkg({
                    ...newPkg,
                    modules: v ? [...newPkg.modules, c.key] : newPkg.modules.filter(x => x !== c.key),
                  })} />
                  {c.label} <span className="text-muted-foreground">({c.grupo})</span>
                </label>
              ))}
            </div>
            <Button size="sm" onClick={savePkg}>Criar pacote</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============== Modais ============== */
function CompanyModal({ company, onClose, onSaved }: any) {
  const [f, setF] = useState<Company>(company);
  async function save() {
    if (!f.nome) return toast.error("Nome obrigatório");
    const payload = { nome: f.nome, cnpj: f.cnpj, contato_nome: f.contato_nome, contato_email: f.contato_email,
      contato_whatsapp: f.contato_whatsapp, pix_chave: f.pix_chave, ativo: f.ativo };
    const { error } = f.id
      ? await sb.from("companies").update(payload).eq("id", f.id)
      : await sb.from("companies").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Salvo");
    onSaved();
  }
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{f.id ? "Editar empresa" : "Nova empresa"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Nome *</Label><Input value={f.nome ?? ""} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
          <div><Label>CNPJ</Label><Input value={f.cnpj ?? ""} onChange={(e) => setF({ ...f, cnpj: e.target.value })} /></div>
          <div><Label>Contato</Label><Input value={f.contato_nome ?? ""} onChange={(e) => setF({ ...f, contato_nome: e.target.value })} /></div>
          <div><Label>E-mail</Label><Input value={f.contato_email ?? ""} onChange={(e) => setF({ ...f, contato_email: e.target.value })} /></div>
          <div><Label>WhatsApp (com DDI)</Label><Input placeholder="5511999999999" value={f.contato_whatsapp ?? ""} onChange={(e) => setF({ ...f, contato_whatsapp: e.target.value })} /></div>
          <div className="col-span-2"><Label>Chave PIX</Label><Input value={f.pix_chave ?? ""} onChange={(e) => setF({ ...f, pix_chave: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlanModal({ company, plan, catalog, packages, onClose, onSaved }: any) {
  const obrig = useMemo(() => catalog.filter((c: Catalog) => c.sempre_obrigatorio).map((c: Catalog) => c.key), [catalog]);
  const [valor, setValor] = useState<number>(plan?.valor_mensal ?? 0);
  const [dia, setDia] = useState<number>(plan?.dia_vencimento ?? 10);
  const [mods, setMods] = useState<string[]>(() => Array.from(new Set([...(plan?.modules ?? []), ...obrig])));
  const [users, setUsers] = useState<any[]>([]);
  const [perms, setPerms] = useState<Record<string, Record<string, { v: boolean; e: boolean; d: boolean }>>>({});

  useEffect(() => {
    (async () => {
      const { data: cu } = await sb.from("company_users").select("user_id, is_company_admin").eq("company_id", company.id);
      const userIds = (cu ?? []).map((x: any) => x.user_id);
      let profs: any[] = [];
      if (userIds.length) {
        const { data } = await sb.from("profiles").select("id, email, full_name").in("id", userIds);
        profs = data ?? [];
      }
      setUsers((cu ?? []).map((c: any) => ({ ...c, profile: profs.find((p) => p.id === c.user_id) })));
      const { data: perm } = await sb.from("company_module_permissions").select("*").eq("company_id", company.id);
      const map: any = {};
      (perm ?? []).forEach((p: any) => {
        map[p.user_id] ??= {};
        map[p.user_id][p.module_key] = { v: p.can_view, e: p.can_edit, d: p.can_delete };
      });
      setPerms(map);
    })();
  }, [company.id]);

  function applyPackage(id: string) {
    const pk = packages.find((p: Pkg) => p.id === id);
    if (!pk) return;
    setMods(Array.from(new Set([...pk.modules, ...obrig])));
  }

  async function save() {
    const payload = { company_id: company.id, valor_mensal: valor, dia_vencimento: dia, modules: mods, status: "ativo" };
    const { data: saved, error } = plan
      ? await sb.from("company_plans").update(payload).eq("id", plan.id).select().single()
      : await sb.from("company_plans").insert(payload).select().single();
    if (error) return toast.error(error.message);
    // upsert permissions
    const rows: any[] = [];
    Object.entries(perms).forEach(([user_id, mp]) => {
      Object.entries(mp).forEach(([module_key, v]) => {
        if (mods.includes(module_key)) rows.push({ company_id: company.id, user_id, module_key, can_view: v.v, can_edit: v.e, can_delete: v.d });
      });
    });
    if (rows.length) await sb.from("company_module_permissions").upsert(rows, { onConflict: "company_id,user_id,module_key" });
    toast.success("Plano salvo");
    onSaved();
  }

  const grupos = Array.from(new Set(catalog.map((c: Catalog) => c.grupo)));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Plano · {company.nome}</DialogTitle></DialogHeader>
        <div className="grid md:grid-cols-3 gap-3">
          <div><Label>Valor mensal (R$)</Label><Input type="number" step="0.01" value={valor} onChange={(e) => setValor(Number(e.target.value))} /></div>
          <div><Label>Dia de vencimento</Label><Input type="number" min={1} max={28} value={dia} onChange={(e) => setDia(Number(e.target.value))} /></div>
          <div>
            <Label>Aplicar pacote</Label>
            <Select onValueChange={applyPackage}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>{packages.map((p: Pkg) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Abas do plano ({mods.length})</Label>
          <div className="grid md:grid-cols-3 gap-3">
            {grupos.map((g: any) => (
              <div key={g} className="border rounded p-2">
                <div className="text-xs font-semibold mb-2">{g}</div>
                {catalog.filter((c: Catalog) => c.grupo === g).map((c: Catalog) => (
                  <label key={c.key} className="flex items-center gap-2 text-sm py-1">
                    <Checkbox
                      disabled={c.sempre_obrigatorio}
                      checked={mods.includes(c.key)}
                      onCheckedChange={(v) => setMods(v ? [...mods, c.key] : mods.filter(x => x !== c.key))}
                    />
                    {c.label}{c.sempre_obrigatorio && <Badge variant="secondary" className="text-[10px]">obrigatório</Badge>}
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Permissões por usuário (V/E/D)</Label>
          {users.length === 0 && <p className="text-xs text-muted-foreground">Nenhum usuário vinculado a esta empresa ainda. Vincule usuários para definir permissões.</p>}
          {users.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    {mods.map((m) => <TableHead key={m} className="text-center text-xs">{catalog.find((c: Catalog) => c.key === m)?.label ?? m}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u: any) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="text-xs">{u.profile?.full_name || u.profile?.email || u.user_id.slice(0, 8)}</TableCell>
                      {mods.map((m) => {
                        const p = perms[u.user_id]?.[m] ?? { v: false, e: false, d: false };
                        const setP = (np: any) => setPerms({ ...perms, [u.user_id]: { ...(perms[u.user_id] ?? {}), [m]: np } });
                        return (
                          <TableCell key={m} className="text-center">
                            <div className="flex gap-1 justify-center">
                              <Checkbox checked={p.v} onCheckedChange={(v) => setP({ ...p, v: !!v })} title="Ver" />
                              <Checkbox checked={p.e} onCheckedChange={(v) => setP({ ...p, e: !!v })} title="Editar" />
                              <Checkbox checked={p.d} onCheckedChange={(v) => setP({ ...p, d: !!v })} title="Excluir" />
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save}>Salvar plano</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaymentModal({ plan, company, onClose, onSaved }: any) {
  const [f, setF] = useState({
    competencia: ymNow(),
    valor_pago: Number(plan.valor_mensal),
    data_pagamento: new Date().toISOString().slice(0, 10),
    observacao: "",
  });
  async function save() {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await sb.from("company_plan_payments").upsert(
      { ...f, company_plan_id: plan.id, registrado_por: user?.id },
      { onConflict: "company_plan_id,competencia" }
    );
    if (error) return toast.error(error.message);
    toast.success("Pagamento registrado");
    onSaved();
  }
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar pagamento · {company?.nome}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Competência (YYYY-MM)</Label><Input value={f.competencia} onChange={(e) => setF({ ...f, competencia: e.target.value })} /></div>
          <div><Label>Valor pago</Label><Input type="number" step="0.01" value={f.valor_pago} onChange={(e) => setF({ ...f, valor_pago: Number(e.target.value) })} /></div>
          <div><Label>Data</Label><Input type="date" value={f.data_pagamento} onChange={(e) => setF({ ...f, data_pagamento: e.target.value })} /></div>
          <div><Label>Observação</Label><Textarea value={f.observacao} onChange={(e) => setF({ ...f, observacao: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
