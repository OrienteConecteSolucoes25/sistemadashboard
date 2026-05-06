import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList, Plus, Upload, FileText, Trash2, Download, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useHrdpCompany } from "../hooks/useHrdpCompany";

const sb: any = supabase;

const ETAPAS = [
  { key: "documentacao", label: "Documentação" },
  { key: "exame_admissional", label: "Exame admissional" },
  { key: "contrato", label: "Contrato" },
  { key: "ferramentas", label: "Ferramentas/Acessos" },
  { key: "integracao", label: "Integração" },
  { key: "concluida", label: "Concluída" },
];

const DEFAULT_CHECKLIST = [
  { categoria: "documentacao", titulo: "RG / CNH", obrigatorio: true },
  { categoria: "documentacao", titulo: "CPF", obrigatorio: true },
  { categoria: "documentacao", titulo: "Comprovante de residência", obrigatorio: true },
  { categoria: "documentacao", titulo: "Carteira de trabalho", obrigatorio: true },
  { categoria: "documentacao", titulo: "Título de eleitor", obrigatorio: false },
  { categoria: "documentacao", titulo: "Certificado de reservista", obrigatorio: false },
  { categoria: "documentacao", titulo: "Foto 3x4", obrigatorio: false },
  { categoria: "exame_admissional", titulo: "Exame admissional (ASO)", obrigatorio: true },
  { categoria: "contrato", titulo: "Contrato assinado", obrigatorio: true },
  { categoria: "contrato", titulo: "Termo de confidencialidade", obrigatorio: false },
  { categoria: "ferramentas", titulo: "E-mail corporativo criado", obrigatorio: true },
  { categoria: "ferramentas", titulo: "Acessos a sistemas liberados", obrigatorio: true },
  { categoria: "integracao", titulo: "Integração com gestor direto", obrigatorio: true },
];

type Admission = {
  id: string;
  company_id: string;
  employee_id: string | null;
  candidato_nome: string | null;
  candidato_email: string | null;
  cargo: string | null;
  setor: string | null;
  data_inicio_prevista: string | null;
  data_admissao_efetiva: string | null;
  etapa: string;
  status: string;
  observacoes: string | null;
};
type Employee = { id: string; nome: string };

export default function AdmissaoPage() {
  const { user } = useAuth();
  const { companyId, companyName, companies, isAdmin, selectCompany } = useHrdpCompany();
  const [rows, setRows] = useState<Admission[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Admission | null>(null);
  const [open, setOpen] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (!companyId || !user) return;
    sb.rpc("hrdp_can", { _uid: user.id, _company: companyId, _submodule: "admissao", _action: "edit" })
      .then(({ data }: any) => setCanEdit(!!data));
  }, [companyId, user?.id]);

  async function reload() {
    if (!companyId) return;
    setLoading(true);
    const [a, e] = await Promise.all([
      sb.from("hrdp_admissions").select("*").eq("company_id", companyId).eq("is_deleted", false).order("created_at", { ascending: false }),
      sb.from("hrdp_employees").select("id, nome").eq("company_id", companyId).eq("is_deleted", false).order("nome"),
    ]);
    setLoading(false);
    if (a.error) toast.error(a.error.message);
    setRows(a.data ?? []);
    setEmployees(e.data ?? []);
  }
  useEffect(() => { reload(); }, [companyId]);

  function novo() {
    if (!companyId) return;
    setEditing({
      id: "", company_id: companyId, employee_id: null, candidato_nome: "", candidato_email: "",
      cargo: "", setor: "", data_inicio_prevista: null, data_admissao_efetiva: null,
      etapa: "documentacao", status: "em_andamento", observacoes: "",
    });
    setOpen(true);
  }

  async function save(): Promise<string | null> {
    if (!editing) return null;
    if (!editing.candidato_nome?.trim() && !editing.employee_id) {
      toast.error("Informe o candidato ou colaborador"); return null;
    }
    if (!editing.id) {
      const { id: _i, ...rest } = editing;
      const payload = { ...rest, created_by: user?.id ?? null };
      const { data, error } = await sb.from("hrdp_admissions").insert(payload).select("id").single();
      if (error) { toast.error(error.message); return null; }
      // popula checklist padrão
      const items = DEFAULT_CHECKLIST.map((it, i) => ({
        admission_id: data.id, company_id: editing.company_id,
        categoria: it.categoria, titulo: it.titulo, obrigatorio: it.obrigatorio, ordem: i,
      }));
      await sb.from("hrdp_admission_checklist_items").insert(items);
      toast.success("Admissão criada");
      reload();
      return data.id;
    } else {
      const { id, ...rest } = editing;
      const { error } = await sb.from("hrdp_admissions").update(rest).eq("id", id);
      if (error) { toast.error(error.message); return null; }
      toast.success("Atualizado");
      reload();
      return id;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" /> Admissão & Documentos
          </h1>
          <p className="text-sm text-muted-foreground">Onboarding com checklist e upload privado · {companyName ?? "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && companies.length > 1 && (
            <Select value={companyId ?? ""} onValueChange={selectCompany}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
          )}
          {canEdit && <Button size="sm" onClick={novo}><Plus className="w-4 h-4 mr-1" /> Nova admissão</Button>}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{rows.length} processo(s)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidato/Colaborador</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Início previsto</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Carregando...</TableCell></TableRow>}
              {!loading && rows.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Nenhuma admissão.</TableCell></TableRow>}
              {rows.map(r => {
                const empNome = employees.find(e => e.id === r.employee_id)?.nome;
                return (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => { setEditing(r); setOpen(true); }}>
                    <TableCell className="font-medium">{r.candidato_nome || empNome || "—"}<div className="text-xs text-muted-foreground">{r.candidato_email}</div></TableCell>
                    <TableCell>{r.cargo ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{ETAPAS.find(e => e.key === r.etapa)?.label ?? r.etapa}</Badge></TableCell>
                    <TableCell>{r.data_inicio_prevista ?? "—"}</TableCell>
                    <TableCell><Badge variant={r.status === "concluida" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader><SheetTitle>{editing?.id ? "Processo de admissão" : "Nova admissão"}</SheetTitle></SheetHeader>
          {editing && (
            <AdmissionEditor
              admission={editing}
              setAdmission={setEditing}
              employees={employees}
              canEdit={canEdit}
              onSave={save}
              companyId={editing.company_id}
              userId={user?.id}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function AdmissionEditor({
  admission, setAdmission, employees, canEdit, onSave, companyId, userId,
}: {
  admission: Admission;
  setAdmission: (a: Admission) => void;
  employees: Employee[];
  canEdit: boolean;
  onSave: () => Promise<string | null>;
  companyId: string;
  userId: string | undefined;
}) {
  return (
    <Tabs defaultValue="dados" className="mt-4">
      <TabsList>
        <TabsTrigger value="dados">Dados</TabsTrigger>
        <TabsTrigger value="checklist" disabled={!admission.id}>Checklist</TabsTrigger>
        <TabsTrigger value="docs" disabled={!admission.id}>Documentos</TabsTrigger>
      </TabsList>

      <TabsContent value="dados" className="space-y-3 pt-3">
        <div className="space-y-1">
          <Label className="text-xs">Vincular a colaborador existente (opcional)</Label>
          <Select value={admission.employee_id ?? "none"} onValueChange={v => setAdmission({ ...admission, employee_id: v === "none" ? null : v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— novo candidato —</SelectItem>
              {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome do candidato"><Input value={admission.candidato_nome ?? ""} onChange={e => setAdmission({ ...admission, candidato_nome: e.target.value })} /></Field>
          <Field label="E-mail"><Input value={admission.candidato_email ?? ""} onChange={e => setAdmission({ ...admission, candidato_email: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cargo"><Input value={admission.cargo ?? ""} onChange={e => setAdmission({ ...admission, cargo: e.target.value })} /></Field>
          <Field label="Setor"><Input value={admission.setor ?? ""} onChange={e => setAdmission({ ...admission, setor: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Início previsto"><Input type="date" value={admission.data_inicio_prevista ?? ""} onChange={e => setAdmission({ ...admission, data_inicio_prevista: e.target.value || null })} /></Field>
          <Field label="Admissão efetiva"><Input type="date" value={admission.data_admissao_efetiva ?? ""} onChange={e => setAdmission({ ...admission, data_admissao_efetiva: e.target.value || null })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Etapa">
            <Select value={admission.etapa} onValueChange={v => setAdmission({ ...admission, etapa: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ETAPAS.map(e => <SelectItem key={e.key} value={e.key}>{e.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={admission.status} onValueChange={v => setAdmission({ ...admission, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="pausada">Pausada</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Observações">
          <textarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={admission.observacoes ?? ""} onChange={e => setAdmission({ ...admission, observacoes: e.target.value })} />
        </Field>
        {canEdit && <div className="flex justify-end"><Button onClick={onSave}>Salvar</Button></div>}
      </TabsContent>

      <TabsContent value="checklist" className="pt-3">
        {admission.id && <ChecklistTab admissionId={admission.id} canEdit={canEdit} userId={userId} />}
      </TabsContent>

      <TabsContent value="docs" className="pt-3">
        {admission.id && (
          <DocumentsTab
            admissionId={admission.id}
            employeeId={admission.employee_id}
            companyId={companyId}
            canEdit={canEdit}
            userId={userId}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>;
}

function ChecklistTab({ admissionId, canEdit, userId }: { admissionId: string; canEdit: boolean; userId?: string }) {
  const [items, setItems] = useState<any[]>([]);
  async function load() {
    const { data } = await sb.from("hrdp_admission_checklist_items").select("*").eq("admission_id", admissionId).order("ordem");
    setItems(data ?? []);
  }
  useEffect(() => { load(); }, [admissionId]);

  async function toggle(it: any) {
    if (!canEdit) return;
    const next = !it.concluido;
    const { error } = await sb.from("hrdp_admission_checklist_items").update({
      concluido: next,
      concluido_em: next ? new Date().toISOString() : null,
      concluido_por: next ? userId : null,
    }).eq("id", it.id);
    if (error) { toast.error(error.message); return; }
    load();
  }

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    items.forEach(i => { (g[i.categoria] ??= []).push(i); });
    return g;
  }, [items]);

  const done = items.filter(i => i.concluido).length;

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">{done}/{items.length} concluídos</div>
      {Object.entries(grouped).map(([cat, list]) => (
        <Card key={cat}>
          <CardHeader className="py-3"><CardTitle className="text-sm capitalize">{cat.replace("_", " ")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {list.map(it => (
              <label key={it.id} className="flex items-start gap-2 text-sm cursor-pointer">
                <Checkbox checked={it.concluido} onCheckedChange={() => toggle(it)} disabled={!canEdit} />
                <div className="flex-1">
                  <div className={it.concluido ? "line-through text-muted-foreground" : ""}>
                    {it.titulo} {it.obrigatorio && <span className="text-destructive">*</span>}
                  </div>
                  {it.concluido_em && <div className="text-xs text-muted-foreground">Concluído em {new Date(it.concluido_em).toLocaleString("pt-BR")}</div>}
                </div>
              </label>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const TIPOS_DOC = ["RG","CPF","CNH","Comprovante residência","CTPS","Título eleitor","Reservista","ASO","Contrato","Foto","Outro"];

function DocumentsTab({
  admissionId, employeeId, companyId, canEdit, userId,
}: {
  admissionId: string;
  employeeId: string | null;
  companyId: string;
  canEdit: boolean;
  userId?: string;
}) {
  const [docs, setDocs] = useState<any[]>([]);
  const [tipo, setTipo] = useState("RG");
  const [titulo, setTitulo] = useState("");
  const [sensivel, setSensivel] = useState(true);
  const [vencimento, setVencimento] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  async function load() {
    const { data } = await sb.from("hrdp_employee_documents").select("*").eq("admission_id", admissionId).eq("is_deleted", false).order("created_at", { ascending: false });
    setDocs(data ?? []);
  }
  useEffect(() => { load(); }, [admissionId]);

  async function upload() {
    if (!file) { toast.error("Selecione um arquivo"); return; }
    if (!titulo.trim()) { toast.error("Título obrigatório"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${companyId}/${employeeId ?? "_admissao"}/${admissionId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await sb.storage.from("hrdp-private").upload(path, file, { upsert: false, contentType: file.type });
    if (upErr) { setUploading(false); toast.error(upErr.message); return; }
    const { error } = await sb.from("hrdp_employee_documents").insert({
      company_id: companyId, employee_id: employeeId, admission_id: admissionId,
      tipo, titulo, storage_path: path, mime_type: file.type, tamanho_bytes: file.size,
      data_vencimento: vencimento || null, sensivel, uploaded_by: userId,
    });
    setUploading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Documento enviado");
    setFile(null); setTitulo(""); setVencimento("");
    load();
  }

  async function download(d: any) {
    const { data, error } = await sb.storage.from("hrdp-private").createSignedUrl(d.storage_path, 60);
    if (error) { toast.error(error.message); return; }
    window.open(data.signedUrl, "_blank");
  }

  async function remove(d: any) {
    if (!confirm(`Excluir documento "${d.titulo}"?`)) return;
    await sb.storage.from("hrdp-private").remove([d.storage_path]);
    await sb.from("hrdp_employee_documents").update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: userId }).eq("id", d.id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-md border border-amber-500/30 bg-amber-500/10 text-xs">
        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>Bucket privado <code>hrdp-private</code>. Documentos sensíveis exigem permissão <code>view_sensitive</code> em Colaboradores.</div>
      </div>

      {canEdit && (
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">Enviar documento</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Tipo">
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS_DOC.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Título"><Input value={titulo} onChange={e => setTitulo(e.target.value)} /></Field>
            <Field label="Vencimento"><Input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} /></Field>
            <Field label="Arquivo"><Input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} /></Field>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <Checkbox checked={sensivel} onCheckedChange={(v) => setSensivel(!!v)} />
              Marcar como sensível (LGPD)
            </label>
            <div className="md:col-span-2 flex justify-end">
              <Button onClick={upload} disabled={uploading}><Upload className="w-4 h-4 mr-1" /> {uploading ? "Enviando..." : "Enviar"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">{docs.length} documento(s)</CardTitle></CardHeader>
        <CardContent>
          {docs.length === 0 && <div className="text-sm text-muted-foreground">Nenhum documento enviado.</div>}
          <div className="space-y-2">
            {docs.map(d => (
              <div key={d.id} className="flex items-center gap-3 p-2 border rounded-md text-sm">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{d.titulo}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.tipo} · {d.sensivel && <Badge variant="destructive" className="text-[10px] mr-1">sensível</Badge>}
                    {d.data_vencimento ? `vence ${d.data_vencimento}` : ""}
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => download(d)}><Download className="w-4 h-4" /></Button>
                {canEdit && <Button size="icon" variant="ghost" onClick={() => remove(d)}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
