import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserModules } from "@/modules/planos/hooks/useUserModules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, ArrowRight } from "lucide-react";

type Bucket = "atrasado" | "em_aberto" | "em_andamento" | "pendente" | "concluido" | "finalizado" | "entregue" | "emitido" | "outros";

const ALL_BUCKETS: Bucket[] = ["atrasado","em_aberto","em_andamento","pendente","concluido","finalizado","entregue","emitido"];

const MODULE_TABLE: Record<string, { table: string; route: string; label: string; prazoField?: string }> = {
  "eng.sites":       { table: "eng_sites",       route: "/app/engenharia/sites",       label: "Sites" },
  "eng.atividades":  { table: "eng_atividades",  route: "/app/engenharia/atividades",  label: "Atividades", prazoField: "prazo" },
  "eng.rfi":         { table: "eng_rfi",         route: "/app/engenharia/rfi",         label: "RFI",        prazoField: "prazo" },
  "eng.pendencias":  { table: "eng_pendencias",  route: "/app/engenharia/pendencias",  label: "Pendências",prazoField: "prazo" },
  "eng.suprimentos": { table: "eng_suprimentos", route: "/app/engenharia/suprimentos", label: "Suprimentos",prazoField: "prazo" },
  "eng.materiais":   { table: "eng_materiais",   route: "/app/engenharia/materiais",   label: "Materiais" },
  "eng.demandas":    { table: "eng_demandas",    route: "/app/engenharia/demandas",    label: "Demandas",   prazoField: "prazo" },
  "eng.projetos":    { table: "eng_projetos_elaboracao", route: "/app/engenharia/projetos", label: "Projetos", prazoField: "prazo_conclusao" },
  "eng.equipes":     { table: "eng_equipes",     route: "/app/engenharia/equipes",     label: "Equipes" },
  "eng.fibra":       { table: "eng_fibra_obras", route: "/app/engenharia/fibra",       label: "Fibra" },
  "eng.energia":     { table: "eng_ligacoes_energia", route: "/app/engenharia/energia", label: "Energia" },
  "eng.art":         { table: "eng_art",         route: "/app/engenharia/art",         label: "ART" },
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

function ModuleCard({ moduleKey }: { moduleKey: string }) {
  const meta = MODULE_TABLE[moduleKey];
  const [counts, setCounts] = useState<Record<Bucket, number>>({} as any);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!meta) { setLoading(false); return; }
    const sb: any = supabase;
    const fields = ["status"];
    if (meta.prazoField) fields.push(meta.prazoField);
    sb.from(meta.table).select(fields.join(",")).limit(1000).then(({ data }: any) => {
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
    });
  }, [moduleKey]);

  if (!meta) return null;
  return (
    <Card className="card-elegant">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span>{meta.label}</span>
          <Link to={meta.route} className="text-xs text-primary hover:underline flex items-center gap-1">
            Abrir <ArrowRight className="w-3 h-3" />
          </Link>
        </CardTitle>
        <div className="text-2xl font-bold">{loading ? "…" : total}</div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {ALL_BUCKETS.map((b) => {
            const v = counts[b] ?? 0;
            if (!v) return null;
            return (
              <span key={b} className={`text-[11px] px-2 py-0.5 rounded font-medium ${BUCKET_COLOR[b]}`}>
                {BUCKET_LABEL[b]}: {v}
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
  const visible = useMemo(() => {
    if (!ready) return [] as string[];
    if (isAdmin) return Object.keys(MODULE_TABLE);
    return Array.from(modules).filter((k) => k in MODULE_TABLE);
  }, [modules, isAdmin, ready]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-primary" /> Visão Geral
        </h1>
        <p className="text-sm text-muted-foreground">Status consolidado de cada módulo do seu plano.</p>
      </div>
      {!ready && <div className="text-sm text-muted-foreground">Carregando…</div>}
      {ready && visible.length === 0 && (
        <Card><CardContent className="p-6 text-center text-muted-foreground">Nenhum módulo liberado no seu plano.</CardContent></Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((k) => <ModuleCard key={k} moduleKey={k} />)}
      </div>
    </div>
  );
}
