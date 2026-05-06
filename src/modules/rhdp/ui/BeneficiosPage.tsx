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
import { HeartHandshake, Plus, CheckCircle2, AlertTriangle, Package, Users, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useHrdpCompany } from "../hooks/useHrdpCompany";

const sb: any = supabase;

type Employee = { id: string; nome: string };
type Benefit = {
  id: string;
  employee_id: string | null;
  tipo: string;
  fornecedor: string | null;
  plano: string | null;
  valor_empresa: number;
  valor_colaborador: number;
  data_inicio: string | null;
  data_fim: string | null;
  status: string;
  observacoes: string | null;
};
type Quote = {
  id: string;
  titulo: string;
  tipo: string;
  fornecedor: string | null;
  modalidade: string | null;
  faixa: string | null;
  qtd_estim_colaboradores: number;
  valor_unitario_estimado: number;
  valor_total_estimado: number;
  observacoes: string | null;
  link_referencia: string | null;
  status: string;
  aprovado_em: string | null;
};

const TIPOS_BEN = [
  { v: "vr", l: "Vale Refeição" },
  { v: "va", l: "Vale Alimentação" },
  { v: "vt", l: "Vale Transporte" },
  { v: "saude", l: "Plano de Saúde" },
  { v: "odonto", l: "Plano Odontológico" },
  { v: "vida", l: "Seguro de Vida" },
  { v: "academia", l: "Academia / Bem-estar" },
  { v: "outros", l: "Outros" },
];

const STATUS_BEN: Record<string, { l: string; v: "default" | "secondary" | "destructive" | "outline" }> = {
  ativo: { l: "Ativo", v: "default" },
  suspenso: { l: "Suspenso", v: "secondary" },
  encerrado: { l: "Encerrado", v: "outline" },
};

const STATUS_QUOTE: Record<string, { l: string; v: "default" | "secondary" | "destructive" | "outline" }> = {
  rascunho: { l: "Rascunho", v: "secondary" },
  em_analise: { l: "Em análise", v: "outline" },
  aprovado: { l: "Aprovado OCS", v: "default" },
  recusado: { l: "Recusado", v: "destructive" },
};

const fmt = (n: number) => (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function BeneficiosPage() {
  const { companyId, ready } = useHrdpCompany();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [openBen, setOpenBen] = useState(false);
  const [openQuote, setOpenQuote] = useState(false);
  const [editBen, setEditBen] = useState<Partial<Benefit> | null>(null);
  const [editQuote, setEditQuote] = useState<Partial<Quote> | null>(null);

  async function load() {
    if (!companyId) return;
    const [{ data: emps }, { data: bens }, { data: qts }] = await Promise.all([
      sb.from("hrdp_employees").select("id,nome").eq("company_id", companyId).eq("is_deleted", false).order("nome"),
      sb.from("hrdp_benefits").select("*").eq("company_id", companyId).eq("is_deleted", false).order("created_at", { ascending: false }),
      sb.from("hrdp_benefit_quotes").select("*").eq("company_id", companyId).eq("is_deleted", false).order("created_at", { ascending: false }),
    ]);
    setEmployees(emps ?? []);
    setBenefits(bens ?? []);
    setQuotes(qts ?? []);
  }

  useEffect(() => { if (ready && companyId) load(); }, [ready, companyId]);

  const kpis = useMemo(() => {
    const ativos = benefits.filter(b => b.status === "ativo");
    const custoTotal = ativos.reduce((s, b) => s + Number(b.valor_empresa || 0), 0);
    const colabsCobertos = new Set(ativos.map(b => b.employee_id).filter(Boolean)).size;
    const cotPend = quotes.filter(q => q.status === "rascunho" || q.status === "em_analise").length;
    return { ativos: ativos.length, custoTotal, colabsCobertos, cotPend };
  }, [benefits, quotes]);

  async function saveBenefit() {
    if (!editBen || !companyId) return;
    if (!editBen.tipo) { toast.error("Selecione o tipo"); return; }
    const payload: any = {
      company_id: companyId,
      employee_id: editBen.employee_id || null,
      tipo: editBen.tipo,
      fornecedor: editBen.fornecedor || null,
      plano: editBen.plano || null,
      valor_empresa: Number(editBen.valor_empresa || 0),
      valor_colaborador: Number(editBen.valor_colaborador || 0),
      data_inicio: editBen.data_inicio || null,
      data_fim: editBen.data_fim || null,
      status: editBen.status || "ativo",
      observacoes: editBen.observacoes || null,
    };
    const q = editBen.id
      ? sb.from("hrdp_benefits").update(payload).eq("id", editBen.id)
      : sb.from("hrdp_benefits").insert(payload);
    const { error } = await q;
    if (error) { toast.error(error.message); return; }
    toast.success("Benefício salvo");
    setOpenBen(false); setEditBen(null); load();
  }

  async function saveQuote() {
    if (!editQuote || !companyId) return;
    if (!editQuote.titulo || !editQuote.tipo) { toast.error("Preencha título e tipo"); return; }
    const qtd = Number(editQuote.qtd_estim_colaboradores || 0);
    const vu = Number(editQuote.valor_unitario_estimado || 0);
    const payload: any = {
      company_id: companyId,
      titulo: editQuote.titulo,
      tipo: editQuote.tipo,
      fornecedor: editQuote.fornecedor || null,
      modalidade: editQuote.modalidade || null,
      faixa: editQuote.faixa || null,
      qtd_estim_colaboradores: qtd,
      valor_unitario_estimado: vu,
      valor_total_estimado: qtd * vu,
      observacoes: editQuote.observacoes || null,
      link_referencia: editQuote.link_referencia || null,
      status: editQuote.status || "rascunho",
    };
    const q = editQuote.id
      ? sb.from("hrdp_benefit_quotes").update(payload).eq("id", editQuote.id)
      : sb.from("hrdp_benefit_quotes").insert(payload);
    const { error } = await q;
    if (error) { toast.error(error.message); return; }
    toast.success("Cotação salva");
    setOpenQuote(false); setEditQuote(null); load();
  }

  async function approveQuote(id: string) {
    const { error } = await sb.from("hrdp_benefit_quotes")
      .update({ status: "aprovado", aprovado_em: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Cotação aprovada");
    load();
  }

  async function rejectQuote(id: string) {
    const { error } = await sb.from("hrdp_benefit_quotes").update({ status: "recusado" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Cotação recusada");
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-primary" /> Benefícios & Pacotes
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestão de benefícios por colaborador e cotação de pacotes corporativos com aprovação OCS.
          </p>
        </div>
      </div>

      <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          Valores informados são <b>estimativas internas</b>. Cotações de fornecedores externos exigem
          <b> aprovação manual OCS</b> antes de qualquer contratação. Nenhuma integração paga é executada automaticamente.
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Package className="w-3 h-3" /> Benefícios ativos</div>
          <div className="text-2xl font-bold">{kpis.ativos}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> Colaboradores cobertos</div>
          <div className="text-2xl font-bold">{kpis.colabsCobertos}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> Custo mensal empresa</div>
          <div className="text-2xl font-bold">{fmt(kpis.custoTotal)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Cotações pendentes</div>
          <div className="text-2xl font-bold">{kpis.cotPend}</div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="beneficios">
        <TabsList>
          <TabsTrigger value="beneficios">Benefícios atribuídos</TabsTrigger>
          <TabsTrigger value="cotacoes">Cotações de pacotes</TabsTrigger>
        </TabsList>

        <TabsContent value="beneficios" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setEditBen({ status: "ativo" }); setOpenBen(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Novo benefício
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead className="text-right">Empresa</TableHead>
                    <TableHead className="text-right">Colaborador</TableHead>
                    <TableHead>Vigência</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {benefits.length === 0 && (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-6">Nenhum benefício cadastrado.</TableCell></TableRow>
                  )}
                  {benefits.map(b => (
                    <TableRow key={b.id}>
                      <TableCell>{employees.find(e => e.id === b.employee_id)?.nome ?? "—"}</TableCell>
                      <TableCell>{TIPOS_BEN.find(t => t.v === b.tipo)?.l ?? b.tipo}</TableCell>
                      <TableCell>{b.fornecedor || "—"}</TableCell>
                      <TableCell>{b.plano || "—"}</TableCell>
                      <TableCell className="text-right">{fmt(Number(b.valor_empresa))}</TableCell>
                      <TableCell className="text-right">{fmt(Number(b.valor_colaborador))}</TableCell>
                      <TableCell className="text-xs">
                        {b.data_inicio ? new Date(b.data_inicio).toLocaleDateString("pt-BR") : "—"}
                        {b.data_fim ? ` → ${new Date(b.data_fim).toLocaleDateString("pt-BR")}` : ""}
                      </TableCell>
                      <TableCell><Badge variant={STATUS_BEN[b.status]?.v ?? "outline"}>{STATUS_BEN[b.status]?.l ?? b.status}</Badge></TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => { setEditBen(b); setOpenBen(true); }}>Editar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cotacoes" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setEditQuote({ status: "rascunho" }); setOpenQuote(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Nova cotação
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Unit.</TableHead>
                    <TableHead className="text-right">Total est.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">Nenhuma cotação registrada.</TableCell></TableRow>
                  )}
                  {quotes.map(q => (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium">{q.titulo}</TableCell>
                      <TableCell>{TIPOS_BEN.find(t => t.v === q.tipo)?.l ?? q.tipo}</TableCell>
                      <TableCell>{q.fornecedor || "—"}</TableCell>
                      <TableCell className="text-right">{q.qtd_estim_colaboradores}</TableCell>
                      <TableCell className="text-right">{fmt(Number(q.valor_unitario_estimado))}</TableCell>
                      <TableCell className="text-right">{fmt(Number(q.valor_total_estimado))}</TableCell>
                      <TableCell><Badge variant={STATUS_QUOTE[q.status]?.v ?? "outline"}>{STATUS_QUOTE[q.status]?.l ?? q.status}</Badge></TableCell>
                      <TableCell className="space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => { setEditQuote(q); setOpenQuote(true); }}>Editar</Button>
                        {q.status !== "aprovado" && (
                          <Button size="sm" variant="ghost" onClick={() => approveQuote(q.id)}>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </Button>
                        )}
                        {q.status !== "recusado" && q.status !== "aprovado" && (
                          <Button size="sm" variant="ghost" onClick={() => rejectQuote(q.id)}>Recusar</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Benefit sheet */}
      <Sheet open={openBen} onOpenChange={setOpenBen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>{editBen?.id ? "Editar benefício" : "Novo benefício"}</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4">
            <div>
              <Label>Colaborador</Label>
              <Select value={editBen?.employee_id ?? ""} onValueChange={v => setEditBen({ ...editBen, employee_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo *</Label>
                <Select value={editBen?.tipo ?? ""} onValueChange={v => setEditBen({ ...editBen, tipo: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{TIPOS_BEN.map(t => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editBen?.status ?? "ativo"} onValueChange={v => setEditBen({ ...editBen, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STATUS_BEN).map(([k, v]) => <SelectItem key={k} value={k}>{v.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Fornecedor</Label><Input value={editBen?.fornecedor ?? ""} onChange={e => setEditBen({ ...editBen, fornecedor: e.target.value })} /></div>
              <div><Label>Plano</Label><Input value={editBen?.plano ?? ""} onChange={e => setEditBen({ ...editBen, plano: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor empresa (R$)</Label><Input type="number" step="0.01" value={editBen?.valor_empresa ?? 0} onChange={e => setEditBen({ ...editBen, valor_empresa: Number(e.target.value) })} /></div>
              <div><Label>Valor colaborador (R$)</Label><Input type="number" step="0.01" value={editBen?.valor_colaborador ?? 0} onChange={e => setEditBen({ ...editBen, valor_colaborador: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Início</Label><Input type="date" value={editBen?.data_inicio ?? ""} onChange={e => setEditBen({ ...editBen, data_inicio: e.target.value })} /></div>
              <div><Label>Fim</Label><Input type="date" value={editBen?.data_fim ?? ""} onChange={e => setEditBen({ ...editBen, data_fim: e.target.value })} /></div>
            </div>
            <div><Label>Observações</Label><Textarea rows={3} value={editBen?.observacoes ?? ""} onChange={e => setEditBen({ ...editBen, observacoes: e.target.value })} /></div>
            <Button className="w-full" onClick={saveBenefit}>Salvar</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Quote sheet */}
      <Sheet open={openQuote} onOpenChange={setOpenQuote}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>{editQuote?.id ? "Editar cotação" : "Nova cotação"}</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4">
            <div><Label>Título *</Label><Input value={editQuote?.titulo ?? ""} onChange={e => setEditQuote({ ...editQuote, titulo: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo *</Label>
                <Select value={editQuote?.tipo ?? ""} onValueChange={v => setEditQuote({ ...editQuote, tipo: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{TIPOS_BEN.map(t => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editQuote?.status ?? "rascunho"} onValueChange={v => setEditQuote({ ...editQuote, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STATUS_QUOTE).map(([k, v]) => <SelectItem key={k} value={k}>{v.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Fornecedor</Label><Input value={editQuote?.fornecedor ?? ""} onChange={e => setEditQuote({ ...editQuote, fornecedor: e.target.value })} /></div>
              <div><Label>Modalidade</Label><Input placeholder="ex: mensal, individual" value={editQuote?.modalidade ?? ""} onChange={e => setEditQuote({ ...editQuote, modalidade: e.target.value })} /></div>
            </div>
            <div><Label>Faixa / cobertura</Label><Input value={editQuote?.faixa ?? ""} onChange={e => setEditQuote({ ...editQuote, faixa: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Qtd. estimada</Label><Input type="number" value={editQuote?.qtd_estim_colaboradores ?? 0} onChange={e => setEditQuote({ ...editQuote, qtd_estim_colaboradores: Number(e.target.value) })} /></div>
              <div><Label>Valor unitário (R$)</Label><Input type="number" step="0.01" value={editQuote?.valor_unitario_estimado ?? 0} onChange={e => setEditQuote({ ...editQuote, valor_unitario_estimado: Number(e.target.value) })} /></div>
            </div>
            <div className="text-xs text-muted-foreground">
              Total estimado: <b>{fmt(Number(editQuote?.qtd_estim_colaboradores || 0) * Number(editQuote?.valor_unitario_estimado || 0))}</b>
            </div>
            <div><Label>Link de referência</Label><Input placeholder="https://..." value={editQuote?.link_referencia ?? ""} onChange={e => setEditQuote({ ...editQuote, link_referencia: e.target.value })} /></div>
            <div><Label>Observações</Label><Textarea rows={3} value={editQuote?.observacoes ?? ""} onChange={e => setEditQuote({ ...editQuote, observacoes: e.target.value })} /></div>
            <Button className="w-full" onClick={saveQuote}>Salvar</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
