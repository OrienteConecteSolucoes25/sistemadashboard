import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MessageCircle, Trash2, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import { ESCOPOS_ENGENHARIA } from "../lib/constants";
import { EngPageHeader } from "./components/EngPageHeader";
import { DeleteWithPasswordModal } from "@/components/DeleteWithPasswordModal";
import { DataActionsToolbar } from "@/components/DataActionsToolbar";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { useEngDemoMode } from "../demo/useEngDemoMode";
import { getDemoTable } from "../demo/engDemoTables";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import type { FieldSchema } from "./crud/types";

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR",
  "PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const STATUS = ["ativa", "alocada", "em_servico", "em_deslocamento", "pausa", "offline", "inativa"];

interface Tech { nome: string; telefone?: string; }
interface Fornecedor {
  id: string;
  nome: string;
  cnpj?: string | null;
  lider?: string | null;
  leader_phone?: string | null;
  scopes: string[] | null;
  technicians: Tech[];
  status: string;
  current_city?: string | null;
  current_site?: string | null;
  base?: string | null;
  uf_base?: string | null;
  estados_atuacao?: string[] | null;
  quantidade_equipes?: number | null;
}

type FormState = {
  nome: string; cnpj: string; lider: string; leader_phone: string;
  scopes: string[]; technicians: Tech[];
  base: string; uf_base: string; estados_atuacao: string[]; quantidade_equipes: number;
};

const emptyForm = (): FormState => ({
  nome: "", cnpj: "", lider: "", leader_phone: "", scopes: [], technicians: [],
  base: "", uf_base: "", estados_atuacao: [], quantidade_equipes: 1,
});

function sendWhats(phone: string, text: string) {
  const clean = phone.replace(/\D/g, "");
  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad/i.test(navigator.userAgent);
  const url = isMobile
    ? `https://api.whatsapp.com/send?phone=55${clean}&text=${encodeURIComponent(text)}`
    : `https://web.whatsapp.com/send?phone=55${clean}&text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

const FIELDS: FieldSchema[] = [
  { key: "nome", label: "Nome", type: "text", required: true },
  { key: "cnpj", label: "CNPJ", type: "text" },
  { key: "lider", label: "Líder", type: "text" },
  { key: "leader_phone", label: "Telefone Líder", type: "text" },
  { key: "base", label: "Base", type: "text" },
  { key: "uf_base", label: "UF Base", type: "select", options: UFS },
  { key: "quantidade_equipes", label: "Quantidade Equipes", type: "number" },
  { key: "status", label: "Status", type: "select", options: STATUS },
];

export const FornecedoresPage = () => {
  const { enabled: isDemo } = useEngDemoMode();
  const [items, setItems] = useState<Fornecedor[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [openDetailId, setOpenDetailId] = useState<string | null>(null);
  const [delOpen, setDelOpen] = useState(false);
  const [demandText, setDemandText] = useState("");
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm());

  const load = async () => {
    if (isDemo) {
      setItems((getDemoTable("eng_equipes") ?? []) as any);
      return;
    }
    const { data } = await supabase
      .from("eng_equipes")
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });
    setItems(((data ?? []) as any[]).map((t) => ({
      ...t,
      technicians: Array.isArray(t.technicians) ? t.technicians as Tech[] : (Array.isArray(t.membros) ? (t.membros as any[]).map((m: any) => ({ nome: m.nome, telefone: m.funcao })) : []),
      scopes: Array.isArray(t.scopes) ? t.scopes : [],
      estados_atuacao: Array.isArray(t.estados_atuacao) ? t.estados_atuacao : [],
    })) as Fornecedor[]);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [isDemo]);

  const editing = items.find((t) => t.id === openDetailId);

  const filtered = useMemo(() => items.filter((t) => {
    if (!busca.trim()) return true;
    const q = busca.toLowerCase();
    const hay = [t.nome, t.cnpj, t.lider, t.leader_phone, t.base, t.uf_base,
      (t.scopes ?? []).join(" "), (t.estados_atuacao ?? []).join(" "),
      t.technicians.map((x) => x.nome + " " + (x.telefone ?? "")).join(" "),
    ].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q);
  }), [items, busca]);

  const sel = useBulkSelection(filtered);

  const openNew = () => { setForm(emptyForm()); setEditId(null); setOpenForm(true); };
  const openEdit = (t: Fornecedor) => {
    setForm({
      nome: t.nome, cnpj: t.cnpj ?? "", lider: t.lider ?? "", leader_phone: t.leader_phone ?? "",
      scopes: t.scopes ?? [], technicians: t.technicians,
      base: t.base ?? "", uf_base: t.uf_base ?? "",
      estados_atuacao: t.estados_atuacao ?? [],
      quantidade_equipes: t.quantidade_equipes ?? 1,
    });
    setEditId(t.id); setOpenForm(true);
  };

  const save = async () => {
    if (!form.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    const payload = {
      nome: form.nome.trim(), cnpj: form.cnpj || null,
      lider: form.lider || null, leader_phone: form.leader_phone || null,
      scopes: form.scopes, technicians: form.technicians as any,
      base: form.base || null, uf_base: form.uf_base || null,
      estados_atuacao: form.estados_atuacao,
      quantidade_equipes: form.quantidade_equipes || 1,
    };
    if (editId) {
      const { error } = await supabase.from("eng_equipes").update(payload as any).eq("id", editId);
      if (error) { toast.error(error.message); return; }
      toast.success("Fornecedor atualizado");
    } else {
      const { error } = await supabase.from("eng_equipes").insert(payload as any);
      if (error) { toast.error(error.message); return; }
      toast.success("Fornecedor criado");
    }
    setOpenForm(false); setEditId(null);
    load();
  };

  const updateField = async (id: string, patch: Record<string, unknown>) => {
    const { error } = await supabase.from("eng_equipes").update(patch as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const createDemand = async () => {
    if (!editing || !demandText.trim()) return;
    const { error } = await supabase.from("eng_demandas").insert({
      titulo: demandText.slice(0, 80),
      descricao: demandText,
      responsavel: editing.nome,
    } as any);
    if (error) return toast.error(error.message);
    toast.success("Demanda criada");
    if (editing.leader_phone) sendWhats(editing.leader_phone, `Nova demanda — ${editing.nome}\n\n${demandText}`);
    setDemandText("");
  };

  return (
    <div className="space-y-4">
      <EngPageHeader
        title="Fornecedores"
        description="Empresas parceiras (fornecedores), técnicos e demandas"
        actions={
          <div className="flex gap-2">
            <DataActionsToolbar table="eng_equipes" title="Fornecedores" fields={FIELDS} rows={items} onImported={load} />
            <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo fornecedor</Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 w-72" placeholder="Buscar fornecedor, líder, técnico, base…"
            value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
      </div>

      <BulkActionsBar
        count={sel.count}
        onClear={sel.clear}
        onDelete={() => setDelOpen(true)}
        deleteLabel={`Excluir ${sel.count} selecionado(s)`}
      />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={sel.allChecked ? true : sel.someChecked ? "indeterminate" : false}
                    onCheckedChange={() => sel.toggleAll()}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Base</TableHead>
                <TableHead>UF</TableHead>
                <TableHead>Estados</TableHead>
                <TableHead>Eqs</TableHead>
                <TableHead>Líder</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0
                ? <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Nenhum fornecedor.</TableCell></TableRow>
                : filtered.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer" onClick={() => setOpenDetailId(t.id)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={sel.isSelected(t.id)}
                        onCheckedChange={() => sel.toggle(t.id)}
                        aria-label={`Selecionar ${t.nome}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{t.nome}</TableCell>
                    <TableCell>{t.base ?? "—"}</TableCell>
                    <TableCell>{t.uf_base ?? "—"}</TableCell>
                    <TableCell className="text-xs">{(t.estados_atuacao ?? []).join(", ") || "—"}</TableCell>
                    <TableCell>{t.quantidade_equipes ?? 1}</TableCell>
                    <TableCell>{t.lider ?? "—"}</TableCell>
                    <TableCell>{t.leader_phone ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{t.status}</Badge></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { sel.toggle(t.id); setDelOpen(true); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form criar/editar */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div><Label>CNPJ</Label><Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} /></div>
            <div><Label>Base (cidade)</Label><Input value={form.base} onChange={(e) => setForm({ ...form, base: e.target.value })} /></div>
            <div>
              <Label>UF da base</Label>
              <Select value={form.uf_base} onValueChange={(v) => setForm({ ...form, uf_base: v })}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>{UFS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantidade de equipes</Label>
              <Input type="number" min={1} value={form.quantidade_equipes}
                onChange={(e) => setForm({ ...form, quantidade_equipes: Number(e.target.value) || 1 })} />
            </div>
            <div><Label>Nome do líder</Label><Input value={form.lider} onChange={(e) => setForm({ ...form, lider: e.target.value })} /></div>
            <div><Label>Telefone do líder</Label><Input value={form.leader_phone} onChange={(e) => setForm({ ...form, leader_phone: e.target.value })} /></div>

            <div className="md:col-span-2">
              <Label>Estados de atuação</Label>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 border rounded">
                {UFS.map((u) => {
                  const isSel = form.estados_atuacao.includes(u);
                  return (
                    <button type="button" key={u}
                      onClick={() => setForm((f) => ({ ...f, estados_atuacao: isSel ? f.estados_atuacao.filter((x) => x !== u) : [...f.estados_atuacao, u] }))}
                      className={`text-xs px-2 py-0.5 rounded ${isSel ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                      {u}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Escopos</Label>
              <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto p-2 border rounded">
                {ESCOPOS_ENGENHARIA.map((s) => {
                  const isSel = form.scopes.includes(s);
                  return (
                    <button type="button" key={s}
                      onClick={() => setForm((f) => ({ ...f, scopes: isSel ? f.scopes.filter((x) => x !== s) : [...f.scopes, s] }))}
                      className={`text-xs px-2 py-0.5 rounded ${isSel ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Técnicos vinculados</Label>
                <Button type="button" variant="ghost" size="sm"
                  onClick={() => setForm((f) => ({ ...f, technicians: [...f.technicians, { nome: "", telefone: "" }] }))}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {form.technicians.map((t, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                    <Input placeholder="Nome" value={t.nome}
                      onChange={(e) => { const arr = [...form.technicians]; arr[i] = { ...arr[i], nome: e.target.value }; setForm({ ...form, technicians: arr }); }} />
                    <Input placeholder="Telefone" value={t.telefone ?? ""}
                      onChange={(e) => { const arr = [...form.technicians]; arr[i] = { ...arr[i], telefone: e.target.value }; setForm({ ...form, technicians: arr }); }} />
                    <Button size="icon" variant="ghost"
                      onClick={() => setForm((f) => ({ ...f, technicians: f.technicians.filter((_, idx) => idx !== i) }))}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detalhe lateral */}
      <Sheet open={!!openDetailId} onOpenChange={(v) => !v && setOpenDetailId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>{editing?.nome}</SheetTitle></SheetHeader>
          {editing && (
            <div className="space-y-4 mt-4">
              <div className="text-sm space-y-1">
                <div><span className="text-muted-foreground">CNPJ:</span> {editing.cnpj ?? "—"}</div>
                <div><span className="text-muted-foreground">Base:</span> {editing.base ?? "—"} / {editing.uf_base ?? "—"}</div>
                <div><span className="text-muted-foreground">Estados:</span> {(editing.estados_atuacao ?? []).join(", ") || "—"}</div>
                <div><span className="text-muted-foreground">Equipes:</span> {editing.quantidade_equipes ?? 1}</div>
                <div><span className="text-muted-foreground">Líder:</span> {editing.lider ?? "—"} {editing.leader_phone && `(${editing.leader_phone})`}</div>
                <div><span className="text-muted-foreground">Escopos:</span> {(editing.scopes ?? []).join(", ") || "—"}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Status</Label>
                  <Select value={editing.status} onValueChange={(v) => updateField(editing.id, { status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Cidade atual</Label><Input value={editing.current_city ?? ""} onChange={(e) => updateField(editing.id, { current_city: e.target.value })} /></div>
                <div className="col-span-2"><Label>Obra atual</Label><Input value={editing.current_site ?? ""} onChange={(e) => updateField(editing.id, { current_site: e.target.value })} /></div>
              </div>

              <div className="border-t pt-3 space-y-2">
                <Label className="text-sm font-semibold">Técnicos</Label>
                {editing.technicians.length === 0 && (
                  <div className="text-xs text-muted-foreground">Nenhum técnico cadastrado.</div>
                )}
                <div className="space-y-2">
                  {editing.technicians.map((t, i) => (
                    <div key={i} className="grid grid-cols-[1fr_auto] gap-2 items-center">
                      <div className="text-sm">
                        <div className="font-medium">{t.nome || "—"}</div>
                        <div className="text-xs text-muted-foreground">{t.telefone ?? "—"}</div>
                      </div>
                      <Button size="icon" variant="outline" disabled={!t.telefone}
                        title="Enviar WhatsApp"
                        onClick={() => t.telefone && sendWhats(t.telefone, demandText || `Olá ${t.nome}`)}>
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button size="sm" variant="outline" className="w-full" onClick={() => openEdit(editing)}>
                  <Pencil className="h-4 w-4 mr-1" /> Editar fornecedor
                </Button>
              </div>

              <div className="border-t pt-3 space-y-2">
                <Label className="text-sm font-semibold">Criar demanda</Label>
                <Textarea placeholder="Descreva a demanda…" value={demandText} onChange={(e) => setDemandText(e.target.value)} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={createDemand}>Salvar demanda</Button>
                  {editing.leader_phone && (
                    <Button size="sm" variant="outline" onClick={() => sendWhats(editing.leader_phone!, demandText)}>
                      <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp líder
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <DeleteWithPasswordModal
        open={delOpen}
        onOpenChange={(o) => { setDelOpen(o); if (!o) sel.clear(); }}
        table={"eng_equipes" as any}
        recordIds={Array.from(sel.selected)}
        moduleLabel="Fornecedores"
        onDeleted={() => { load(); sel.clear(); }}
      />
    </div>
  );
};

export default FornecedoresPage;
