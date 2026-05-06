import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserModules } from "@/modules/planos/hooks/useUserModules";
import { useImpersonation, maskIfNeeded } from "@/modules/planos/hooks/useImpersonation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LayoutDashboard, ArrowRight, FileSpreadsheet, FileText, Presentation } from "lucide-react";
import { exportVisaoXlsx, exportVisaoDocx, exportVisaoPptx, type VisaoRow } from "../lib/visaoExports";

type Bucket = "atrasado" | "em_aberto" | "em_andamento" | "pendente" | "concluido" | "finalizado" | "entregue" | "emitido" | "outros";
const ALL_BUCKETS: Bucket[] = ["atrasado","em_aberto","em_andamento","pendente","concluido","finalizado","entregue","emitido"];

const MODULE_TABLE: Record<string, { table: string; route: string; label: string; prazoField?: string; dateField?: string }> = {
  "eng.sites":       { table: "eng_sites",       route: "/app/engenharia/sites",       label: "Sites", dateField: "created_at" },
  "eng.atividades":  { table: "eng_atividades",  route: "/app/engenharia/atividades",  label: "Atividades", prazoField: "prazo", dateField: "created_at" },
  "eng.rfi":         { table: "eng_rfi",         route: "/app/engenharia/rfi",         label: "RFI",        prazoField: "prazo", dateField: "created_at" },
  "eng.pendencias":  { table: "eng_pendencias",  route: "/app/engenharia/pendencias",  label: "Pendências", prazoField: "prazo", dateField: "created_at" },
  "eng.suprimentos": { table: "eng_suprimentos", route: "/app/engenharia/suprimentos", label: "Suprimentos",prazoField: "prazo", dateField: "created_at" },
  "eng.materiais":   { table: "eng_materiais",   route: "/app/engenharia/materiais",   label: "Materiais", dateField: "created_at" },
  "eng.demandas":    { table: "eng_demandas",    route: "/app/engenharia/demandas",    label: "Demandas",   prazoField: "prazo", dateField: "created_at" },
  "eng.projetos":    { table: "eng_projetos_elaboracao", route: "/app/engenharia/projetos", label: "Projetos", prazoField: "prazo_conclusao", dateField: "created_at" },
  "eng.equipes":     { table: "eng_equipes",     route: "/app/engenharia/equipes",     label: "Equipes", dateField: "created_at" },
  "eng.fibra":       { table: "eng_fibra_obras", route: "/app/engenharia/fibra",       label: "Fibra", dateField: "created_at" },
  "eng.energia":     { table: "eng_ligacoes_energia", route: "/app/engenharia/energia", label: "Energia", dateField: "created_at" },
  "eng.art":         { table: "eng_art",         route: "/app/engenharia/art",         label: "ART", dateField: "created_at" },
};

function bucketOf(status?: string | null): Bucket {
  if (!status) return "em_aberto";
  const s = String(status).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (s.includes("atras")) return "atrasado";
  if (s.includes("conclu")) return "concluido";
  if (s.includes("finaliz")) return "finalizado";
  if (s.includes("entreg")) return "entregue";
  if (s.includes("emit")) return "emitido";
  if (s.includes("andamento") || s.includes("execut")) return "em_andamento";
  if (s.includes("pendent") || s.includes("aprova")) return "pendente";
  if (s.includes("aberta") || s.includes("aberto") || s.includes("nao iniciada") || s.includes("nova")) return "em_aberto";
  return "outros";
}

const BUCKET_LABEL: Record<Bucket,string> = {
  atrasado: "Atrasado", em_aberto: "Em aberto", em_andamento: "Em andamento", pendente: "Pendente",
  concluido: "Concluído", finalizado: "Finalizado", entregue: "Entregue", emitido: "Emitido", outros: "Outros",
};
const BUCKET_COLOR: Record<Bucket,string> = {
  atrasado: "bg-red-500/15 text-red-700 dark:text-red-400",
  em_aberto: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  em_andamento: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  pendente: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  concluido: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  finalizado: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  entregue: "bg-teal-500/15 text-teal-700 dark:text-teal-400",
  emitido: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
  outros: "bg-muted text-muted-foreground",
};

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const HOJE = new Date();

function ModuleCard({ moduleKey, year, month, onCounts }: { moduleKey: string; year: string; month: string; onCounts: (k: string, total: number, c: Record<string, number>) => void }) {
  const meta = MODULE_TABLE[moduleKey];
  const [counts, setCounts] = useState<Record<Bucket, number>>({} as any);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const imp = useImpersonation();

  useEffect(() => {
    if (!meta) { setLoading(false); return; }
    const sb: any = supabase;
    const fields = ["status"];
    if (meta.prazoField) fields.push(meta.prazoField);
    if (meta.dateField) fields.push(meta.dateField);
    let q = sb.from(meta.table).select(fields.join(",")).limit(1000);
    if (year !== "all" && meta.dateField) {
      const y = Number(year);
      const from = month === "all" ? `${y}-01-01` : `${y}-${String(Number(month)+1).padStart(2,"0")}-01`;
      const toDate = month === "all" ? new Date(y+1, 0, 1) : new Date(y, Number(month)+1, 1);
      const to = toDate.toISOString().slice(0,10);
      q = q.gte(meta.dateField, from).lt(meta.dateField, to);
    }
    q.then(({ data }: any) => {
      const today = new Date().toISOString().slice(0,10);
      const c: any = {};
      (data ?? []).forEach((row: any) => {
        let b = bucketOf(row.status);
        if (b !== "concluido" && b !== "finalizado" && b !== "entregue" && meta.prazoField && row[meta.prazoField] && row[meta.prazoField] < today) {
          b = "atrasado";
        }
        c[b] = (c[b] ?? 0) + 1;
      });
      setCounts(c);
      setTotal((data ?? []).length);
      setLoading(false);
      onCounts(moduleKey, (data ?? []).length, c);
    });
  }, [moduleKey, year, month]);

  if (!meta) return null;
  const showTotal = imp.active && !imp.dataAccess ? maskIfNeeded(total, imp) : total;
  return (
    <Card className="card-elegant">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span>{meta.label}</span>
          <Link to={meta.route} className="text-xs text-primary hover:underline flex items-center gap-1">
            Abrir <ArrowRight className="w-3 h-3" />
          </Link>
        </CardTitle>
        <div className="text-2xl font-bold">{loading ? "…" : showTotal}</div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {ALL_BUCKETS.map((b) => {
            const v = counts[b] ?? 0;
            if (!v) return null;
            const display = imp.active && !imp.dataAccess ? "•" : v;
            return (
              <span key={b} className={`text-[11px] px-2 py-0.5 rounded font-medium ${BUCKET_COLOR[b]}`}>
                {BUCKET_LABEL[b]}: {display}
              </span>
            );
          })}
          {!loading && total === 0 && <span className="text-xs text-muted-foreground">Sem registros</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function VisaoGeralPage() {
  const { modules, isAdmin, ready } = useUserModules();
  const imp = useImpersonation();
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [year, setYear] = useState<string>("all");
  const [month, setMonth] = useState<string>("all");
  const [snapshot, setSnapshot] = useState<Record<string, { total: number; counts: Record<string, number> }>>({});
  const [branding, setBranding] = useState<{ logo_url?: string|null; primary_color?: string|null; rodape?: string|null; nome?: string|null }>({});

  useEffect(() => {
    const sb: any = supabase;
    (async () => {
      // pega branding do usuário (empresa atual ou impersonada)
      const { data: cu } = await sb.from("company_users").select("company_id, companies(nome)").maybeSingle();
      const cid = imp.companyId ?? cu?.company_id;
      if (cid) {
        const { data: br } = await sb.from("company_branding").select("*").eq("company_id", cid).maybeSingle();
        const { data: comp } = await sb.from("companies").select("nome").eq("id", cid).maybeSingle();
        setBranding({ ...(br ?? {}), nome: comp?.nome ?? "OCS" });
      } else {
        setBranding({ nome: "OCS", primary_color: "#2BBDC0" });
      }
    })();
  }, [imp.companyId]);

  const visible = useMemo(() => {
    if (!ready) return [] as string[];
    const all = isAdmin ? Object.keys(MODULE_TABLE) : Array.from(modules).filter((k) => k in MODULE_TABLE);
    if (moduleFilter === "all") return all;
    return all.filter((k) => k === moduleFilter);
  }, [modules, isAdmin, ready, moduleFilter]);

  function onCounts(k: string, total: number, c: Record<string, number>) {
    setSnapshot((s) => ({ ...s, [k]: { total, counts: c } }));
  }

  const filtroLabel = `Período: ${year === "all" ? "todos" : year}${month !== "all" ? " / " + MESES[Number(month)] : ""} · Módulo: ${moduleFilter === "all" ? "todos" : MODULE_TABLE[moduleFilter]?.label}`;

  function buildRows(): VisaoRow[] {
    return visible.map((k) => ({
      modulo: MODULE_TABLE[k]?.label ?? k,
      total: snapshot[k]?.total ?? 0,
      counts: snapshot[k]?.counts ?? {},
    }));
  }

  const years = Array.from({ length: 4 }, (_, i) => String(HOJE.getFullYear() - i));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-primary" /> Visão Geral
          </h1>
          <p className="text-sm text-muted-foreground">Status consolidado de cada módulo do seu plano.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Button size="sm" variant="outline" onClick={() => exportVisaoXlsx(buildRows(), filtroLabel, branding)}>
            <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportVisaoDocx(buildRows(), filtroLabel, branding)}>
            <FileText className="w-4 h-4 mr-1" /> Word
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportVisaoPptx(buildRows(), filtroLabel, branding)}>
            <Presentation className="w-4 h-4 mr-1" /> PowerPoint
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid md:grid-cols-3 gap-3 pt-4">
          <div>
            <Label className="text-xs">Módulo</Label>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(MODULE_TABLE).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Ano</Label>
            <Select value={year} onValueChange={(v) => { setYear(v); if (v === "all") setMonth("all"); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Mês</Label>
            <Select value={month} onValueChange={setMonth} disabled={year === "all"}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {MESES.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!ready && <div className="text-sm text-muted-foreground">Carregando…</div>}
      {ready && visible.length === 0 && (
        <Card><CardContent className="p-6 text-center text-muted-foreground">Nenhum módulo disponível para este filtro.</CardContent></Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((k) => <ModuleCard key={k} moduleKey={k} year={year} month={month} onCounts={onCounts} />)}
      </div>
    </div>
  );
}
