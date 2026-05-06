import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Search, Eye, EyeOff, ShieldAlert, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useHrdpCompany } from "../hooks/useHrdpCompany";
import { fmtCpf, fmtMoney, maskCpf, maskMoney, maskBank } from "../lib/mask";

const sb: any = supabase;

type Employee = {
  id: string;
  company_id: string;
  user_id: string | null;
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  cargo: string | null;
  setor: string | null;
  vinculo: string;
  status: string;
  data_admissao: string | null;
  data_desligamento: string | null;
  salario: number | null;
  dados_bancarios: any;
  observacoes: string | null;
};

const VINCULOS = ["CLT","PJ","Estagiário","Terceirizado","Aprendiz"];
const STATUS = ["ativo","afastado","ferias","desligado"];

export default function ColaboradoresPage() {
  const { user } = useAuth();
  const { companyId, companyName, companies, isAdmin, selectCompany, ready } = useHrdpCompany();
  const [rows, setRows] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [statusF, setStatusF] = useState<string>("todos");
  const [editing, setEditing] = useState<Employee | null>(null);
  const [open, setOpen] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const [canSensitive, setCanSensitive] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (!companyId || !user) return;
    (async () => {
      const [{ data: vS }, { data: vE }] = await Promise.all([
        sb.rpc("hrdp_can", { _uid: user.id, _company: companyId, _submodule: "colaboradores", _action: "view_sensitive" }),
        sb.rpc("hrdp_can", { _uid: user.id, _company: companyId, _submodule: "colaboradores", _action: "edit" }),
      ]);
      setCanSensitive(!!vS);
      setCanEdit(!!vE);
    })();
  }, [companyId, user?.id]);

  async function reload() {
    if (!companyId) return;
    setLoading(true);
    const { data, error } = await sb
      .from("hrdp_employees")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_deleted", false)
      .order("nome");
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setRows(data ?? []);
  }
  useEffect(() => { reload(); }, [companyId]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return rows.filter(r =>
      (statusF === "todos" || r.status === statusF) &&
      (!q || [r.nome, r.email, r.cargo, r.setor].some(v => (v ?? "").toLowerCase().includes(q)))
    );
  }, [rows, filter, statusF]);

  function newOne() {
    if (!companyId) return;
    setEditing({
      id: "", company_id: companyId, user_id: null, nome: "", cpf: "", email: "", telefone: "",
      cargo: "", setor: "", vinculo: "CLT", status: "ativo", data_admissao: null,
      data_desligamento: null, salario: null, dados_bancarios: {}, observacoes: "",
    });
    setOpen(true);
  }

  async function save() {
    if (!editing) return;
    if (!editing.nome.trim()) { toast.error("Nome obrigatório"); return; }
    const payload: any = { ...editing };
    if (!payload.id) {
      delete payload.id;
      payload.created_by = user?.id ?? null;
      const { error } = await sb.from("hrdp_employees").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Colaborador criado");
    } else {
      const { id, ...rest } = payload;
      const { error } = await sb.from("hrdp_employees").update(rest).eq("id", id);
      if (error) { toast.error(error.message); return; }
      toast.success("Colaborador atualizado");
    }
    setOpen(false);
    reload();
  }

  const showS = canSensitive && showSensitive;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Colaboradores
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastro de pessoas vinculadas a {companyName ?? "—"}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && companies.length > 1 && (
            <Select value={companyId ?? ""} onValueChange={selectCompany}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Empresa" /></SelectTrigger>
              <SelectContent>
                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {canSensitive && (
            <Button variant="outline" size="sm" onClick={() => setShowSensitive(s => !s)}>
              {showS ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {showS ? "Ocultar sensíveis" : "Mostrar sensíveis"}
            </Button>
          )}
          {canEdit && (
            <Button size="sm" onClick={newOne}><Plus className="w-4 h-4 mr-1" /> Novo</Button>
          )}
        </div>
      </div>

      {!canSensitive && (
        <div className="flex items-start gap-2 p-3 rounded-md border border-amber-500/30 bg-amber-500/10 text-xs">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            CPF, salário e dados bancários estão mascarados (LGPD). Solicite a um admin RH a permissão{" "}
            <code className="text-[11px]">view_sensitive</code> em <em>Colaboradores</em>.
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">{filtered.length} colaborador(es)</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
              <Input className="pl-8 w-60" placeholder="Buscar nome, e-mail, cargo..." value={filter} onChange={e => setFilter(e.target.value)} />
            </div>
            <Select value={statusF} onValueChange={setStatusF}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Vínculo</TableHead>
                <TableHead>Admissão</TableHead>
                <TableHead>Salário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={9} className="text-center py-6 text-muted-foreground">Carregando...</TableCell></TableRow>}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center py-6 text-muted-foreground">Nenhum colaborador.</TableCell></TableRow>
              )}
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.nome}<div className="text-xs text-muted-foreground">{r.email ?? "—"}</div></TableCell>
                  <TableCell>{showS ? fmtCpf(r.cpf) : maskCpf(r.cpf)}</TableCell>
                  <TableCell>{r.cargo ?? "—"}</TableCell>
                  <TableCell>{r.setor ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline">{r.vinculo}</Badge></TableCell>
                  <TableCell>{r.data_admissao ?? "—"}</TableCell>
                  <TableCell>{showS ? fmtMoney(r.salario) : maskMoney(r.salario)}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "ativo" ? "default" : "secondary"}>{r.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {canEdit && (
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader><SheetTitle>{editing?.id ? "Editar colaborador" : "Novo colaborador"}</SheetTitle></SheetHeader>
          {editing && (
            <div className="space-y-3 mt-4">
              <Field label="Nome *"><Input value={editing.nome} onChange={e => setEditing({ ...editing, nome: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CPF"><Input value={editing.cpf ?? ""} onChange={e => setEditing({ ...editing, cpf: e.target.value })} /></Field>
                <Field label="E-mail"><Input value={editing.email ?? ""} onChange={e => setEditing({ ...editing, email: e.target.value })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Telefone"><Input value={editing.telefone ?? ""} onChange={e => setEditing({ ...editing, telefone: e.target.value })} /></Field>
                <Field label="Vínculo">
                  <Select value={editing.vinculo} onValueChange={v => setEditing({ ...editing, vinculo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{VINCULOS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cargo"><Input value={editing.cargo ?? ""} onChange={e => setEditing({ ...editing, cargo: e.target.value })} /></Field>
                <Field label="Setor"><Input value={editing.setor ?? ""} onChange={e => setEditing({ ...editing, setor: e.target.value })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Admissão"><Input type="date" value={editing.data_admissao ?? ""} onChange={e => setEditing({ ...editing, data_admissao: e.target.value || null })} /></Field>
                <Field label="Desligamento"><Input type="date" value={editing.data_desligamento ?? ""} onChange={e => setEditing({ ...editing, data_desligamento: e.target.value || null })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Status">
                  <Select value={editing.status} onValueChange={v => setEditing({ ...editing, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                {canSensitive && (
                  <Field label="Salário (R$)">
                    <Input type="number" step="0.01" value={editing.salario ?? ""} onChange={e => setEditing({ ...editing, salario: e.target.value ? Number(e.target.value) : null })} />
                  </Field>
                )}
              </div>
              <Field label="Observações">
                <textarea
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editing.observacoes ?? ""}
                  onChange={e => setEditing({ ...editing, observacoes: e.target.value })}
                />
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save}>Salvar</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
