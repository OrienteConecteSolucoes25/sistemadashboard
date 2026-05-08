// Páginas premium "Deluxe" do módulo Engenharia.
// - SitesDeluxe: dashboard de sites com distribuição por UF + status, mini-mapa textual.
// - EquipesDeluxe: equipes com gestão de membros (jsonb).
// - MateriaisDeluxe: catálogo + KPIs financeiros por categoria.
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  MapPin, Plus, Trash2, Users, Boxes, Search, AlertTriangle, CheckCircle2,
  CalendarClock, Wrench, UserPlus, X, TrendingUp, PackageX, Pencil,
} from "lucide-react";
import { fireAudit } from "../lib/audit";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { EngPageHeader } from "./components/EngPageHeader";
import { KpiCard, KpiGrid } from "./components/KpiCard";
import { StatusBadge } from "./components/StatusBadge";
import { useMateriais } from "../hooks/useMateriais";
import { useFieldOptions } from "../hooks/useFieldOptions";
import { MateriaisCatalogToolbar } from "./MateriaisCatalogToolbar";
import { makeEditKeyHandler } from "../lib/keyboardEdit";

const TEAL = "hsl(181 65% 46%)";
const WARN = "hsl(41 100% 47%)";
const DANGER = "hsl(0 70% 60%)";
const SUCCESS = "hsl(158 64% 42%)";
const NEUTRAL = "hsl(217 10% 55%)";
const PIE = [TEAL, WARN, DANGER, SUCCESS, NEUTRAL, "hsl(260 60% 60%)", "hsl(200 70% 55%)"];

/* ============================================================ */
/*  SITES DELUXE                                                */
/* ============================================================ */

interface Site {
  id: string;
  codigo: string | null;
  nome: string;
  cidade: string | null;
  uf: string | null;
  status: string | null;
  responsavel: string | null;
  latitude: number | null;
  longitude: number | null;
}

const STATUS_SITE = ["em_aprovacao", "ativo", "concluido", "pausado"];

export const SitesDeluxePage = () => {
  const [items, setItems] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [ufFilter, setUfFilter] = useState<string>("__all__");
  const [statusFilter, setStatusFilter] = useState<string>("__all__");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Site> | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("eng_sites").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as Site[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const ufs = useMemo(() => {
    const m = new Map<string, number>();
    items.forEach((s) => { if (s.uf) m.set(s.uf, (m.get(s.uf) ?? 0) + 1); });
    return Array.from(m.entries()).map(([uf, count]) => ({ uf, count })).sort((a, b) => b.count - a.count);
  }, [items]);

  const statusDist = useMemo(() => {
    const m = new Map<string, number>();
    items.forEach((s) => {
      const k = s.status ?? "sem_status";
      m.set(k, (m.get(k) ?? 0) + 1);
    });
    return Array.from(m.entries()).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((s) => {
      if (q && !`${s.codigo ?? ""} ${s.nome} ${s.cidade ?? ""} ${s.responsavel ?? ""}`.toLowerCase().includes(q)) return false;
      if (ufFilter !== "__all__" && s.uf !== ufFilter) return false;
      if (statusFilter !== "__all__" && s.status !== statusFilter) return false;
      return true;
    });
  }, [items, search, ufFilter, statusFilter]);

  const startNew = () => { setEditing({ status: "em_aprovacao" }); setOpen(true); };

  const save = async () => {
    if (!editing?.nome) return toast.error("Nome é obrigatório");
    const payload = {
      codigo: editing.codigo ?? null,
      nome: editing.nome,
      cidade: editing.cidade ?? null,
      uf: editing.uf ?? null,
      status: editing.status ?? null,
      responsavel: editing.responsavel ?? null,
      latitude: editing.latitude ?? null,
      longitude: editing.longitude ?? null,
    };
    const { error } = editing.id
      ? await supabase.from("eng_sites").update(payload).eq("id", editing.id)
      : await supabase.from("eng_sites").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Salvo"); setOpen(false); setEditing(null); load();
  };

  const del = async (id: string) => {
    if (!confirm("Excluir site?")) return;
    const { error } = await supabase.from("eng_sites").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const cnt = (st: string) => items.filter((x) => String(x.status).toLowerCase() === st).length;

  return (
    <div className="space-y-4">
      <EngPageHeader
        title="Sites"
        description="Gestão de obras e sites com distribuição geográfica."
        actions={<Button onClick={startNew} className="shadow-elegant"><Plus className="w-4 h-4" /> Novo site</Button>}
      />

      <KpiGrid>
        <KpiCard label="Total" value={items.length} icon={MapPin} tone="teal" />
        <KpiCard label="Ativos" value={cnt("ativo")} icon={CheckCircle2} tone="success" />
        <KpiCard label="Em aprovação" value={cnt("em_aprovacao")} icon={CalendarClock} tone="warn" />
        <KpiCard label="Pausados" value={cnt("pausado")} icon={AlertTriangle} tone="danger" />
        <KpiCard label="UFs cobertas" value={ufs.length} icon={MapPin} tone="neutral" />
      </KpiGrid>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="card-elegant">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-display">Distribuição por UF</CardTitle></CardHeader>
          <CardContent style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={ufs} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis dataKey="uf" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={36} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6 }} />
                <Bar dataKey="count" fill={TEAL} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-display">Status dos sites</CardTitle></CardHeader>
          <CardContent style={{ height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={(e) => `${e.name}: ${e.value}`}>
                  {statusDist.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="card-elegant p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-8 h-9" placeholder="Buscar código, nome, cidade..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={ufFilter} onValueChange={setUfFilter}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="UF" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">UF: todas</SelectItem>
              {ufs.map((u) => <SelectItem key={u.uf} value={u.uf}>{u.uf} ({u.count})</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Status: todos</SelectItem>
              {STATUS_SITE.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} de {items.length}</span>
        </div>
      </Card>

      <Card className="card-elegant overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 border-b">
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2.5">Código</th>
              <th className="px-3 py-2.5">Nome</th>
              <th className="px-3 py-2.5">Cidade / UF</th>
              <th className="px-3 py-2.5">Responsável</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">Geo</th>
              <th className="px-3 py-2.5 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-3 py-12 text-center text-muted-foreground">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-12 text-center text-muted-foreground">Nenhum site.</td></tr>
            ) : filtered.map((s) => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-accent/30 cursor-pointer transition-colors"
                  title="Duplo-clique para editar"
                  onDoubleClick={() => { setEditing(s); setOpen(true); }}>
                <td className="px-3 py-2.5 font-mono text-xs">{s.codigo ?? "—"}</td>
                <td className="px-3 py-2.5 font-medium">{s.nome}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{s.cidade ?? "—"} {s.uf && <Badge variant="outline" className="ml-1 text-[10px]">{s.uf}</Badge>}</td>
                <td className="px-3 py-2.5">{s.responsavel ?? "—"}</td>
                <td className="px-3 py-2.5"><StatusBadge value={s.status} /></td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                  {s.latitude && s.longitude ? `${Number(s.latitude).toFixed(3)}, ${Number(s.longitude).toFixed(3)}` : "—"}
                </td>
                <td className="px-3 py-2">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); del(s.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-2xl" onKeyDown={makeEditKeyHandler(save, () => setOpen(false))}>
          <DialogHeader><DialogTitle className="font-display">{editing?.id ? "Editar site" : "Novo site"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label className="text-xs">Código</Label><Input value={editing.codigo ?? ""} onChange={(e) => setEditing({ ...editing, codigo: e.target.value })} /></div>
              <div><Label className="text-xs">Nome *</Label><Input value={editing.nome ?? ""} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} /></div>
              <div><Label className="text-xs">Cidade</Label><Input value={editing.cidade ?? ""} onChange={(e) => setEditing({ ...editing, cidade: e.target.value })} /></div>
              <div><Label className="text-xs">UF</Label><Input maxLength={2} value={editing.uf ?? ""} onChange={(e) => setEditing({ ...editing, uf: e.target.value.toUpperCase() })} /></div>
              <div><Label className="text-xs">Responsável</Label><Input value={editing.responsavel ?? ""} onChange={(e) => setEditing({ ...editing, responsavel: e.target.value })} /></div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={editing.status ?? ""} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                  <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                  <SelectContent>{STATUS_SITE.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Latitude</Label><Input type="number" step="0.000001" value={editing.latitude ?? ""} onChange={(e) => setEditing({ ...editing, latitude: e.target.value === "" ? null : Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Longitude</Label><Input type="number" step="0.000001" value={editing.longitude ?? ""} onChange={(e) => setEditing({ ...editing, longitude: e.target.value === "" ? null : Number(e.target.value) })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ============================================================ */
/*  EQUIPES DELUXE                                              */
/* ============================================================ */

interface Equipe {
  id: string;
  nome: string;
  lider: string | null;
  status: string | null;
  membros: { nome: string; funcao?: string }[] | null;
  site_id: string | null;
}

const STATUS_EQUIPE = ["ativa", "alocada", "inativa"];

export const EquipesDeluxePage = () => {
  const [items, setItems] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Equipe> | null>(null);
  const [novoMembro, setNovoMembro] = useState({ nome: "", funcao: "" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("eng_equipes").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems(((data ?? []) as any[]).map((r) => ({ ...r, membros: Array.isArray(r.membros) ? r.membros : [] })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const totalMembros = useMemo(() => items.reduce((a, e) => a + (e.membros?.length ?? 0), 0), [items]);
  const cnt = (st: string) => items.filter((x) => String(x.status).toLowerCase() === st).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((e) =>
      `${e.nome} ${e.lider ?? ""} ${(e.membros ?? []).map((m) => m.nome).join(" ")}`.toLowerCase().includes(q),
    );
  }, [items, search]);

  const startNew = () => { setEditing({ status: "ativa", membros: [] }); setOpen(true); };

  const addMembro = () => {
    if (!novoMembro.nome.trim() || !editing) return;
    const list = [...(editing.membros ?? []), { nome: novoMembro.nome.trim(), funcao: novoMembro.funcao.trim() || undefined }];
    setEditing({ ...editing, membros: list });
    setNovoMembro({ nome: "", funcao: "" });
  };
  const removeMembro = (idx: number) => {
    if (!editing) return;
    const list = [...(editing.membros ?? [])]; list.splice(idx, 1);
    setEditing({ ...editing, membros: list });
  };

  const save = async () => {
    if (!editing?.nome) return toast.error("Nome é obrigatório");
    const payload: any = {
      nome: editing.nome,
      lider: editing.lider ?? null,
      status: editing.status ?? null,
      membros: editing.membros ?? [],
    };
    const { error } = editing.id
      ? await supabase.from("eng_equipes").update(payload).eq("id", editing.id)
      : await supabase.from("eng_equipes").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Salvo"); setOpen(false); setEditing(null); load();
  };

  const del = async (id: string) => {
    if (!confirm("Excluir equipe?")) return;
    const { error } = await supabase.from("eng_equipes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-4">
      <EngPageHeader
        title="Equipes"
        description="Equipes de campo com gestão de membros."
        actions={<Button onClick={startNew} className="shadow-elegant"><Plus className="w-4 h-4" /> Nova equipe</Button>}
      />

      <KpiGrid>
        <KpiCard label="Equipes" value={items.length} icon={Users} tone="teal" />
        <KpiCard label="Ativas" value={cnt("ativa")} icon={CheckCircle2} tone="success" />
        <KpiCard label="Alocadas" value={cnt("alocada")} icon={CalendarClock} tone="warn" />
        <KpiCard label="Inativas" value={cnt("inativa")} icon={AlertTriangle} tone="neutral" />
        <KpiCard label="Total membros" value={totalMembros} icon={UserPlus} tone="teal" />
      </KpiGrid>

      <Card className="card-elegant p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-8 h-9" placeholder="Buscar equipe, líder, membro..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} de {items.length}</span>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <Card className="card-elegant col-span-full p-12 text-center text-muted-foreground">Carregando...</Card>
        ) : filtered.length === 0 ? (
          <Card className="card-elegant col-span-full p-12 text-center text-muted-foreground">Nenhuma equipe.</Card>
        ) : filtered.map((e) => (
          <Card key={e.id} className="card-elegant cursor-pointer" title="Duplo-clique para editar" onDoubleClick={() => { setEditing(e); setOpen(true); }}>
            <CardHeader className="pb-2 flex-row items-start justify-between space-y-0">
              <div className="min-w-0">
                <CardTitle className="text-base font-display truncate">{e.nome}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{e.lider ? `Líder: ${e.lider}` : "Sem líder"}</p>
              </div>
              <StatusBadge value={e.status} />
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Users className="w-3 h-3" /> {(e.membros ?? []).length} membros
              </div>
              <div className="flex flex-wrap gap-1">
                {(e.membros ?? []).slice(0, 6).map((m, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] font-normal">{m.nome}{m.funcao ? ` · ${m.funcao}` : ""}</Badge>
                ))}
                {(e.membros ?? []).length > 6 && <Badge variant="outline" className="text-[10px]">+{(e.membros ?? []).length - 6}</Badge>}
              </div>
              <div className="flex justify-end mt-2">
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={(ev) => { ev.stopPropagation(); del(e.id); }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" onKeyDown={makeEditKeyHandler(save, () => setOpen(false))}>
          <DialogHeader><DialogTitle className="font-display">{editing?.id ? "Editar equipe" : "Nova equipe"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label className="text-xs">Nome *</Label><Input value={editing.nome ?? ""} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} /></div>
                <div><Label className="text-xs">Líder</Label><Input value={editing.lider ?? ""} onChange={(e) => setEditing({ ...editing, lider: e.target.value })} /></div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Status</Label>
                  <Select value={editing.status ?? ""} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                    <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                    <SelectContent>{STATUS_EQUIPE.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-3">
                <Label className="text-xs flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Membros ({(editing.membros ?? []).length})</Label>
                <div className="flex gap-2 mt-2">
                  <Input placeholder="Nome" value={novoMembro.nome} onChange={(e) => setNovoMembro({ ...novoMembro, nome: e.target.value })} />
                  <Input placeholder="Função" className="max-w-[160px]" value={novoMembro.funcao} onChange={(e) => setNovoMembro({ ...novoMembro, funcao: e.target.value })} />
                  <Button type="button" onClick={addMembro} variant="outline"><UserPlus className="w-4 h-4" /></Button>
                </div>
                <div className="mt-3 space-y-1 max-h-60 overflow-y-auto">
                  {(editing.membros ?? []).map((m, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded bg-muted/40">
                      <span className="text-sm flex-1">{m.nome}{m.funcao && <span className="text-muted-foreground"> · {m.funcao}</span>}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeMembro(i)}><X className="w-3.5 h-3.5" /></Button>
                    </div>
                  ))}
                  {(editing.membros ?? []).length === 0 && <p className="text-xs text-muted-foreground italic">Nenhum membro.</p>}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ============================================================ */
/*  MATERIAIS — CATÁLOGO                                        */
/*  Itens cadastrados aqui aparecerão na sub-aba "Nova         */
/*  solicitação" para o solicitante escolher.                   */
/* ============================================================ */

interface CatMat {
  id: string;
  codigo: string;
  descricao: string;
  categoria: string;
  conta_financeira: string;
  unidade: string;
}

export const MateriaisDeluxePage = () => {
  const { items: catalogo, categorias, loading, } = useMateriais();
  const catCadastro = useFieldOptions("categoria");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("__all__");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<CatMat> | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // useMateriais não expõe reload — força via window.location? Melhor: refetch manual via supabase
  const [localItems, setLocalItems] = useState<CatMat[] | null>(null);
  const items = localItems ?? catalogo;

  const refetch = async () => {
    const all: CatMat[] = [];
    let from = 0; const page = 1000;
    while (true) {
      const { data, error } = await supabase
        .from("eng_shared_records").select("id,data")
        .eq("kind", "cad_materiais").range(from, from + page - 1);
      if (error || !data || data.length === 0) break;
      data.forEach((row: any) => {
        const d = row.data || {};
        all.push({
          id: row.id,
          codigo: String(d.codigo ?? ""),
          descricao: String(d.descricao ?? ""),
          categoria: String(d.categoria ?? ""),
          conta_financeira: String(d.conta_financeira ?? ""),
          unidade: String(d.unidade ?? ""),
        });
      });
      if (data.length < page) break;
      from += page;
    }
    setLocalItems(all);
  };

  useEffect(() => { if (reloadKey > 0) refetch(); }, [reloadKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((c) => {
      if (catFilter !== "__all__" && c.categoria !== catFilter) return false;
      if (q && !`${c.codigo} ${c.descricao} ${c.categoria}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, search, catFilter]);

  // Reset para a primeira página quando filtros mudam
  useEffect(() => { setPage(1); }, [search, catFilter, items.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  // Categorias do filtro = união do catálogo + cadastradas em eng_field_options
  const categoriasFiltro = useMemo(() => {
    const set = new Set<string>();
    categorias.forEach((c) => c && set.add(c));
    catCadastro.options.forEach((c) => c && set.add(c));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [categorias, catCadastro.options]);

  const startNew = () => { setEditing({ codigo: "", descricao: "", categoria: "", conta_financeira: "", unidade: "un" }); setOpen(true); };
  const startEdit = (c: CatMat) => { setEditing({ ...c }); setOpen(true); };

  const save = async () => {
    if (!editing?.descricao) return toast.error("Descrição é obrigatória");
    const dataPayload = {
      codigo: editing.codigo ?? "",
      descricao: editing.descricao,
      categoria: editing.categoria ?? "",
      conta_financeira: editing.conta_financeira ?? "",
      unidade: editing.unidade ?? "",
    };
    if (editing.id) {
      const before = items.find((i) => i.id === editing.id);
      const { error } = await supabase.from("eng_shared_records").update({ data: dataPayload } as any).eq("id", editing.id);
      if (error) return toast.error(error.message);
      fireAudit({
        acao: "update", modulo: "engenharia.materiais",
        entidade_tipo: "cad_materiais", entidade_id: editing.id,
        nome_entidade: dataPayload.descricao,
        dados_antes: before, dados_depois: dataPayload,
        observacoes: "Edição de material no catálogo",
      });
    } else {
      const { data: u } = await supabase.auth.getUser();
      const { data: ins, error } = await supabase.from("eng_shared_records").insert({ kind: "cad_materiais", data: dataPayload, created_by: u.user?.id ?? null } as any).select().single();
      if (error) return toast.error(error.message);
      fireAudit({
        acao: "create", modulo: "engenharia.materiais",
        entidade_tipo: "cad_materiais", entidade_id: ins?.id ?? null,
        nome_entidade: dataPayload.descricao,
        dados_depois: dataPayload,
        observacoes: "Criação de material no catálogo",
      });
    }
    toast.success("Salvo"); setOpen(false); setEditing(null); setReloadKey(k => k + 1);
  };

  const del = async (c: CatMat) => {
    if (!confirm(`Excluir "${c.descricao}" do catálogo?`)) return;
    const { error } = await supabase.from("eng_shared_records").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    fireAudit({
      acao: "delete", modulo: "engenharia.materiais",
      entidade_tipo: "cad_materiais", entidade_id: c.id,
      nome_entidade: c.descricao, dados_antes: c,
      observacoes: "Exclusão de material do catálogo",
    });
    toast.success("Excluído"); setReloadKey(k => k + 1);
  };

  return (
    <div className="space-y-4">
      <EngPageHeader
        title="Materiais"
        description="Catálogo de materiais que aparecerão como opções na sub-aba Nova solicitação."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <MateriaisCatalogToolbar items={items} onImported={() => setReloadKey((k) => k + 1)} />
            <Button onClick={startNew} className="shadow-elegant"><Plus className="w-4 h-4" /> Novo material</Button>
          </div>
        }
      />

      <KpiGrid>
        <KpiCard label="Itens no catálogo" value={items.length} icon={Boxes} tone="teal" />
        <KpiCard label="Categorias" value={categorias.length} icon={Wrench} tone="neutral" />
      </KpiGrid>

      <Card className="card-elegant p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-8 h-9" placeholder="Buscar por código, descrição ou categoria..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="h-9 w-[220px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent className="max-h-[60vh]">
              <SelectItem value="__all__">Categoria: todas ({categoriasFiltro.length})</SelectItem>
              {categoriasFiltro.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} de {items.length}</span>
        </div>
      </Card>

      <Card className="card-elegant">
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 border-b sticky top-0 z-10">
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2.5">Código</th>
                <th className="px-3 py-2.5">Descrição</th>
                <th className="px-3 py-2.5">Categoria</th>
                <th className="px-3 py-2.5">Conta financeira</th>
                <th className="px-3 py-2.5">Unidade</th>
                <th className="px-3 py-2.5 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {loading && !localItems ? (
                <tr><td colSpan={6} className="px-3 py-12 text-center text-muted-foreground">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-12 text-center text-muted-foreground">Nenhum material no catálogo.</td></tr>
              ) : pageItems.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-accent/30 cursor-pointer transition-colors" onClick={() => startEdit(c)}>
                  <td className="px-3 py-2 font-mono text-xs">{c.codigo || "—"}</td>
                  <td className="px-3 py-2 font-medium">{c.descricao}</td>
                  <td className="px-3 py-2"><Badge variant="outline" className="text-[10px] font-normal">{c.categoria || "—"}</Badge></td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">{c.conta_financeira || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.unidade || "—"}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Editar" onClick={() => startEdit(c)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Excluir" onClick={() => del(c)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-t bg-muted/30 text-xs">
            <span className="text-muted-foreground">
              Mostrando {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} de {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" className="h-7 px-2" disabled={currentPage <= 1} onClick={() => setPage(1)}>«</Button>
              <Button size="sm" variant="outline" className="h-7 px-2" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>‹ Anterior</Button>
              {(() => {
                const pages: number[] = [];
                const start = Math.max(1, currentPage - 2);
                const end = Math.min(totalPages, start + 4);
                for (let i = start; i <= end; i++) pages.push(i);
                return pages.map((p) => (
                  <Button key={p} size="sm" variant={p === currentPage ? "default" : "outline"} className="h-7 min-w-[32px] px-2" onClick={() => setPage(p)}>{p}</Button>
                ));
              })()}
              <Button size="sm" variant="outline" className="h-7 px-2" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>Próxima ›</Button>
              <Button size="sm" variant="outline" className="h-7 px-2" disabled={currentPage >= totalPages} onClick={() => setPage(totalPages)}>»</Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle className="font-display">{editing?.id ? "Editar material" : "Novo material"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label className="text-xs">Código</Label><Input value={editing.codigo ?? ""} onChange={(e) => setEditing({ ...editing, codigo: e.target.value })} /></div>
              <div><Label className="text-xs">Unidade</Label><Input value={editing.unidade ?? ""} onChange={(e) => setEditing({ ...editing, unidade: e.target.value })} /></div>
              <div className="md:col-span-2"><Label className="text-xs">Descrição *</Label><Input value={editing.descricao ?? ""} onChange={(e) => setEditing({ ...editing, descricao: e.target.value })} /></div>
              <div>
                <Label className="text-xs">Categoria</Label>
                <Select
                  value={editing.categoria || "__none"}
                  onValueChange={(v) => {
                    const val = v === "__none" ? "" : v;
                    const meta = catCadastro.findMeta(val);
                    setEditing({
                      ...editing,
                      categoria: val,
                      conta_financeira: meta?.conta_financeira ? String(meta.conta_financeira) : (editing.conta_financeira ?? ""),
                    });
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">—</SelectItem>
                    {catCadastro.options.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Conta financeira</Label>
                <Input value={editing.conta_financeira ?? ""} onChange={(e) => setEditing({ ...editing, conta_financeira: e.target.value })} placeholder="Auto pela categoria" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
