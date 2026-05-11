import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GovFilters } from "../lib/govTypes";
import { useGovCompany } from "../lib/useGovCompany";
import { fetchArts, fetchPagamentos, computeKpis, sumBy, GovArt, GovPagamento } from "../lib/govApi";
import { deriveStatusFinanceiroArt } from "../lib/govNormalize";

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))", "hsl(var(--destructive))"];

function KpiCard({ icon: Icon, label, value, hint, tone }: { icon: any; label: string; value: string; hint?: string; tone?: "default" | "good" | "warn" | "bad" }) {
  const toneCls = tone === "good" ? "text-emerald-500" : tone === "warn" ? "text-amber-500" : tone === "bad" ? "text-destructive" : "text-primary";
  return (
    <Card className="card-elegant">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <Icon className={`h-4 w-4 ${toneCls}`} />
        </div>
        <p className={`text-xl font-bold mt-1 ${toneCls}`}>{value}</p>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function FinanceiraTab({ filters }: { filters: GovFilters }) {
  const { companyId: company } = useGovCompany();
  const [arts, setArts] = useState<GovArt[]>([]);
  const [pags, setPags] = useState<GovPagamento[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!company) return;
    setLoading(true);
    Promise.all([fetchArts(company, filters, 5000), fetchPagamentos(company)])
      .then(([a, p]) => { setArts(a); setPags(p); })
      .finally(() => setLoading(false));
  }, [company, filters]);

  const k = useMemo(() => computeKpis(arts), [arts]);

  const totalPagamentos = pags.reduce((s, p) => s + (Number(p.valor) || 0), 0);
  const conciliados = pags.filter((p) => !!p.conciliado_art_id).length;
  const semPar = pags.filter((p) => !p.conciliado_art_id).length;

  // Por mês (pago x emitido)
  const porMes = useMemo(() => {
    const m = new Map<string, { mes: string; emitido: number; pago: number }>();
    for (const a of arts) {
      const d = a.data_cadastro?.slice(0, 7) ?? "—";
      const cur = m.get(d) ?? { mes: d, emitido: 0, pago: 0 };
      cur.emitido += Number(a.valor_taxa || 0);
      cur.pago += Number(a.valor_pago || 0);
      m.set(d, cur);
    }
    return Array.from(m.values()).sort((a, b) => a.mes.localeCompare(b.mes)).slice(-12);
  }, [arts]);

  const porUf = useMemo(() => sumBy(arts, (a) => a.uf || "—", (a) => Number(a.valor_taxa || 0)).slice(0, 10), [arts]);

  const statusFinanceiro = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of arts) {
      const s = a.status_financeiro || (a.data_pagamento ? "Pago" : "Pendente");
      m.set(s, (m.get(s) ?? 0) + 1);
    }
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [arts]);

  if (!company) return <Card className="card-elegant"><CardContent className="p-8 text-center text-muted-foreground">Selecione uma empresa.</CardContent></Card>;
  if (loading) return <div className="flex items-center justify-center p-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" />Carregando…</div>;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <KpiCard icon={DollarSign} label="Emitido (taxa CREA)" value={fmtBRL(k.valor_emitido)} hint={`${arts.length} ARTs`} />
        <KpiCard icon={CheckCircle2} label="Pago" value={fmtBRL(k.valor_pago)} tone="good" />
        <KpiCard icon={Clock} label="Pendente" value={fmtBRL(k.valor_pendente)} tone="warn" hint={`${k.aguardando_pgto} aguardando`} />
        <KpiCard icon={AlertCircle} label="Vencido" value={String(k.vencidas)} tone="bad" hint="ARTs com vencimento ultrapassado" />
        <KpiCard icon={DollarSign} label="Contratos (faturamento)" value={fmtBRL(k.valor_contratos)} hint={`Ticket médio ${fmtBRL(k.ticket_medio_contrato)}`} />
        <KpiCard icon={DollarSign} label="Ticket médio taxa" value={fmtBRL(k.ticket_medio_taxa)} />
        <KpiCard icon={DollarSign} label="Pagamentos importados" value={fmtBRL(totalPagamentos)} hint={`${pags.length} boletos`} />
        <KpiCard icon={CheckCircle2} label="Boletos conciliados" value={`${conciliados} / ${pags.length}`} tone="good" hint={`${semPar} sem par`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="card-elegant">
          <CardHeader><CardTitle className="text-sm">Emitido × Pago (últimos meses)</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <BarChart data={porMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : `${v}`} />
                <Tooltip formatter={(v: any) => fmtBRL(Number(v))} />
                <Legend />
                <Bar dataKey="emitido" fill="hsl(var(--primary))" name="Emitido" />
                <Bar dataKey="pago" fill="hsl(var(--secondary))" name="Pago" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader><CardTitle className="text-sm">Custo por UF (top 10)</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <BarChart data={porUf} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : `${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={50} />
                <Tooltip formatter={(v: any) => fmtBRL(Number(v))} />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader><CardTitle className="text-sm">Distribuição por status financeiro</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusFinanceiro} dataKey="value" nameKey="name" outerRadius={90} label>
                  {statusFinanceiro.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader><CardTitle className="text-sm">Últimos pagamentos importados</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="max-h-72 overflow-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Boleto</TableHead><TableHead>Sacado</TableHead><TableHead>Pagto</TableHead>
                  <TableHead className="text-right">Valor</TableHead><TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {pags.slice(0, 30).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.numero_boleto || "—"}</TableCell>
                      <TableCell className="text-xs">{p.sacado || "—"}</TableCell>
                      <TableCell className="text-xs">{p.data_pagamento || "—"}</TableCell>
                      <TableCell className="text-right text-xs font-semibold">{fmtBRL(Number(p.valor || 0))}</TableCell>
                      <TableCell>
                        <Badge variant={p.conciliado_art_id ? "default" : "outline"} className="text-[10px]">
                          {p.conciliado_art_id ? "conciliado" : p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pags.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Nenhum pagamento importado.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
