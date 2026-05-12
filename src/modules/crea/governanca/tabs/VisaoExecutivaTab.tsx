import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { GovFilters } from "../lib/govTypes";
import { fetchGovUnified, unifiedKpis, groupCount, groupSum, GovUnifiedRow } from "../lib/govUnified";
import { useGovCompany } from "../lib/useGovCompany";
import { FileBarChart, DollarSign, MapPin, Users, Building2, CheckCircle2, FileText, Wrench } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";

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

function KpiList({
  label, value, icon: Icon, items,
}: { label: string; value: string; icon: any; items: { name: string; value: number }[] }) {
  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <Card className="card-elegant cursor-help">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="rounded-md bg-primary/15 text-primary p-2"><Icon className="h-4 w-4" /></div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="text-lg font-semibold truncate">{value}</p>
              <p className="text-[10px] text-muted-foreground">Passe o mouse para detalhar</p>
            </div>
          </CardContent>
        </Card>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-0" align="start" side="bottom">
        <div className="px-3 py-2 border-b bg-muted/40">
          <p className="text-xs font-semibold">{label} <span className="text-muted-foreground">· {items.length}</span></p>
        </div>
        <ScrollArea className="h-64">
          {items.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground">Nenhum item.</p>
          ) : (
            <ul className="divide-y">
              {items.map((it, i) => (
                <li key={i} className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs hover:bg-accent/40">
                  <span className="truncate" title={it.name}>{it.name || "—"}</span>
                  <span className="text-muted-foreground tabular-nums shrink-0">{it.value}</span>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </HoverCardContent>
    </HoverCard>
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
  // Listas completas para os pop-ups dos KPIs auxiliares
  const ufsList = useMemo(() => rows ? groupCount(rows, (r) => r.uf) : [], [rows]);
  const cidadesList = useMemo(() => rows ? groupCount(rows, (r) => r.cidade) : [], [rows]);
  const rtsList = useMemo(() => rows ? groupCount(rows, (r) => r.rt_nome) : [], [rows]);
  const contratantesList = useMemo(() => rows ? groupCount(rows, (r) => r.contratante) : [], [rows]);
  const porFonte = useMemo(() => rows ? groupCount(rows, (r) => ({ servicos: "Serviços", art_bloco: "ART por Bloco", relatorio_crea: "Relatórios CREA" }[r.source])) : [], [rows]);

  const porContratante = useMemo(() => rows ? groupCount(rows, (r) => r.contratante).slice(0, 10) : [], [rows]);
  const valorPorAtividade = useMemo(() => rows ? groupSum(rows, (r) => r.atividade_servico, (r) => r.valor_art ?? 0).filter(x => x.value > 0).sort((a,b) => b.value - a.value) : [], [rows]);
  const porCidade = useMemo(() => rows ? groupCount(rows, (r) => r.cidade).slice(0, 10) : [], [rows]);
  const custoArtPorUF = useMemo(
    () => rows ? groupSum(rows, (r) => r.uf, (r) => r.valor_art ?? 0).filter(x => x.value > 0).sort((a,b) => b.value - a.value).slice(0, 15) : [],
    [rows]
  );

  // Distribuição de valores pagos por ART (ex.: 285, 108, etc.)
  const distribValorPago = useMemo(() => {
    if (!rows) return [];
    const map = new Map<string, number>();
    for (const r of rows) {
      const v = r.valor_pago;
      if (v == null || !isFinite(v) || v <= 0) continue;
      const key = (Math.round(v * 100) / 100).toFixed(2);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([k, value]) => ({ name: fmtBRL(Number(k)), valorNum: Number(k), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
  }, [rows]);

  // Economia anual estimada se todas as ARTs custassem R$ 108
  const economiaSe108 = useMemo(() => {
    if (!rows) return { atual: 0, projetado: 0, economia: 0, qtd: 0, porAno: [] as { name: string; atual: number; projetado: number; economia: number }[] };
    const ALVO = 108;
    let atual = 0, qtd = 0;
    const byYear = new Map<string, { atual: number; qtd: number }>();
    for (const r of rows) {
      const v = r.valor_pago;
      if (v == null || !isFinite(v) || v <= 0) continue;
      atual += v; qtd += 1;
      const ano = r.data?.slice(0, 4) || "—";
      const cur = byYear.get(ano) ?? { atual: 0, qtd: 0 };
      cur.atual += v; cur.qtd += 1;
      byYear.set(ano, cur);
    }
    const projetado = qtd * ALVO;
    const porAno = Array.from(byYear.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([ano, x]) => ({ name: ano, atual: x.atual, projetado: x.qtd * ALVO, economia: Math.max(0, x.atual - x.qtd * ALVO) }));
    return { atual, projetado, economia: Math.max(0, atual - projetado), qtd, porAno };
  }, [rows]);

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

      {/* KPIs auxiliares — passe o mouse para ver a lista detalhada */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <KpiList label="UFs distintas"     value={String(k!.ufs)}          icon={MapPin}     items={ufsList} />
        <KpiList label="Cidades distintas" value={String(k!.cidades)}      icon={MapPin}     items={cidadesList} />
        <KpiList label="RTs distintos"     value={String(k!.rts)}          icon={Users}      items={rtsList} />
        <KpiList label="Contratantes"      value={String(k!.contratantes)} icon={Building2}  items={contratantesList} />
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
          <CardHeader className="pb-1"><CardTitle className="text-sm">Maior demanda x Região</CardTitle></CardHeader>
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
        <Card className="card-elegant lg:col-span-2">
          <CardHeader className="pb-1"><CardTitle className="text-sm flex items-center gap-1"><MapPin className="h-3 w-3" /> Cidades com mais ARTs (top 10)</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer><BarChart data={porCidade} layout="vertical"><XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} /><YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} /><Tooltip /><Bar dataKey="value" fill="#fbbf24" /></BarChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="card-elegant lg:col-span-2">
          <CardHeader className="pb-1"><CardTitle className="text-sm flex items-center gap-1"><DollarSign className="h-3 w-3" /> Custo de ART por UF (R$)</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer><BarChart data={custoArtPorUF} layout="vertical" margin={{ left: 8, right: 8 }}><XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={fmtBRLk} /><YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={50} /><Tooltip formatter={(v: any) => fmtBRL(Number(v))} /><Bar dataKey="value" fill="#a78bfa" name="Custo ART" /></BarChart></ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm flex items-center gap-1"><DollarSign className="h-3 w-3" /> Quantidade de ARTs por valor pago</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <BarChart data={distribValorPago} margin={{ left: 8, right: 8, bottom: 30 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" interval={0} height={50} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip formatter={(v: any) => [`${v} ARTs`, "Quantidade"]} />
                <Bar dataKey="value" fill="#60a5fa" name="ARTs" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-muted-foreground mt-1">Conta quantas ARTs foram pagas em cada valor (R$ 285, R$ 108, etc.).</p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm flex items-center gap-1"><DollarSign className="h-3 w-3" /> Economia se todas as ARTs custassem R$ 108</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="rounded-md border p-2">
                <p className="text-[10px] uppercase text-muted-foreground">Pago atual</p>
                <p className="text-sm font-semibold">{fmtBRL(economiaSe108.atual)}</p>
              </div>
              <div className="rounded-md border p-2">
                <p className="text-[10px] uppercase text-muted-foreground">Projetado a R$108</p>
                <p className="text-sm font-semibold">{fmtBRL(economiaSe108.projetado)}</p>
              </div>
              <div className="rounded-md border p-2 bg-emerald-500/10">
                <p className="text-[10px] uppercase text-muted-foreground">Economia</p>
                <p className="text-sm font-semibold text-emerald-600">{fmtBRL(economiaSe108.economia)}</p>
              </div>
            </div>
            <ResponsiveContainer height={170}>
              <BarChart data={economiaSe108.porAno} margin={{ left: 8, right: 8 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtBRLk} />
                <Tooltip formatter={(v: any) => fmtBRL(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="atual" fill="#f87171" name="Pago atual" />
                <Bar dataKey="projetado" fill="#34d399" name="A R$108" />
                <Bar dataKey="economia" fill="#a78bfa" name="Economia" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
