import { useEffect, useMemo, useState, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus, Pencil, Trash2, Search, FileText, X, ShoppingCart, AlertTriangle,
  CheckCircle2, CalendarClock, List, LayoutGrid, BarChart3, UserPlus, Mail,
  Upload, Download,
} from "lucide-react";
import { SolicitanteTab } from "./SolicitanteTab";
import { EnviarOutlookRcDialog } from "./EnviarOutlookRcDialog";
import { toast } from "sonner";
import { fmtDate } from "../lib/storage";
import { SCRC_STATUS, listScRcBySolicit, listScRcAll, createScRc, updateScRcStatus, updateScRc, deleteScRcMany, type ScRcRow } from "../lib/scrcStore";
import { useMateriais } from "../hooks/useMateriais";
import { EngPageHeader } from "./components/EngPageHeader";
import { KpiCard, KpiGrid } from "./components/KpiCard";
import { StatusBadge } from "./components/StatusBadge";
import { EngKanban } from "./components/EngKanban";
import { DistribuicaoCard, RankingCard } from "./components/EngMiniCharts";
import { DataActionsToolbar } from "@/components/DataActionsToolbar";
import { useEngDemoMode } from "../demo/useEngDemoMode";
import { getDemoTable } from "../demo/engDemoTables";
import { Checkbox } from "@/components/ui/checkbox";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import { DeleteWithPasswordModal } from "@/components/DeleteWithPasswordModal";

interface Solicit {
  id: string;
  numero: string | null;
  descricao: string | null;
  status: string | null;
  prioridade?: string | null;
  solicitante: string | null;
  responsavel: string | null;
  prazo: string | null;
  itens: any;
  data: any;
  created_at: string;
  updated_at: string;
}

const STATUS_SOL = ["aberta", "em_cotacao", "comprada", "recebida", "cancelada"];
const ALL = "__all__";

function ScRcPanel({ solicitId, solicit, onClose }: { solicitId: string; solicit?: Solicit | null; onClose: () => void }) {
  const [rows, setRows] = useState<ScRcRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<ScRcRow>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { items: catalogo } = useMateriais();
  const sd = (solicit?.data || {}) as any;
  const itens: any[] = Array.isArray(solicit?.itens) ? (solicit!.itens as any[]) : [];
  const tipoSol = String(sd.tipo || "").toLowerCase();
  const isRequisicao = tipoSol.includes("requisi");
  const sel = useBulkSelection(rows);

  const excluirSelecionados = async () => {
    const ids = Array.from(sel.selected);
    if (!ids.length) return;
    if (!confirm(`Excluir ${ids.length} SC/RC selecionada(s)?`)) return;
    const snap = rows;
    setRows((prev) => prev.filter((x) => !sel.selected.has(x.id)));
    sel.clear();
    try { await deleteScRcMany(ids); toast.success(`${ids.length} excluída(s)`); }
    catch (e: any) { setRows(snap); toast.error(String(e?.message ?? e)); }
  };

  // Auto-fill helpers a partir do material escolhido
  const findItem = (desc: string) => itens.find((it) => String(it.descricao) === desc);
  const fillFromItem = (desc: string) => {
    const it = findItem(desc);
    return {
      categoria: it?.categoria || sd.categoria || "",
      conta_financeira: it?.conta_financeira || sd.conta_financeira || "",
      centro_custo: sd.cc || "",
    };
  };

  const [novo, setNovo] = useState({
    tipo_documento: isRequisicao ? "RC" : "SC",
    numero_documento: "",
    item_descricao: "",
    categoria: "",
    conta_financeira: "",
    centro_custo: sd.cc || "",
    observacao: "",
    status: "SOLICITADO",
    data_solicitacao: new Date().toISOString().slice(0, 10),
    auxiliar: "",
    responsavel: solicit?.responsavel || "",
    coordenador: sd.coordenador || "",
    data_finalizacao_compra: "",
    data_finalizacao_logistica: "",
  });

  const onPickItem = (desc: string) => {
    const f = fillFromItem(desc);
    setNovo((n) => ({ ...n, item_descricao: desc, ...f }));
  };

  const load = async () => {
    setLoading(true);
    try { setRows(await listScRcBySolicit([solicitId])); } catch (e) { toast.error(String(e)); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [solicitId]);

  const adicionar = async () => {
    if (!novo.numero_documento.trim()) { toast.error("Número do documento é obrigatório"); return; }
    const payload: any = {
      ...novo,
      numero_documento: novo.numero_documento.trim(),
      item_descricao: novo.item_descricao || null,
      categoria: novo.categoria || null,
      conta_financeira: novo.conta_financeira || null,
      centro_custo: novo.centro_custo || null,
      observacao: novo.observacao || null,
      data_solicitacao: novo.data_solicitacao || null,
      auxiliar: novo.auxiliar || null,
      responsavel: novo.responsavel || null,
      coordenador: novo.coordenador || null,
      data_finalizacao_compra: novo.data_finalizacao_compra || null,
      data_finalizacao_logistica: novo.data_finalizacao_logistica || null,
      solicit_id: solicitId,
    };
    // Optimistic
    const tempId = `temp-${Date.now()}`;
    const optimistic: ScRcRow = {
      id: tempId, solicit_id: solicitId,
      tipo_documento: payload.tipo_documento, numero_documento: payload.numero_documento,
      categoria: payload.categoria, conta_financeira: payload.conta_financeira,
      centro_custo: payload.centro_custo, observacao: payload.observacao,
      status: payload.status ?? "SOLICITADO", data_solicitacao: payload.data_solicitacao,
      item_descricao: payload.item_descricao,
      auxiliar: payload.auxiliar, responsavel: payload.responsavel, coordenador: payload.coordenador,
      data_finalizacao_compra: payload.data_finalizacao_compra,
      data_finalizacao_logistica: payload.data_finalizacao_logistica,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    setRows((prev) => [optimistic, ...prev]);
    setNovo({ tipo_documento: isRequisicao ? "RC" : "SC", numero_documento: "", item_descricao: "", categoria: "", conta_financeira: "", centro_custo: sd.cc || "", observacao: "", status: "SOLICITADO", data_solicitacao: new Date().toISOString().slice(0, 10), auxiliar: "", responsavel: solicit?.responsavel || "", coordenador: sd.coordenador || "", data_finalizacao_compra: "", data_finalizacao_logistica: "" });
    try {
      const created = await createScRc(payload);
      setRows((prev) => prev.map((r) => (r.id === tempId ? created : r)));
    } catch (e: any) {
      console.error("createScRc", e);
      setRows((prev) => prev.filter((r) => r.id !== tempId));
      toast.error(e?.message ?? String(e));
    }
  };

  const startEdit = (r: ScRcRow) => { setEditingId(r.id); setEditDraft({ ...r }); };
  const cancelEdit = () => { setEditingId(null); setEditDraft({}); };
  const editKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); saveEdit(); }
    else if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
  };
  const saveEdit = async () => {
    if (!editingId) return;
    const id = editingId;
    const before = rows.find((r) => r.id === id);
    const patch = {
      numero_documento: editDraft.numero_documento || "",
      item_descricao: editDraft.item_descricao ?? null,
      categoria: editDraft.categoria ?? null,
      conta_financeira: editDraft.conta_financeira ?? null,
      centro_custo: editDraft.centro_custo ?? null,
      observacao: editDraft.observacao ?? null,
      data_solicitacao: editDraft.data_solicitacao ?? null,
      auxiliar: editDraft.auxiliar ?? null,
      responsavel: editDraft.responsavel ?? null,
      coordenador: editDraft.coordenador ?? null,
      data_finalizacao_compra: editDraft.data_finalizacao_compra ?? null,
      data_finalizacao_logistica: editDraft.data_finalizacao_logistica ?? null,
    } as any;
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setEditingId(null); setEditDraft({});
    try {
      await updateScRc(id, patch);
    } catch (e: any) {
      if (before) setRows((prev) => prev.map((r) => (r.id === id ? before : r)));
      toast.error(e?.message ?? "Falha ao atualizar");
    }
  };

  // Agrupa SC/RC pelo mesmo número (para popover)
  const groupedByNumber: Record<string, ScRcRow[]> = {};
  rows.forEach((r) => {
    const k = `${r.tipo_documento}|${r.numero_documento}`;
    groupedByNumber[k] ??= [];
    groupedByNumber[k].push(r);
  });

  // Colunas exportadas/importadas — espelham o formulário (mantém ordem)
  const SCRC_COLUMNS: { key: keyof ScRcRow | "cliente" | "endereco" | "cidade" | "uf"; label: string }[] = [
    { key: "tipo_documento", label: "Tipo" },
    { key: "numero_documento", label: "Nº documento" },
    { key: "item_descricao", label: "Material" },
    { key: "categoria", label: "Categoria" },
    { key: "conta_financeira", label: "Conta financeira" },
    { key: "centro_custo", label: "Centro de custo" },
    { key: "cliente", label: "Cliente" },
    { key: "endereco", label: "Endereço" },
    { key: "cidade", label: "Cidade" },
    { key: "uf", label: "UF" },
    { key: "status", label: "Status" },
    { key: "data_solicitacao", label: "Data solicitação" },
    { key: "auxiliar", label: "Auxiliar" },
    { key: "responsavel", label: "Responsável" },
    { key: "coordenador", label: "Coordenador" },
    { key: "data_finalizacao_compra", label: "Fim compra" },
    { key: "data_finalizacao_logistica", label: "Fim logística" },
    { key: "observacao", label: "Observação" },
  ];

  const buildRowExport = (r?: ScRcRow) => {
    const o: Record<string, any> = {};
    SCRC_COLUMNS.forEach((c) => {
      if (c.key === "cliente") o[c.label] = sd.cliente || sd.empresa || "";
      else if (c.key === "endereco") o[c.label] = sd.endereco || "";
      else if (c.key === "cidade") o[c.label] = sd.cidade || "";
      else if (c.key === "uf") o[c.label] = sd.uf || "";
      else o[c.label] = (r as any)?.[c.key] ?? "";
    });
    return o;
  };

  // Exportar SC/RC para xlsx (todas as colunas do formulário)
  const exportXlsx = () => {
    const data = rows.length ? rows.map((r) => buildRowExport(r)) : [buildRowExport()];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SC_RC");
    XLSX.writeFile(wb, `scrc_${solicit?.numero || solicitId}.xlsx`);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([buildRowExport()]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo SC_RC");
    XLSX.writeFile(wb, `modelo_scrc.xlsx`);
  };

  // Importar SC/RC com auto-fill por material/categoria
  const handleImport = async (file: File) => {
    const norm = (s: string) => String(s || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[º°]/g, "o")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const pick = (obj: Record<string, any>, keys: string[]) => {
      for (const key of keys) {
        const value = obj[norm(key)] ?? obj[key];
        if (value !== undefined && value !== null && String(value).trim() !== "") return value;
      }
      return "";
    };
    const isBlankRow = (obj: Record<string, any>) => Object.values(obj).every((v) => String(v ?? "").trim() === "");
    const normalizeDate = (value: unknown) => {
      if (value === null || value === undefined || String(value).trim() === "") return null;
      if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
      if (typeof value === "number" && Number.isFinite(value)) {
        const parsed = XLSX.SSF.parse_date_code(value);
        if (parsed) {
          const yyyy = String(parsed.y).padStart(4, "0");
          const mm = String(parsed.m).padStart(2, "0");
          const dd = String(parsed.d).padStart(2, "0");
          return `${yyyy}-${mm}-${dd}`;
        }
      }
      const text = String(value).trim();
      if (!text) return null;
      const br = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (br) return `${br[3]}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`;
      const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
      const parsed = new Date(text);
      return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
    };

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) {
        toast.error("A planilha não possui abas válidas para importar");
        return;
      }

      const raw = XLSX.utils.sheet_to_json<any>(ws, { defval: "", raw: true });
      console.log(`[SC/RC import] planilha lida: ${raw.length} linhas`);
      let ok = 0;
      let skip = 0;
      const errors: string[] = [];

      for (const [index, row] of raw.entries()) {
        const r: Record<string, any> = {};
        for (const [k, v] of Object.entries(row)) r[norm(k)] = typeof v === "string" ? v.trim() : v;

        if (isBlankRow(r)) {
          skip++;
          continue;
        }

        try {
          const tipoRaw = String(pick(r, ["tipo_documento", "tipo", "tipo_doc", "documento_tipo"]) || (isRequisicao ? "RC" : "SC")).toUpperCase();
          const tipo = tipoRaw === "RC" ? "RC" : "SC";
          const numeroInformado = String(pick(r, [
            "numero_documento", "numero_do_documento", "numero_documento_sc_rc", "numero_sc", "numero_rc",
            "numero", "no_documento", "n_documento", "n_doc", "documento", "doc", "sc_rc",
          ])).trim();
          const numero = numeroInformado || `PREENCHER-${solicit?.numero || solicitId.slice(0, 8)}-${index + 1}`;
          let categoria = String(pick(r, ["categoria", "categoria_material", "categoria_do_material", "grupo_categoria"])).trim();
          let item_descricao = String(pick(r, ["item_descricao", "material", "material_descricao", "descricao_material", "descricao"])).trim() || null;
          let conta_financeira = String(pick(r, ["conta_financeira", "conta_financeira_codigo", "conta_fin", "conta", "conta_financeira_contabil"])).trim();
          let centro_custo = String(pick(r, ["centro_custo", "centro_de_custo", "cc", "custo_centro"]) || sd.cc || "").trim();

          if (item_descricao) {
            const itemNorm = norm(item_descricao);
            const mat = catalogo.find((m) => norm(String(m.descricao || "")) === itemNorm);
            if (mat) {
              if (!categoria && mat.categoria) categoria = mat.categoria;
              if (!conta_financeira && mat.conta_financeira) conta_financeira = mat.conta_financeira;
            }
          }

          if (!conta_financeira && categoria) {
            const categoriaNorm = norm(categoria);
            const mat = catalogo.find((m) => norm(String(m.categoria || "")) === categoriaNorm && m.conta_financeira);
            if (mat) conta_financeira = mat.conta_financeira;
          }

          await createScRc({
            solicit_id: solicitId,
            tipo_documento: tipo,
            numero_documento: numero,
            item_descricao,
            categoria: categoria || null,
            conta_financeira: conta_financeira || null,
            centro_custo: centro_custo || null,
            observacao: String(pick(r, ["observacao", "observacoes", "obs"]) || "") || null,
            status: String(pick(r, ["status", "situacao"]) || "SOLICITADO"),
            data_solicitacao: normalizeDate(pick(r, ["data_solicitacao", "data_solicitacao_sc", "data", "emissao", "data_emissao"])),
            auxiliar: String(pick(r, ["auxiliar", "nome_auxiliar"]) || "") || null,
            responsavel: String(pick(r, ["responsavel", "responsavel_compra", "comprador_responsavel"]) || "") || null,
            coordenador: String(pick(r, ["coordenador", "coordenador_solicitante", "solicitado_por"]) || "") || null,
            data_finalizacao_compra: normalizeDate(pick(r, ["data_finalizacao_compra", "fim_compra", "data_fim_compra", "finalizacao_compra"])),
            data_finalizacao_logistica: normalizeDate(pick(r, ["data_finalizacao_logistica", "fim_logistica", "fim_logistica", "data_fim_logistica", "finalizacao_logistica"])),
          } as any);
          ok++;
        } catch (rowError: any) {
          const msg = rowError?.message ?? String(rowError);
          console.error(`[SC/RC import] linha ${index + 2} falhou:`, rowError, row);
          errors.push(`linha ${index + 2}: ${msg}`);
        }
      }

      console.log(`[SC/RC import] resultado: ok=${ok} · skip=${skip} · erros=${errors.length} · total=${raw.length}`);

      if (ok > 0) {
        toast.success(`${ok} de ${raw.length} importados${skip ? ` · ${skip} vazia(s)` : ""}${errors.length ? ` · ${errors.length} com erro` : ""}`);
        load();
      }

      if (errors.length > 0) {
        toast.error(`${errors.length} linha(s) falharam (veja o console F12): ${errors.slice(0, 2).join(" · ")}${errors.length > 2 ? " · ..." : ""}`, { duration: 8000 });
      }

      if (ok === 0 && errors.length === 0) {
        toast.warning("Nenhuma linha válida foi encontrada na planilha");
      }
    } catch (e: any) {
      toast.error("Falha ao importar: " + (e?.message ?? e));
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />SC / RC vinculados {solicit?.numero ? `— ${solicit.numero}` : ""}</DialogTitle></DialogHeader>

        {/* Toolbar Importar/Exportar */}
        <div className="flex items-center gap-2 -mt-1">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); e.currentTarget.value = ""; }} />
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" /> Importar
          </Button>
          <Button size="sm" variant="outline" onClick={exportXlsx}>
            <Download className="h-4 w-4 mr-1" /> Exportar
          </Button>
          <Button size="sm" variant="ghost" onClick={downloadTemplate}>
            <FileText className="h-4 w-4 mr-1" /> Modelo
          </Button>
          <span className="text-[11px] text-muted-foreground ml-2">
            Modelo / exportação incluem todas as colunas do formulário. Campos vazios entram no import e, sem número, recebem um código provisório para editar depois.
          </span>
        </div>

        {/* Cabeçalho com cliente/endereço/cidade/UF */}
        <Card className="card-elegant">
          <CardContent className="pt-3 pb-3 grid gap-2 md:grid-cols-4 text-sm">
            <div><div className="text-[10px] uppercase text-muted-foreground">Cliente</div><div className="font-medium">{sd.cliente || sd.empresa || "—"}</div></div>
            <div><div className="text-[10px] uppercase text-muted-foreground">Endereço</div><div className="font-medium">{sd.endereco || "—"}</div></div>
            <div><div className="text-[10px] uppercase text-muted-foreground">Cidade</div><div className="font-medium">{sd.cidade || "—"}</div></div>
            <div><div className="text-[10px] uppercase text-muted-foreground">UF</div><div className="font-medium">{sd.uf || "—"}</div></div>
          </CardContent>
        </Card>

        {/* Form para adicionar nova linha SC/RC */}
        <Card className="card-elegant">
          <CardContent className="pt-4 space-y-2">
            <div className="grid gap-2 md:grid-cols-12 items-end">
              <div className="md:col-span-2">
                <Label className="text-xs">Tipo</Label>
                <Select value={novo.tipo_documento} onValueChange={(v) => setNovo({ ...novo, tipo_documento: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="SC">SC</SelectItem><SelectItem value="RC">RC</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="md:col-span-6">
                <Label className="text-xs">Material</Label>
                <Select value={novo.item_descricao} onValueChange={onPickItem}>
                  <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>
                    {itens.length === 0 && <SelectItem value="__none" disabled>Sem materiais</SelectItem>}
                    {itens.map((it: any, i: number) => (
                      <SelectItem key={i} value={String(it.descricao)}>{it.descricao}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3">
                <Label className="text-xs">Nº documento *</Label>
                <Input value={novo.numero_documento} onChange={(e) => setNovo({ ...novo, numero_documento: e.target.value })} />
              </div>
              <div className="md:col-span-1">
                <Button onClick={adicionar} className="w-full" title="Adicionar"><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-12 items-end">
              <div className="md:col-span-3"><Label className="text-xs">Categoria (auto)</Label><Input value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })} /></div>
              <div className="md:col-span-3"><Label className="text-xs">Conta fin. (auto)</Label><Input value={novo.conta_financeira} onChange={(e) => setNovo({ ...novo, conta_financeira: e.target.value })} /></div>
              <div className="md:col-span-3"><Label className="text-xs">Centro de custo</Label><Input value={novo.centro_custo} onChange={(e) => setNovo({ ...novo, centro_custo: e.target.value })} /></div>
              <div className="md:col-span-3"><Label className="text-xs">Data solicit.</Label><Input type="date" value={novo.data_solicitacao} onChange={(e) => setNovo({ ...novo, data_solicitacao: e.target.value })} /></div>
            </div>
            <div className="grid gap-2 md:grid-cols-12 items-end">
              <div className="md:col-span-3"><Label className="text-xs">Auxiliar</Label><Input value={novo.auxiliar} onChange={(e) => setNovo({ ...novo, auxiliar: e.target.value })} placeholder="Nome de quem fez" /></div>
              <div className="md:col-span-3"><Label className="text-xs">Responsável</Label><Input value={novo.responsavel} onChange={(e) => setNovo({ ...novo, responsavel: e.target.value })} /></div>
              <div className="md:col-span-3"><Label className="text-xs">Coordenador (solicitou)</Label><Input value={novo.coordenador} onChange={(e) => setNovo({ ...novo, coordenador: e.target.value })} /></div>
              <div className="md:col-span-3 grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Fim compra</Label><Input type="date" value={novo.data_finalizacao_compra} onChange={(e) => setNovo({ ...novo, data_finalizacao_compra: e.target.value })} /></div>
                <div><Label className="text-xs">Fim logística</Label><Input type="date" value={novo.data_finalizacao_logistica} onChange={(e) => setNovo({ ...novo, data_finalizacao_logistica: e.target.value })} /></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant mt-2">
          <CardContent className="pt-4 overflow-x-auto">
            <BulkActionsBar
              count={sel.count}
              onClear={sel.clear}
              onDelete={excluirSelecionados}
              deleteLabel={`Excluir ${sel.count} SC/RC`}
            />
            {loading ? <div className="text-center py-6 text-muted-foreground">Carregando…</div>
              : rows.length === 0 ? <div className="text-center py-6 text-muted-foreground">Nenhum SC/RC vinculado.</div>
              : (
                <table className="w-full text-sm min-w-[1000px]">
                  <thead className="bg-muted/60 border-b">
                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2 w-8">
                        <Checkbox
                          checked={sel.allChecked ? true : sel.someChecked ? "indeterminate" : false}
                          onCheckedChange={() => sel.toggleAll()}
                          aria-label="Selecionar todos"
                        />
                      </th>
                      <th className="px-3 py-2">Material (descrição)</th>
                      <th className="px-3 py-2">Tipo</th><th className="px-3 py-2">Nº</th>
                      <th className="px-3 py-2">Categoria</th>
                      <th className="px-3 py-2">Conta fin.</th>
                      <th className="px-3 py-2">CC</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Data solicit.</th>
                      <th className="px-3 py-2">Auxiliar</th>
                      <th className="px-3 py-2">Responsável</th>
                      <th className="px-3 py-2">Coordenador</th>
                      <th className="px-3 py-2">Fim compra</th>
                      <th className="px-3 py-2">Fim logística</th>
                      <th className="px-3 py-2 w-24 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const isEditing = editingId === r.id;
                      const groupKey = `${r.tipo_documento}|${r.numero_documento}`;
                      const groupSize = groupedByNumber[groupKey]?.length || 1;
                      return (
                      <tr key={r.id} className="border-b last:border-0" onDoubleClick={() => { if (!isEditing) startEdit(r); }}>
                        <td className="px-3 py-2">
                          <Checkbox
                            checked={sel.isSelected(r.id)}
                            onCheckedChange={() => sel.toggle(r.id)}
                            aria-label="Selecionar"
                          />
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {isEditing ? (
                            <Select
                              value={editDraft.item_descricao || ""}
                              onValueChange={(v) => {
                                const f = fillFromItem(v);
                                setEditDraft((d) => ({ ...d, item_descricao: v, ...f }));
                              }}
                            >
                              <SelectTrigger className="h-8"><SelectValue placeholder="Material…" /></SelectTrigger>
                              <SelectContent>
                                {itens.map((it: any, i: number) => (
                                  <SelectItem key={i} value={String(it.descricao)}>{it.descricao}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (r.item_descricao || <span className="text-muted-foreground italic">—</span>)}
                        </td>
                        <td className="px-3 py-2"><Badge variant={r.tipo_documento === "SC" ? "default" : "secondary"}>{r.tipo_documento}</Badge></td>
                        <td className="px-3 py-2 font-medium">
                          {isEditing ? (
                            <Input className="h-8 w-28" value={editDraft.numero_documento ?? ""} onChange={(e) => setEditDraft(d => ({ ...d, numero_documento: e.target.value }))}  onKeyDown={editKeys} />
                          ) : groupSize > 1 ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="text-primary hover:underline inline-flex items-center gap-1">
                                  {r.numero_documento}
                                  <Badge variant="outline" className="text-[9px] h-4">{groupSize}</Badge>
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-72">
                                <div className="text-xs font-semibold mb-2">Materiais vinculados a {r.tipo_documento} {r.numero_documento}</div>
                                <ul className="space-y-1 text-xs">
                                  {groupedByNumber[groupKey].map((g) => (
                                    <li key={g.id} className="flex items-start gap-1">
                                      <span className="text-primary">•</span>
                                      <span>{g.item_descricao || "(sem material)"}</span>
                                    </li>
                                  ))}
                                </ul>
                              </PopoverContent>
                            </Popover>
                          ) : r.numero_documento}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {isEditing
                            ? <Input className="h-8" value={editDraft.categoria ?? ""} onChange={(e) => setEditDraft(d => ({ ...d, categoria: e.target.value }))}  onKeyDown={editKeys} />
                            : (r.categoria || "—")}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {isEditing
                            ? <Input className="h-8" value={editDraft.conta_financeira ?? ""} onChange={(e) => setEditDraft(d => ({ ...d, conta_financeira: e.target.value }))}  onKeyDown={editKeys} />
                            : (r.conta_financeira || "—")}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {isEditing
                            ? <Input className="h-8" value={editDraft.centro_custo ?? ""} onChange={(e) => setEditDraft(d => ({ ...d, centro_custo: e.target.value }))}  onKeyDown={editKeys} />
                            : (r.centro_custo || "—")}
                        </td>
                        <td className="px-3 py-2">
                          <Select value={r.status || "SOLICITADO"} onValueChange={async (v) => {
                            const before = r.status;
                            setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: v } : x)));
                            try { await updateScRcStatus(r.id, v); } catch (e) {
                              setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: before } : x)));
                              toast.error(String(e));
                            }
                          }}>
                            <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue /></SelectTrigger>
                            <SelectContent>{SCRC_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {isEditing
                            ? <Input type="date" className="h-8" value={editDraft.data_solicitacao ?? ""} onChange={(e) => setEditDraft(d => ({ ...d, data_solicitacao: e.target.value }))}  onKeyDown={editKeys} />
                            : (r.data_solicitacao ? fmtDate(r.data_solicitacao) : "—")}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {isEditing
                            ? <Input className="h-8" value={editDraft.auxiliar ?? ""} onChange={(e) => setEditDraft(d => ({ ...d, auxiliar: e.target.value }))}  onKeyDown={editKeys} />
                            : (r.auxiliar || "—")}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {isEditing
                            ? <Input className="h-8" value={editDraft.responsavel ?? ""} onChange={(e) => setEditDraft(d => ({ ...d, responsavel: e.target.value }))}  onKeyDown={editKeys} />
                            : (r.responsavel || "—")}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {isEditing
                            ? <Input className="h-8" value={editDraft.coordenador ?? ""} onChange={(e) => setEditDraft(d => ({ ...d, coordenador: e.target.value }))}  onKeyDown={editKeys} />
                            : (r.coordenador || "—")}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {isEditing
                            ? <Input type="date" className="h-8" value={editDraft.data_finalizacao_compra ?? ""} onChange={(e) => setEditDraft(d => ({ ...d, data_finalizacao_compra: e.target.value }))}  onKeyDown={editKeys} />
                            : (r.data_finalizacao_compra ? fmtDate(r.data_finalizacao_compra) : "—")}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {isEditing
                            ? <Input type="date" className="h-8" value={editDraft.data_finalizacao_logistica ?? ""} onChange={(e) => setEditDraft(d => ({ ...d, data_finalizacao_logistica: e.target.value }))}  onKeyDown={editKeys} />
                            : (r.data_finalizacao_logistica ? fmtDate(r.data_finalizacao_logistica) : "—")}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {isEditing ? (
                            <>
                              <Button variant="ghost" size="sm" className="h-7" onClick={saveEdit} title="Enter para salvar">Salvar</Button>
                              <Button variant="ghost" size="sm" className="h-7" onClick={cancelEdit} title="Esc para cancelar">X</Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(r)} title="Editar (ou duplo-clique na linha)"><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => {
                                if (!confirm("Excluir?")) return;
                                const snap = rows;
                                setRows((prev) => prev.filter((x) => x.id !== r.id));
                                try { await deleteScRcMany([r.id]); } catch (e) { setRows(snap); toast.error(String(e)); }
                              }}><Trash2 className="h-4 w-4" /></Button>
                            </>
                          )}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              )}
          </CardContent>
        </Card>

        <DialogFooter><Button variant="outline" onClick={onClose}><X className="h-4 w-4 mr-1" />Fechar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const SuprimentosPage = () => {
  const { enabled: isDemo } = useEngDemoMode();
  const [rows, setRows] = useState<Solicit[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [fStatus, setFStatus] = useState(ALL);
  const [soPendentes, setSoPendentes] = useState(false);
  const [scrcCounts, setScrcCounts] = useState<Record<string, number>>({});
  const [allScRc, setAllScRc] = useState<ScRcRow[]>([]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Solicit | null>(null);
  const empty: Solicit = {
    id: "", numero: "", descricao: "", status: "aberta", prioridade: "",
    solicitante: "", responsavel: "", prazo: null, itens: [], data: {},
    created_at: "", updated_at: "",
  };
  const [form, setForm] = useState<Solicit>(empty);

  const [scrcOpen, setScrcOpen] = useState<string | null>(null);
  const [outlookId, setOutlookId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    if (isDemo) {
      setRows(((getDemoTable("eng_suprimentos") ?? []) as any));
      setAllScRc([]); setScrcCounts({});
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from("eng_suprimentos").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    const list = (data || []) as Solicit[];
    setRows(list);
    try {
      const all = await listScRcAll();
      setAllScRc(all);
      const cnt: Record<string, number> = {};
      all.forEach((r) => { cnt[r.solicit_id] = (cnt[r.solicit_id] || 0) + 1; });
      setScrcCounts(cnt);
    } catch (e: any) { /* ignore */ }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [isDemo]);

  const hasPendingScRc = (r: Solicit) => {
    const itens: any[] = Array.isArray(r.itens) ? r.itens : [];
    if (!itens.length) return (scrcCounts[r.id] || 0) === 0;
    const linked = new Set(
      allScRc
        .filter((x) => x.solicit_id === r.id)
        .map((x) => String(x.item_descricao || "").trim().toLowerCase())
        .filter(Boolean)
    );
    return itens.some((it: any) => !linked.has(String(it?.descricao || "").trim().toLowerCase()));
  };

  const filtered = useMemo(() => rows.filter((r) => {
    if (soPendentes && !hasPendingScRc(r)) return false;
    if (fStatus !== ALL && r.status !== fStatus) return false;
    if (busca.trim()) {
      const q = busca.toLowerCase();
      const hay = [r.numero, r.descricao, r.solicitante, r.responsavel, r.status].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [rows, busca, fStatus, soPendentes, scrcCounts, allScRc]);

  const sel = useBulkSelection(filtered);
  const [pendingDelete, setPendingDelete] = useState<string[]>([]);
  const [delModalOpen, setDelModalOpen] = useState(false);
  const askDelete = (ids: string[]) => {
    if (!ids.length) return;
    setPendingDelete(ids);
    setDelModalOpen(true);
  };

  const isOverdue = (d: string | null) => d && new Date(d) < new Date(new Date().toDateString());
  const cnt = (st: string) => rows.filter((x) => String(x.status).toLowerCase() === st).length;

  const openNew = () => { setForm({ ...empty }); setEditing(null); setOpen(true); };
  const openEdit = (r: Solicit) => { setForm({ ...r }); setEditing(r); setOpen(true); };

  const save = async () => {
    if (!form.descricao && !form.numero) { toast.error("Informe número ou descrição"); return; }
    const payload = {
      numero: form.numero || null, descricao: form.descricao || null,
      status: form.status, solicitante: form.solicitante || null,
      responsavel: form.responsavel || null, prazo: form.prazo || null,
      data: form.data || {}, itens: form.itens || [],
    };
    if (editing) {
      const { error } = await supabase.from("eng_suprimentos").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Atualizado");
    } else {
      const { error } = await supabase.from("eng_suprimentos").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Criado");
    }
    setOpen(false);
    load();
  };

  const filtersBar = (
    <Card className="card-elegant p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={soPendentes ? "default" : "outline"} onClick={() => setSoPendentes(v => !v)} className="shadow-elegant">
          <AlertTriangle className="h-4 w-4 mr-1" />
          {soPendentes ? "Mostrando pendentes" : "Solicitações pendentes"}
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8 w-56 h-9" placeholder="Buscar…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Status: todos</SelectItem>
              {STATUS_SOL.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Badge variant="secondary">{filtered.length} de {rows.length}</Badge>
        </div>
      </div>
    </Card>
  );

  const listView = (
    <Card className="card-elegant overflow-x-auto">
      <div className="px-3 pt-3">
        <BulkActionsBar
          count={sel.count}
          onClear={sel.clear}
          onDelete={() => askDelete(Array.from(sel.selected))}
          deleteLabel={`Excluir ${sel.count} solicitação(ões)`}
        />
      </div>
      <table className="w-full text-sm">
        <thead className="bg-muted/60 border-b">
          <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2.5 w-8">
              <Checkbox
                checked={sel.allChecked ? true : sel.someChecked ? "indeterminate" : false}
                onCheckedChange={() => sel.toggleAll()}
                aria-label="Selecionar todas"
              />
            </th>
            <th className="px-3 py-2.5">Site / Obra</th>
            <th className="px-3 py-2.5">Cliente</th>
            <th className="px-3 py-2.5">Cidade / UF</th>
            <th className="px-3 py-2.5">Solicitante</th><th className="px-3 py-2.5">Coordenador / Analista</th>
            <th className="px-3 py-2.5">Prazo</th><th className="px-3 py-2.5">Status</th>
            <th className="px-3 py-2.5">SC/RC</th><th className="px-3 py-2.5 w-20"></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={10} className="px-3 py-12 text-center text-muted-foreground">Carregando…</td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={10} className="px-3 py-12 text-center text-muted-foreground">Nenhuma solicitação.</td></tr>
          ) : filtered.map((r) => {
            const d = (r.data || {}) as any;
            const cidUf = [d.cidade, d.uf].filter(Boolean).join(" / ");
            const pendingSc = hasPendingScRc(r);
            return (
            <tr key={r.id} className="border-b last:border-0 hover:bg-accent/20 transition-colors">
              <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={sel.isSelected(r.id)}
                  onCheckedChange={() => sel.toggle(r.id)}
                  aria-label={`Selecionar ${d.site || r.numero || r.id}`}
                />
              </td>
              <td className="px-3 py-2.5 font-medium">{d.site || r.numero || "—"}</td>
              <td className="px-3 py-2.5">{d.cliente || "—"}</td>
              <td className="px-3 py-2.5">{cidUf || "—"}</td>
              <td className="px-3 py-2.5">{r.solicitante || "—"}</td>
              <td className="px-3 py-2.5">{(r.data as any)?.coordenador || (r.data as any)?.analista || r.responsavel || "—"}</td>
              <td className={`px-3 py-2.5 ${isOverdue(r.prazo) && !["concluida", "comprada", "recebida", "cancelada"].includes(String(r.status)) ? "text-destructive font-medium" : ""}`}>{fmtDate(r.prazo)}</td>
              <td className="px-3 py-2.5">
                {pendingSc ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium whitespace-nowrap bg-destructive/15 text-destructive border-destructive/30 animate-pulse">
                    Pendente SC
                  </span>
                ) : (
                  <StatusBadge value={r.status} />
                )}
              </td>
              <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="outline" className="h-7" onClick={() => setScrcOpen(r.id)}>
                  <FileText className="h-3.5 w-3.5 mr-1" /> {scrcCounts[r.id] || 0}
                </Button>
              </td>
              <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Enviar por Outlook" onClick={() => setOutlookId(r.id)}><Mail className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => askDelete([r.id])}><Trash2 className="h-4 w-4" /></Button>
              </td>
            </tr>
          );})}
        </tbody>
      </table>
    </Card>
  );

  // Solicitações pendentes = ainda há material sem SC/RC vinculado
  const solicitacoesPendentes = rows.filter((r) => hasPendingScRc(r)).length;
  // Contagem por status SC/RC (normaliza)
  const cntScRc = (s: string) => allScRc.filter(x => String(x.status || "").toUpperCase() === s).length;

  return (
    <div className="space-y-4">
      <EngPageHeader
        title="Solicitações de Materiais"
        description="Solicitações de compra (SC) e requisições (RC) por demanda."
      />

      <KpiGrid>
        <KpiCard label="Solicitações pendentes" value={solicitacoesPendentes} icon={AlertTriangle} tone="warn" hint="Sem SC/RC vinculados" />
        <KpiCard label="TOTAL" value={allScRc.length} icon={FileText} tone="teal" />
        <KpiCard label="ENTREGUE" value={cntScRc("ENTREGUE")} icon={CheckCircle2} tone="success" />
        <KpiCard label="EM ROTA" value={cntScRc("EM ROTA")} icon={CalendarClock} tone="warn" />
        <KpiCard label="PARALISADO" value={cntScRc("PARALISADO")} icon={AlertTriangle} tone="danger" />
        <KpiCard label="SOLICITADO" value={cntScRc("SOLICITADO")} icon={ShoppingCart} tone="neutral" />
        <KpiCard label="EM COTAÇÃO" value={cntScRc("EM COTAÇÃO")} icon={ShoppingCart} tone="neutral" />
        <KpiCard label="APROV. COORD." value={cntScRc("AGUARDANDO APROV. COORD.")} icon={CalendarClock} tone="neutral" />
        <KpiCard label="APROV. GERÊNCIA" value={cntScRc("AGUARDANDO APROV. GERÊNCIA")} icon={CalendarClock} tone="neutral" />
        <KpiCard label="REMANEJAMENTO" value={cntScRc("REMANEJAMENTO")} icon={ShoppingCart} tone="neutral" />
        <KpiCard label="EM FABRICAÇÃO" value={cntScRc("EM FABRICAÇÃO")} icon={ShoppingCart} tone="neutral" />
        <KpiCard label="EM SEPARAÇÃO" value={cntScRc("EM SEPARAÇÃO")} icon={ShoppingCart} tone="neutral" />
        <KpiCard label="DISPONÍVEL P/ RETIRA" value={cntScRc("DISPONÍVEL PARA RETIRA")} icon={CheckCircle2} tone="success" />
        <KpiCard label="PENDENTE" value={cntScRc("PENDENTE")} icon={AlertTriangle} tone="warn" />
        <KpiCard label="CANCELADO" value={cntScRc("CANCELADO")} icon={X} tone="danger" />
      </KpiGrid>

      <div className="flex justify-end gap-2">
        <DataActionsToolbar
          table="eng_suprimentos"
          title="Solicitações de Materiais"
          fields={[
            { key: "numero", label: "ID", type: "text" },
            { key: "descricao", label: "Descrição", type: "textarea" },
            { key: "solicitante", label: "Solicitante", type: "text" },
            { key: "responsavel", label: "Responsável", type: "text" },
            { key: "prazo", label: "Prazo", type: "date" },
            { key: "status", label: "Status", type: "text" },
          ]}
          rows={filtered}
          onImported={load}
        />
      </div>

      <Tabs defaultValue="nova" className="space-y-3">
        <TabsList>
          <TabsTrigger value="nova"><UserPlus className="w-4 h-4 mr-1.5" />Nova solicitação</TabsTrigger>
          <TabsTrigger value="list"><List className="w-4 h-4 mr-1.5" />Solicitações</TabsTrigger>
          <TabsTrigger value="kanban"><LayoutGrid className="w-4 h-4 mr-1.5" />Kanban</TabsTrigger>
          <TabsTrigger value="dashboard"><BarChart3 className="w-4 h-4 mr-1.5" />Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="nova" className="space-y-3 mt-0">
          <SolicitanteTab rows={rows} onCreated={load} />
        </TabsContent>

        <TabsContent value="list" className="space-y-3 mt-0">
          {filtersBar}
          {listView}
        </TabsContent>

        <TabsContent value="kanban" className="space-y-3 mt-0">
          {filtersBar}
          <EngKanban
            rows={filtered}
            groupKey="status"
            columns={STATUS_SOL}
            titleKey="numero"
            subtitleKey="responsavel"
            dateKey="prazo"
            onItemClick={openEdit}
          />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-3 mt-0">
          <div className="grid gap-3 md:grid-cols-2">
            <DistribuicaoCard title="Distribuição por status" rows={filtered} groupKey="status" />
            <RankingCard title="Top responsáveis (compras)" rows={filtered} groupKey="responsavel" />
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">{editing ? "Editar solicitação" : "Nova solicitação"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label className="text-xs">Número</Label><Input value={form.numero || ""} onChange={(e) => setForm({ ...form, numero: e.target.value })} /></div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status || "aberta"} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_SOL.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Solicitante</Label><Input value={form.solicitante || ""} onChange={(e) => setForm({ ...form, solicitante: e.target.value })} /></div>
            <div><Label className="text-xs">Responsável</Label><Input value={form.responsavel || ""} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} /></div>
            <div><Label className="text-xs">Prazo</Label><Input type="date" value={form.prazo || ""} onChange={(e) => setForm({ ...form, prazo: e.target.value || null })} /></div>
            <div className="md:col-span-2"><Label className="text-xs">Descrição</Label><Textarea rows={3} value={form.descricao || ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {scrcOpen && <ScRcPanel solicitId={scrcOpen} solicit={rows.find(x => x.id === scrcOpen) ?? null} onClose={() => { setScrcOpen(null); load(); }} />}

      <EnviarOutlookRcDialog
        open={!!outlookId}
        onOpenChange={(v) => !v && setOutlookId(null)}
        solicit={outlookId ? rows.find(x => x.id === outlookId) ?? null : null}
        scRcs={outlookId ? allScRc.filter(s => s.solicit_id === outlookId) : []}
      />

      <DeleteWithPasswordModal
        open={delModalOpen}
        onOpenChange={(o) => { setDelModalOpen(o); if (!o) setPendingDelete([]); }}
        table="eng_suprimentos"
        recordIds={pendingDelete}
        recordLabel={pendingDelete.length === 1
          ? (rows.find(r => r.id === pendingDelete[0])?.numero
             ?? (rows.find(r => r.id === pendingDelete[0])?.data as any)?.site
             ?? null)
          : null}
        moduleLabel="Suprimentos"
        onDeleted={() => { sel.clear(); setPendingDelete([]); load(); }}
      />
    </div>
  );
};

export default SuprimentosPage;
