import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { GovFilters } from "../lib/govTypes";
import { fetchArts, computeKpis, groupBy, sumBy, GovArt } from "../lib/govApi";
import { GovKpiGrid } from "../GovKpis";
import { useGovCompany } from "../lib/useGovCompany";

const COLORS = ["hsl(var(--primary))", "#34d399", "#fbbf24", "#f87171", "#60a5fa", "#a78bfa", "#f472b6", "#94a3b8"];

export function VisaoExecutivaTab({ filters }: { filters: GovFilters }) {
  const { companyId, loading: cl } = useGovCompany();
  const [arts, setArts] = useState<GovArt[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    setArts(null); setErr(null);
    fetchArts(companyId, filters).then(setArts).catch((e) => setErr(e.message));
  }, [companyId, JSON.stringify(filters)]);

  const kpis = useMemo(() => arts ? computeKpis(arts) : null, [arts]);
  const porMes = useMemo(() => arts ? groupBy(arts, (a) => a.data_cadastro?.slice(0, 7) ?? "—").reverse().slice(-12) : [], [arts]);
  const porStatus = useMemo(() => arts ? groupBy(arts, (a) => a.status_analise ?? "—").slice(0, 6) : [], [arts]);
  const porUF = useMemo(() => arts ? groupBy(arts, (a) => a.uf ?? "—").slice(0, 10) : [], [arts]);
  const valorPorMes = useMemo(() => arts ? sumBy(arts, (a) => a.data_cadastro?.slice(0, 7) ?? "—", (a) => Number(a.valor_taxa) || 0).reverse().slice(-12) : [], [arts]);

  if (cl || (!companyId && !err)) return <Skeleton className="h-40 w-full" />;
  if (!companyId) return <Card><CardContent className="p-6 text-sm text-muted-foreground">Você precisa estar vinculado a uma empresa.</CardContent></Card>;
  if (err) return <Card><CardContent className="p-6 text-sm text-destructive">{err}</CardContent></Card>;
  if (!arts) return <Skeleton className="h-40 w-full" />;
  if (arts.length === 0) return <Card><CardContent className="p-6 text-sm text-muted-foreground">Nenhuma ART encontrada com os filtros atuais. Use a aba <strong>Importações</strong> para carregar relatórios do CREA.</CardContent></Card>;

  return (
    <div className="space-y-3">
      {kpis && <GovKpiGrid k={kpis} />}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="card-elegant">
          <CardHeader className="pb-1"><CardTitle className="text-sm">ARTs por mês de cadastro</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><BarChart data={porMes}><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" /></BarChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardHeader className="pb-1"><CardTitle className="text-sm">Valor de taxa por mês (R$)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><BarChart data={valorPorMes}><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip formatter={(v: any) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} /><Bar dataKey="value" fill="#34d399" /></BarChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardHeader className="pb-1"><CardTitle className="text-sm">Distribuição por status análise</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><PieChart><Pie data={porStatus} dataKey="value" nameKey="name" outerRadius={80} label={{ fontSize: 10 }}>{porStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardHeader className="pb-1"><CardTitle className="text-sm">Top UFs (CREA)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><BarChart data={porUF} layout="vertical"><XAxis type="number" tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={40} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" /></BarChart></ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
