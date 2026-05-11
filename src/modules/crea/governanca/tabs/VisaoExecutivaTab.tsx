import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { GovFilters } from "../lib/govTypes";
import { fetchGovUnified, unifiedKpis, groupCount, groupSum, GovUnifiedRow } from "../lib/govUnified";
import { useGovCompany } from "../lib/useGovCompany";
import { FileBarChart, DollarSign, MapPin, Users, Building2 } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "#34d399", "#fbbf24", "#f87171", "#60a5fa", "#a78bfa", "#f472b6", "#94a3b8"];

const fmtBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function Kpi({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <Card className="card-elegant">
      <CardContent className="p-3 flex items-center gap-3">
        <div className="rounded-md bg-primary/15 text-primary p-2"><Icon className="h-4 w-4" /></div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function VisaoExecutivaTab({ filters }: { filters: GovFilters }) {
  const { companyId, loading: cl } = useGovCompany();
  const [rows, setRows] = useState<GovUnifiedRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    setRows(null); setErr(null);
    fetchGovUnified(companyId, filters).then(setRows).catch((e) => setErr(e.message));
  }, [companyId, JSON.stringify(filters)]);

  const k = useMemo(() => rows ? unifiedKpis(rows) : null, [rows]);
  const porMes = useMemo(() => rows ? groupSum(rows, (r) => r.data?.slice(0, 7) ?? "—", () => 1).slice(-12) : [], [rows]);
  const valorPorMes = useMemo(() => rows ? groupSum(rows, (r) => r.data?.slice(0, 7) ?? "—", (r) => r.valor ?? 0).slice(-12) : [], [rows]);
  const porUF = useMemo(() => rows ? groupCount(rows, (r) => r.uf ?? "—").slice(0, 10) : [], [rows]);
  const porFonte = useMemo(() => rows ? groupCount(rows, (r) => ({ servicos: "Serviços", art_bloco: "ART por Bloco", relatorio_crea: "Relatórios CREA" }[r.source])) : [], [rows]);

  if (cl) return <Skeleton className="h-40 w-full" />;
  if (!companyId) return <Card><CardContent className="p-6 text-sm text-muted-foreground">Você precisa estar vinculado a uma empresa.</CardContent></Card>;
  if (err) return <Card><CardContent className="p-6 text-sm text-destructive">{err}</CardContent></Card>;
  if (!rows) return <Skeleton className="h-40 w-full" />;
  if (rows.length === 0) return (
    <Card><CardContent className="p-6 text-sm text-muted-foreground">
      Nenhum registro encontrado com os filtros atuais. Importe planilhas nas abas <strong>Relatório Gerencial</strong>, <strong>ART por Bloco</strong> ou <strong>Relatórios CREA</strong>.
    </CardContent></Card>
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Kpi label="Registros"     value={String(k!.total)}        icon={FileBarChart} />
        <Kpi label="Valor total"   value={fmtBRL(k!.valor)}        icon={DollarSign} />
        <Kpi label="UFs distintas" value={String(k!.ufs)}          icon={MapPin} />
        <Kpi label="RTs distintos" value={String(k!.rts)}          icon={Users} />
        <Kpi label="Contratantes"  value={String(k!.contratantes)} icon={Building2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="card-elegant">
          <CardHeader className="pb-1"><CardTitle className="text-sm">Registros por mês</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><BarChart data={porMes}><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" /></BarChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardHeader className="pb-1"><CardTitle className="text-sm">Valor por mês (R$)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><BarChart data={valorPorMes}><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip formatter={(v: any) => fmtBRL(Number(v))} /><Bar dataKey="value" fill="#34d399" /></BarChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardHeader className="pb-1"><CardTitle className="text-sm">Distribuição por origem</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><PieChart><Pie data={porFonte} dataKey="value" nameKey="name" outerRadius={80} label={{ fontSize: 10 }}>{porFonte.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardHeader className="pb-1"><CardTitle className="text-sm">Top UFs</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><BarChart data={porUF} layout="vertical"><XAxis type="number" tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={40} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" /></BarChart></ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
