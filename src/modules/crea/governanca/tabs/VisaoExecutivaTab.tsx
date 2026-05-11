import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { GovFilters } from "../lib/govTypes";
import { fetchGovUnified, unifiedKpis, groupCount, groupSum, GovUnifiedRow } from "../lib/govUnified";
import { useGovCompany } from "../lib/useGovCompany";
import { FileBarChart, DollarSign, MapPin, Users, Building2, CheckCircle2, FileText, Wrench } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "#34d399", "#fbbf24", "#f87171", "#60a5fa", "#a78bfa", "#f472b6", "#94a3b8"];

const fmtBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fmtBRLk = (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : `${v}`;

function Kpi({ label, value, icon: Icon, hint }: { label: string; value: string; icon: any; hint?: string }) {
  return (
    <Card className="card-elegant">
      <CardContent className="p-3 flex items-center gap-3">
        <div className="rounded-md bg-primary/15 text-primary p-2"><Icon className="h-4 w-4" /></div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold truncate">{value}</p>
          {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
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

  // Registros (ARTs) por mês — quantidade
  const artsPorMes = useMemo(() => rows ? groupSum(rows, (r) => r.data?.slice(0, 7), () => 1).slice(-12) : [], [rows]);
  // Valor de ARTs pagas por mês
  const valorPagoPorMes = useMemo(() => rows ? groupSum(rows, (r) => r.data?.slice(0, 7), (r) => r.valor_pago ?? 0).slice(-12) : [], [rows]);

  const porUF = useMemo(() => rows ? groupCount(rows, (r) => r.uf).slice(0, 10) : [], [rows]);
  const porFonte = useMemo(() => rows ? groupCount(rows, (r) => ({ servicos: "Serviços", art_bloco: "ART por Bloco", relatorio_crea: "Relatórios CREA" }[r.source])) : [], [rows]);

  const porContratante = useMemo(() => rows ? groupCount(rows, (r) => r.contratante).slice(0, 10) : [], [rows]);
  const valorPorAtividade = useMemo(() => rows ? groupSum(rows, (r) => r.atividade_servico, (r) => r.valor_art ?? 0).filter(x => x.value > 0).sort((a,b) => b.value - a.value) : [], [rows]);
  const porCidade = useMemo(() => rows ? groupCount(rows, (r) => r.cidade).slice(0, 10) : [], [rows]);

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
      {/* KPIs principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Kpi label="ARTs (registros)"  value={String(k!.total)}            icon={FileBarChart} />
        <Kpi label="Valor total ART"   value={fmtBRL(k!.valor_art)}        icon={DollarSign} hint="Soma dos valores de ART" />
        <Kpi label="Valor total Contrato" value={fmtBRL(k!.valor_contrato)} icon={FileText} hint="Soma dos valores de contrato" />
        <Kpi label="Valor total Pago"  value={fmtBRL(k!.valor_pago)}       icon={CheckCircle2} hint="Soma efetivamente paga" />
      </div>

      {/* KPIs auxiliares */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Kpi label="UFs distintas"     value={String(k!.ufs)}          icon={MapPin} />
        <Kpi label="Cidades distintas" value={String(k!.cidades)}      icon={MapPin} />
        <Kpi label="RTs distintos"     value={String(k!.rts)}          icon={Users} />
        <Kpi label="Contratantes"      value={String(k!.contratantes)} icon={Building2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="card-elegant">
          <CardHeader className="pb-1"><CardTitle className="text-sm">ARTs por mês (quantidade)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><BarChart data={artsPorMes}><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" name="ARTs" /></BarChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardHeader className="pb-1"><CardTitle className="text-sm">Valor pago de ARTs por mês (R$)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><BarChart data={valorPagoPorMes}><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={fmtBRLk} /><Tooltip formatter={(v: any) => fmtBRL(Number(v))} /><Bar dataKey="value" fill="#34d399" name="Pago" /></BarChart></ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="pb-1"><CardTitle className="text-sm">Distribuição por origem</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><PieChart><Pie data={porFonte} dataKey="value" nameKey="name" outerRadius={80} label={{ fontSize: 10 }}>{porFonte.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardHeader className="pb-1"><CardTitle className="text-sm">Top UFs (ARTs)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><BarChart data={porUF} layout="vertical"><XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} /><YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={50} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" /></BarChart></ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="pb-1"><CardTitle className="text-sm flex items-center gap-1"><Building2 className="h-3 w-3" /> ARTs por contratante (top 10)</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer><BarChart data={porContratante} layout="vertical" margin={{ left: 8, right: 8 }}><XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} /><YAxis type="category" dataKey="name" tick={false} width={0} /><Tooltip formatter={(v: any, _n, p: any) => [v, p?.payload?.name]} /><Bar dataKey="value" fill="#60a5fa" /></BarChart></ResponsiveContainer>
            <p className="text-[10px] text-muted-foreground mt-1">Passe o mouse sobre as barras para ver o nome do contratante.</p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="pb-1"><CardTitle className="text-sm flex items-center gap-1"><Wrench className="h-3 w-3" /> Valor de ART por Ativ./Serviço</CardTitle></CardHeader>
          <CardContent className="h-72 p-2">
            {valorPorAtividade.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Sem valores de ART por atividade.</div>
            ) : (
              <div className="h-full overflow-y-auto pr-2">
                <div style={{ height: Math.max(260, valorPorAtividade.length * 28) }}>
                  <ResponsiveContainer><BarChart data={valorPorAtividade} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}><XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={fmtBRLk} /><YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={220} interval={0} /><Tooltip formatter={(v: any) => fmtBRL(Number(v))} /><Bar dataKey="value" fill="#a78bfa" /></BarChart></ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-elegant lg:col-span-2">
          <CardHeader className="pb-1"><CardTitle className="text-sm flex items-center gap-1"><MapPin className="h-3 w-3" /> Cidades com mais ARTs (top 10)</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer><BarChart data={porCidade} layout="vertical"><XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} /><YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} /><Tooltip /><Bar dataKey="value" fill="#fbbf24" /></BarChart></ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
