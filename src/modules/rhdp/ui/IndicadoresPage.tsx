import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, Users, TrendingDown, Clock, Calendar, AlertTriangle,
  UserCheck, UserX, Briefcase, FileText,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useHrdpCompany } from "../hooks/useHrdpCompany";

const sb: any = supabase;

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))", "#f59e0b", "#ef4444", "#10b981"];

type Employee = { id: string; nome: string; status: string | null; cargo: string | null; setor: string | null; data_admissao: string | null; data_demissao: string | null };
type Vacation = { id: string; employee_id: string; status: string; data_inicio: string | null; data_fim: string | null; data_limite_concessao: string | null };
type Overtime = { id: string; data: string | null; horas: number | null; status: string };
type TimeBank = { employee_id: string; saldo_horas: number };
type Request = { id: string; status: string; tipo: string; created_at: string; prazo_sla: string | null };
type Closing = { competencia: string; total_liquido: number; qtd_colaboradores: number };

function monthLabel(comp: string) {
  const [y, m] = comp.split("-");
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${meses[Number(m) - 1] ?? ""}/${y.slice(2)}`;
}
function monthsBack(n: number) {
  const out: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export default function IndicadoresPage() {
  const { companyId, ready } = useHrdpCompany();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [overtimes, setOvertimes] = useState<Overtime[]>([]);
  const [timeBanks, setTimeBanks] = useState<TimeBank[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [closings, setClosings] = useState<Closing[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!companyId) return;
    setLoading(true);
    const base = (t: string) => sb.from(t).select("*").eq("company_id", companyId).eq("is_deleted", false);
    const results = await Promise.allSettled([
      base("hrdp_employees"),
      base("hrdp_vacations"),
      base("hrdp_overtime_requests"),
      base("hrdp_time_bank"),
      base("hrdp_employee_requests"),
      base("hrdp_payroll_closings"),
    ]);
    const data = results.map((r) => (r.status === "fulfilled" ? (r.value.data ?? []) : []));
    setEmployees(data[0]); setVacations(data[1]); setOvertimes(data[2]);
    setTimeBanks(data[3]); setRequests(data[4]); setClosings(data[5]);
    setLoading(false);
  }
  useEffect(() => { if (ready && companyId) load(); }, [ready, companyId]);

  const k = useMemo(() => {
    const ativos = employees.filter((e) => (e.status ?? "ativo") === "ativo").length;
    const inativos = employees.length - ativos;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const in60 = new Date(today); in60.setDate(in60.getDate() + 60);

    const ferVencendo = vacations.filter((v) => {
      if (!v.data_limite_concessao) return false;
      const d = new Date(v.data_limite_concessao);
      return d >= today && d <= in60 && v.status !== "concluida";
    }).length;
    const ferVencidas = vacations.filter((v) => {
      if (!v.data_limite_concessao) return false;
      return new Date(v.data_limite_concessao) < today && v.status !== "concluida";
    }).length;

    const heMes = overtimes.filter((o) => {
      if (!o.data) return false;
      const d = new Date(o.data);
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    }).reduce((s, o) => s + Number(o.horas || 0), 0);

    const bhSaldo = timeBanks.reduce((s, t) => s + Number(t.saldo_horas || 0), 0);

    const solAbertas = requests.filter((r) => !["concluida", "recusada"].includes(r.status)).length;
    const slaEstourado = requests.filter((r) => {
      if (!r.prazo_sla) return false;
      return new Date(r.prazo_sla) < new Date() && !["concluida", "recusada"].includes(r.status);
    }).length;

    // Turnover últimos 12 meses (demissões / média ativos)
    const back12 = monthsBack(12);
    const demissoes12 = employees.filter((e) => {
      if (!e.data_demissao) return false;
      const c = e.data_demissao.slice(0, 7);
      return back12.includes(c);
    }).length;
    const turnover = ativos > 0 ? ((demissoes12 / ativos) * 100) : 0;

    return { ativos, inativos, ferVencendo, ferVencidas, heMes, bhSaldo, solAbertas, slaEstourado, turnover, demissoes12 };
  }, [employees, vacations, overtimes, timeBanks, requests]);

  // Séries
  const serieAdmDem = useMemo(() => {
    const meses = monthsBack(12);
    return meses.map((c) => {
      const adm = employees.filter((e) => e.data_admissao?.slice(0, 7) === c).length;
      const dem = employees.filter((e) => e.data_demissao?.slice(0, 7) === c).length;
      return { mes: monthLabel(c), admissoes: adm, demissoes: dem };
    });
  }, [employees]);

  const serieHE = useMemo(() => {
    const meses = monthsBack(6);
    return meses.map((c) => {
      const horas = overtimes.filter((o) => o.data?.slice(0, 7) === c).reduce((s, o) => s + Number(o.horas || 0), 0);
      return { mes: monthLabel(c), horas: Math.round(horas * 10) / 10 };
    });
  }, [overtimes]);

  const serieFolha = useMemo(() => {
    return [...closings].sort((a, b) => a.competencia.localeCompare(b.competencia)).slice(-6).map((c) => ({
      mes: monthLabel(c.competencia), liquido: Number(c.total_liquido || 0), colab: c.qtd_colaboradores,
    }));
  }, [closings]);

  const distSetor = useMemo(() => {
    const map = new Map<string, number>();
    employees.filter((e) => (e.status ?? "ativo") === "ativo").forEach((e) => {
      const s = e.setor || "—";
      map.set(s, (map.get(s) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [employees]);

  const distSolicitacoes = useMemo(() => {
    const map = new Map<string, number>();
    requests.forEach((r) => map.set(r.tipo, (map.get(r.tipo) ?? 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [requests]);

  if (!ready) return <div className="p-4 text-sm text-muted-foreground">Carregando…</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> Indicadores RH/DP
        </h1>
        <p className="text-sm text-muted-foreground">
          Painel agregado (somente leitura). Dados consolidados a partir de colaboradores, ponto, férias, solicitações e folha.
        </p>
      </div>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-3 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <strong>Indicadores estimados.</strong> Cálculos auxiliares baseados nos dados internos. Para indicadores oficiais
            (eSocial, FGTS, INSS) consulte a contabilidade.
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={<Users className="w-4 h-4" />} label="Colaboradores ativos" value={String(k.ativos)} hint={`${k.inativos} inativos`} />
        <Kpi icon={<TrendingDown className="w-4 h-4" />} label="Turnover (12m)" value={`${k.turnover.toFixed(1)}%`} hint={`${k.demissoes12} demissões`} />
        <Kpi icon={<Calendar className="w-4 h-4" />} label="Férias vencendo" value={String(k.ferVencendo)} hint={`${k.ferVencidas} vencidas`} variant={k.ferVencidas > 0 ? "danger" : "default"} />
        <Kpi icon={<Clock className="w-4 h-4" />} label="HE no mês" value={`${k.heMes.toFixed(1)}h`} hint={`Banco: ${k.bhSaldo.toFixed(1)}h`} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={<FileText className="w-4 h-4" />} label="Solicitações abertas" value={String(k.solAbertas)} />
        <Kpi icon={<AlertTriangle className="w-4 h-4" />} label="SLA estourado" value={String(k.slaEstourado)} variant={k.slaEstourado > 0 ? "danger" : "default"} />
        <Kpi icon={<UserCheck className="w-4 h-4" />} label="Admissões (12m)" value={String(serieAdmDem.reduce((s, x) => s + x.admissoes, 0))} />
        <Kpi icon={<UserX className="w-4 h-4" />} label="Demissões (12m)" value={String(k.demissoes12)} />
      </div>

      <Tabs defaultValue="movimentacao">
        <TabsList>
          <TabsTrigger value="movimentacao">Movimentação</TabsTrigger>
          <TabsTrigger value="jornada">Jornada</TabsTrigger>
          <TabsTrigger value="folha">Folha</TabsTrigger>
          <TabsTrigger value="distribuicao">Distribuição</TabsTrigger>
        </TabsList>

        <TabsContent value="movimentacao" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Admissões × Demissões (12 meses)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={serieAdmDem}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="mes" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="admissoes" fill="hsl(var(--primary))" name="Admissões" />
                    <Bar dataKey="demissoes" fill="#ef4444" name="Demissões" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jornada" className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card>
            <CardHeader><CardTitle className="text-base">Hora extra (6 meses)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={serieHE}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="mes" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="horas" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Banco de horas — top colaboradores</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {timeBanks.length === 0 && <p className="text-sm text-muted-foreground">Sem dados de banco de horas.</p>}
                {[...timeBanks]
                  .sort((a, b) => Math.abs(Number(b.saldo_horas)) - Math.abs(Number(a.saldo_horas)))
                  .slice(0, 8)
                  .map((t) => {
                    const emp = employees.find((e) => e.id === t.employee_id);
                    const saldo = Number(t.saldo_horas || 0);
                    return (
                      <div key={t.employee_id} className="flex items-center justify-between text-sm border-b pb-1">
                        <span>{emp?.nome ?? "—"}</span>
                        <Badge variant={saldo < 0 ? "destructive" : "default"}>{saldo.toFixed(1)}h</Badge>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="folha" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Líquido da folha (6 meses)</CardTitle></CardHeader>
            <CardContent>
              {serieFolha.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum fechamento de folha registrado ainda.</p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer>
                    <BarChart data={serieFolha}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="mes" fontSize={11} />
                      <YAxis fontSize={11} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any) => `R$ ${Number(v).toLocaleString("pt-BR")}`} />
                      <Bar dataKey="liquido" fill="hsl(var(--primary))" name="Líquido" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribuicao" className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Briefcase className="w-4 h-4" /> Por setor</CardTitle></CardHeader>
            <CardContent>
              {distSetor.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={distSetor} dataKey="value" nameKey="name" outerRadius={90} label>
                        {distSetor.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Solicitações por tipo</CardTitle></CardHeader>
            <CardContent>
              {distSolicitacoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem solicitações registradas.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer>
                    <BarChart data={distSolicitacoes} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis type="number" fontSize={11} />
                      <YAxis type="category" dataKey="name" fontSize={11} width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ icon, label, value, hint, variant }: { icon: React.ReactNode; label: string; value: string; hint?: string; variant?: "default" | "danger" }) {
  return (
    <Card className={variant === "danger" ? "border-destructive/40" : ""}>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground flex items-center gap-1">{icon}{label}</div>
        <div className={`text-xl font-bold mt-1 ${variant === "danger" ? "text-destructive" : ""}`}>{value}</div>
        {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
      </CardContent>
    </Card>
  );
}
