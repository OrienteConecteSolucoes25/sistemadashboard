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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSignature, Plus, Upload, Download, AlertTriangle, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useHrdpCompany } from "../hooks/useHrdpCompany";
import { maskMoney } from "../lib/mask";

const sb: any = supabase;

const TIPOS = ["CLT","PJ","Estagio","Aprendiz","Temporario","Autonomo"];
const STATUS = ["ativo","em_renovacao","vencido","encerrado","suspenso"];

type Contract = {
  id: string;
  company_id: string;
  employee_id: string;
  tipo: string;
  modelo: string | null;
  numero: string | null;
  data_inicio: string;
  data_fim: string | null;
  experiencia_dias: number | null;
  data_fim_experiencia: string | null;
  jornada_horas: number | null;
  salario: number | null;
  status: string;
  observacoes: string | null;
  arquivo_path: string | null;
  data: any;
  created_at: string;
};
type Employee = { id: string; nome: string };
type Amendment = {
  id: string;
  contract_id: string;
  tipo: string;
  descricao: string;
  data_vigencia: string;
  novo_salario: number | null;
  nova_jornada: number | null;
  arquivo_path: string | null;
  created_at: string;
};

function statusBadge(status: string, dataFim: string | null) {
  const today = new Date().toISOString().slice(0,10);
  if (dataFim && dataFim < today && status !== "encerrado") {
    return <Badge variant="destructive">vencido</Badge>;
  }
  if (dataFim) {
    const d = (new Date(dataFim).getTime() - Date.now()) / 86400000;
    if (d <= 60 && d >= 0 && status === "ativo") return <Badge className="bg-amber-500">vence em {Math.ceil(d)}d</Badge>;
  }
  const variants: Record<string, any> = {
    ativo: "default",
    encerrado: "secondary",
    em_renovacao: "outline",
    vencido: "destructive",
    suspenso: "outline",
  };
  return <Badge variant={variants[status] ?? "default"}>{status}</Badge>;
}

export default function ContratosPage() {
  const { user } = useAuth();
  const { companyId, companies, isAdmin, selectCompany, ready } = useHrdpCompany();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [openSheet, setOpenSheet] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [tab, setTab] = useState("dados");

  async function load() {
    if (!companyId) return;
    setLoading(true);
    const [cRes, eRes] = await Promise.all([
      sb.from("hrdp_contracts").select("*").eq("company_id", companyId).eq("is_deleted", false).order("created_at",{ascending:false}),
      sb.from("hrdp_employees").select("id,nome").eq("company_id", companyId).eq("is_deleted", false).order("nome"),
    ]);
    setContracts(cRes.data ?? []);
    setEmployees(eRes.data ?? []);
    setLoading(false);
  }
  useEffect(() => { if (ready) load(); }, [ready, companyId]);

  async function loadAmendments(cid: string) {
    const { data } = await sb.from("hrdp_contract_amendments").select("*").eq("contract_id", cid).order("data_vigencia",{ascending:false});
    setAmendments(data ?? []);
  }

  function openNew() {
    if (!companyId) { toast.error("Selecione uma empresa"); return; }
    setEditing({
      id: "", company_id: companyId, employee_id: employees[0]?.id ?? "",
      tipo: "CLT", modelo: null, numero: null,
      data_inicio: new Date().toISOString().slice(0,10), data_fim: null,
      experiencia_dias: 90, data_fim_experiencia: null,
      jornada_horas: 220, salario: null, status: "ativo",
      observacoes: null, arquivo_path: null, data: {}, created_at: ""
    } as Contract);
    setAmendments([]);
    setTab("dados");
    setOpenSheet(true);
  }

  async function openEdit(c: Contract) {
    setEditing({ ...c });
    await loadAmendments(c.id);
    setTab("dados");
    setOpenSheet(true);
  }

  async function save() {
    if (!editing || !companyId) return;
    if (!editing.employee_id) { toast.error("Selecione o colaborador"); return; }
    const payload: any = { ...editing, company_id: companyId };
    if (!payload.id) {
      delete payload.id; delete payload.created_at;
      payload.created_by = user?.id;
      const { data, error } = await sb.from("hrdp_contracts").insert(payload).select().single();
      if (error) { toast.error(error.message); return; }
      toast.success("Contrato criado");
      setEditing(data);
    } else {
      const { error } = await sb.from("hrdp_contracts").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Contrato atualizado");
    }
    load();
  }

  async function uploadFile(file: File, target: "contract" | "amendment", refId: string) {
    if (!companyId) return null;
    const path = `${companyId}/contracts/${refId}/${Date.now()}_${file.name}`;
    const { error } = await sb.storage.from("hrdp-private").upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); return null; }
    return path;
  }

  async function downloadFile(path: string) {
    const { data, error } = await sb.storage.from("hrdp-private").createSignedUrl(path, 60);
    if (error) { toast.error(error.message); return; }
    window.open(data.signedUrl, "_blank");
  }

  async function softDelete(c: Contract) {
    if (!confirm(`Encerrar/excluir o contrato de ${employees.find(e=>e.id===c.employee_id)?.nome}?`)) return;
    const { error } = await sb.from("hrdp_contracts").update({
      is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: user?.id, delete_reason: "ui:ContratosPage"
    }).eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Contrato removido");
    load();
  }

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      const emp = employees.find(e => e.id === c.employee_id);
      const haystack = `${emp?.nome ?? ""} ${c.numero ?? ""} ${c.tipo}`.toLowerCase();
      if (filter && !haystack.includes(filter.toLowerCase())) return false;
      if (statusFilter !== "todos" && c.status !== statusFilter) return false;
      return true;
    });
  }, [contracts, employees, filter, statusFilter]);

  const today = new Date().toISOString().slice(0,10);
  const kpis = useMemo(() => {
    const ativos = contracts.filter(c => c.status === "ativo").length;
    const vencendo = contracts.filter(c => c.data_fim && c.data_fim >= today &&
      (new Date(c.data_fim).getTime() - Date.now())/86400000 <= 60 && c.status === "ativo").length;
    const vencidos = contracts.filter(c => c.data_fim && c.data_fim < today && c.status !== "encerrado").length;
    return { total: contracts.length, ativos, vencendo, vencidos };
  }, [contracts]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileSignature className="w-6 h-6 text-primary" /> Contratos
          </h1>
          <p className="text-sm text-muted-foreground">Gestão de contratos, aditivos e renovações.</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Select value={companyId ?? ""} onValueChange={selectCompany}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Empresa" /></SelectTrigger>
              <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Novo contrato</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total</div><div className="text-2xl font-bold">{kpis.total}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Ativos</div><div className="text-2xl font-bold text-primary">{kpis.ativos}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Vencendo (60d)</div><div className="text-2xl font-bold text-amber-500">{kpis.vencendo}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Vencidos</div><div className="text-2xl font-bold text-destructive">{kpis.vencidos}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base">Lista</CardTitle>
          <div className="flex gap-2">
            <Input placeholder="Buscar..." value={filter} onChange={(e)=>setFilter(e.target.value)} className="w-56" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground py-6 text-center">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">Nenhum contrato encontrado.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => {
                  const emp = employees.find(e => e.id === c.employee_id);
                  return (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => openEdit(c)}>
                      <TableCell className="font-medium">{emp?.nome ?? "—"}</TableCell>
                      <TableCell>{c.tipo}</TableCell>
                      <TableCell>{c.numero ?? "—"}</TableCell>
                      <TableCell>{c.data_inicio}</TableCell>
                      <TableCell>{c.data_fim ?? "indeterminado"}</TableCell>
                      <TableCell>{statusBadge(c.status, c.data_fim)}</TableCell>
                      <TableCell onClick={(e)=>e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => softDelete(c)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing?.id ? "Editar contrato" : "Novo contrato"}</SheetTitle>
          </SheetHeader>
          {editing && (
            <Tabs value={tab} onValueChange={setTab} className="mt-4">
              <TabsList>
                <TabsTrigger value="dados">Dados</TabsTrigger>
                <TabsTrigger value="arquivo">Arquivo</TabsTrigger>
                <TabsTrigger value="aditivos" disabled={!editing.id}>Aditivos {editing.id ? `(${amendments.length})` : ""}</TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="space-y-3 mt-4">
                <div>
                  <Label>Colaborador *</Label>
                  <Select value={editing.employee_id} onValueChange={(v)=>setEditing({...editing, employee_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Tipo *</Label>
                    <Select value={editing.tipo} onValueChange={(v)=>setEditing({...editing, tipo: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Número</Label>
                    <Input value={editing.numero ?? ""} onChange={(e)=>setEditing({...editing, numero: e.target.value})} />
                  </div>
                  <div>
                    <Label>Modelo</Label>
                    <Input value={editing.modelo ?? ""} onChange={(e)=>setEditing({...editing, modelo: e.target.value})} placeholder="Ex: Padrão CLT 2026" />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={editing.status} onValueChange={(v)=>setEditing({...editing, status: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Data início *</Label>
                    <Input type="date" value={editing.data_inicio ?? ""} onChange={(e)=>setEditing({...editing, data_inicio: e.target.value})} />
                  </div>
                  <div>
                    <Label>Data fim (vazio = indeterminado)</Label>
                    <Input type="date" value={editing.data_fim ?? ""} onChange={(e)=>setEditing({...editing, data_fim: e.target.value || null})} />
                  </div>
                  <div>
                    <Label>Experiência (dias)</Label>
                    <Input type="number" value={editing.experiencia_dias ?? ""} onChange={(e)=>setEditing({...editing, experiencia_dias: e.target.value ? Number(e.target.value) : null})} />
                  </div>
                  <div>
                    <Label>Fim experiência</Label>
                    <Input type="date" value={editing.data_fim_experiencia ?? ""} onChange={(e)=>setEditing({...editing, data_fim_experiencia: e.target.value || null})} />
                  </div>
                  <div>
                    <Label>Jornada (h/mês)</Label>
                    <Input type="number" value={editing.jornada_horas ?? ""} onChange={(e)=>setEditing({...editing, jornada_horas: e.target.value ? Number(e.target.value) : null})} />
                  </div>
                  <div>
                    <Label>Salário</Label>
                    <Input type="number" step="0.01" value={editing.salario ?? ""} onChange={(e)=>setEditing({...editing, salario: e.target.value ? Number(e.target.value) : null})} />
                    {editing.salario != null && <div className="text-[11px] text-muted-foreground mt-1">{maskMoney(editing.salario)}</div>}
                  </div>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea rows={3} value={editing.observacoes ?? ""} onChange={(e)=>setEditing({...editing, observacoes: e.target.value})} />
                </div>
                {editing.data_fim && new Date(editing.data_fim) < new Date(today) && (
                  <div className="flex items-center gap-2 text-xs text-destructive">
                    <AlertTriangle className="w-4 h-4" /> Contrato com data fim no passado. Considere encerrar ou criar aditivo de prorrogação.
                  </div>
                )}
                <div className="text-[11px] text-muted-foreground border rounded p-2">
                  Cálculos referenciais. Convenção coletiva pode alterar regras de experiência, jornada e prazos.
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={()=>setOpenSheet(false)}>Cancelar</Button>
                  <Button onClick={save}>Salvar</Button>
                </div>
              </TabsContent>

              <TabsContent value="arquivo" className="space-y-3 mt-4">
                {!editing.id ? (
                  <div className="text-sm text-muted-foreground">Salve o contrato antes de anexar o arquivo.</div>
                ) : (
                  <>
                    {editing.arquivo_path ? (
                      <div className="flex items-center justify-between border rounded p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4" /> {editing.arquivo_path.split("/").pop()}
                        </div>
                        <Button size="sm" variant="outline" onClick={()=>downloadFile(editing.arquivo_path!)}>
                          <Download className="w-4 h-4 mr-1" /> Baixar
                        </Button>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Nenhum arquivo anexado.</div>
                    )}
                    <Label className="cursor-pointer inline-flex items-center gap-2 border rounded px-3 py-2 hover:bg-muted">
                      <Upload className="w-4 h-4" /> Enviar arquivo (.pdf, .docx)
                      <input type="file" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg"
                        onChange={async (e) => {
                          const f = e.target.files?.[0]; if (!f) return;
                          const path = await uploadFile(f, "contract", editing.id);
                          if (path) {
                            const { error } = await sb.from("hrdp_contracts").update({ arquivo_path: path }).eq("id", editing.id);
                            if (error) { toast.error(error.message); return; }
                            setEditing({ ...editing, arquivo_path: path });
                            toast.success("Arquivo anexado");
                          }
                        }}
                      />
                    </Label>
                  </>
                )}
              </TabsContent>

              <TabsContent value="aditivos" className="space-y-3 mt-4">
                <NewAmendmentBlock
                  contractId={editing.id}
                  companyId={editing.company_id}
                  userId={user?.id}
                  onSaved={() => loadAmendments(editing.id)}
                  uploadFile={(f, id) => uploadFile(f, "amendment", id)}
                />
                {amendments.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhum aditivo registrado.</div>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Tipo</TableHead><TableHead>Vigência</TableHead>
                      <TableHead>Descrição</TableHead><TableHead>Arquivo</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {amendments.map(a => (
                        <TableRow key={a.id}>
                          <TableCell><Badge variant="outline">{a.tipo}</Badge></TableCell>
                          <TableCell>{a.data_vigencia}</TableCell>
                          <TableCell className="max-w-xs truncate">{a.descricao}</TableCell>
                          <TableCell>
                            {a.arquivo_path && (
                              <Button size="sm" variant="ghost" onClick={()=>downloadFile(a.arquivo_path!)}>
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function NewAmendmentBlock({
  contractId, companyId, userId, onSaved, uploadFile
}: {
  contractId: string; companyId: string; userId?: string;
  onSaved: () => void;
  uploadFile: (f: File, refId: string) => Promise<string | null>;
}) {
  const [tipo, setTipo] = useState("prorrogacao");
  const [vig, setVig] = useState(new Date().toISOString().slice(0,10));
  const [desc, setDesc] = useState("");
  const [novoSalario, setNovoSalario] = useState<string>("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!desc.trim()) { toast.error("Descreva o aditivo"); return; }
    setSaving(true);
    let arquivo_path: string | null = null;
    if (arquivo) arquivo_path = await uploadFile(arquivo, contractId);
    const payload: any = {
      company_id: companyId, contract_id: contractId,
      tipo, descricao: desc, data_vigencia: vig,
      novo_salario: novoSalario ? Number(novoSalario) : null,
      arquivo_path, created_by: userId,
    };
    const { error } = await sb.from("hrdp_contract_amendments").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Aditivo adicionado");
    setDesc(""); setNovoSalario(""); setArquivo(null);
    onSaved();
  }

  return (
    <div className="border rounded p-3 space-y-2 bg-muted/20">
      <div className="text-xs font-semibold text-muted-foreground">NOVO ADITIVO</div>
      <div className="grid grid-cols-2 gap-2">
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {["prorrogacao","alteracao_salarial","jornada","funcao","encerramento","outro"].map(t =>
              <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" value={vig} onChange={(e)=>setVig(e.target.value)} />
      </div>
      <Textarea rows={2} placeholder="Descrição..." value={desc} onChange={(e)=>setDesc(e.target.value)} />
      {tipo === "alteracao_salarial" && (
        <Input type="number" step="0.01" placeholder="Novo salário" value={novoSalario} onChange={(e)=>setNovoSalario(e.target.value)} />
      )}
      <div className="flex items-center gap-2 justify-between flex-wrap">
        <Label className="cursor-pointer inline-flex items-center gap-2 text-xs border rounded px-2 py-1 hover:bg-muted">
          <Upload className="w-3 h-3" /> {arquivo ? arquivo.name : "Anexar arquivo"}
          <input type="file" className="hidden" onChange={(e)=>setArquivo(e.target.files?.[0] ?? null)} />
        </Label>
        <Button size="sm" onClick={add} disabled={saving}>Adicionar aditivo</Button>
      </div>
    </div>
  );
}
