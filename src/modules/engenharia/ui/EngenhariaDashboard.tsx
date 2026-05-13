import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KpiCard, KpiGrid } from "./components/KpiCard";
import { EngPageHeader } from "./components/EngPageHeader";
import { StatusBadge } from "./components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MapPin, FileQuestion, AlertTriangle, Users, Activity, ListTodo, ShoppingCart,
  FolderKanban, Cable, Zap,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { useEngDemoMode } from "../demo/useEngDemoMode";
import {
  DEMO_COUNTS, DEMO_RFI_RECENTES, DEMO_PEND_RECENTES,
  DEMO_ATIVIDADES_BY_STATUS, DEMO_PEND_BY_MONTH, DEMO_SITES_BY_UF,
} from "../demo/engDemoFixtures";

type Counts = {
  sites: number; rfiAbertos: number; pendCriticas: number; equipes: number;
  projetos: number; atividadesAndamento: number; suprimentosAbertos: number;
  fibraEmExec: number; energiaSolicitada: number;
};

const initial: Counts = {
  sites: 0, rfiAbertos: 0, pendCriticas: 0, equipes: 0, projetos: 0,
  atividadesAndamento: 0, suprimentosAbertos: 0, fibraEmExec: 0, energiaSolicitada: 0,
};

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--warn))",
  "hsl(var(--success))",
  "hsl(var(--destructive))",
  "hsl(217 19% 40%)",
];

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 6,
  fontSize: 12,
};

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const lastNMonths = (n: number) => {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: monthKey(d), label: d.toLocaleDateString("pt-BR", { month: "short" }) });
  }
  return out;
};

const EngenhariaDashboard = () => {
  const { enabled: isDemo } = useEngDemoMode();
  const [counts, setCounts] = useState<Counts>(initial);
  const [recentRfi, setRecentRfi] = useState<any[]>([]);
  const [recentPend, setRecentPend] = useState<any[]>([]);
  const [atividadesByStatus, setAtividadesByStatus] = useState<{ name: string; value: number }[]>([]);
  const [pendByMonth, setPendByMonth] = useState<{ label: string; abertas: number; concluidas: number }[]>([]);
  const [sitesByUf, setSitesByUf] = useState<{ name: string; total: number }[]>([]);

  useEffect(() => {
    if (isDemo) {
      setCounts(DEMO_COUNTS);
      setRecentRfi(DEMO_RFI_RECENTES);
      setRecentPend(DEMO_PEND_RECENTES);
      setAtividadesByStatus(DEMO_ATIVIDADES_BY_STATUS);
      setPendByMonth(DEMO_PEND_BY_MONTH);
      setSitesByUf(DEMO_SITES_BY_UF);
      return;
    }
    (async () => {
      const head = (q: any) => q.select("*", { count: "exact", head: true });
      const [
        sites, rfi, pend, eq, proj, ativ, sup, fibra, energ,
        rfiList, pendList, ativAll, pendAll, sitesAll,
      ] = await Promise.all([
        head(supabase.from("eng_sites")),
        supabase.from("eng_rfi").select("*", { count: "exact", head: true }).eq("status", "aberta"),
        supabase.from("eng_pendencias").select("*", { count: "exact", head: true }).eq("prioridade", "alta"),
        head(supabase.from("eng_equipes")),
        head(supabase.from("eng_projetos_elaboracao")),
        supabase.from("eng_atividades").select("*", { count: "exact", head: true }).eq("status", "em_andamento"),
        supabase.from("eng_suprimentos").select("*", { count: "exact", head: true }).eq("status", "aberta"),
        supabase.from("eng_fibra_obras").select("*", { count: "exact", head: true }).eq("status", "em_execucao"),
        supabase.from("eng_ligacoes_energia").select("*", { count: "exact", head: true }).eq("status", "solicitada"),
        supabase.from("eng_rfi").select("id, numero, assunto, status, prazo").order("created_at", { ascending: false }).limit(6),
        supabase.from("eng_pendencias").select("id, titulo, prioridade, status, prazo").order("created_at", { ascending: false }).limit(6),
        supabase.from("eng_atividades").select("status").limit(1000),
        supabase.from("eng_pendencias").select("status, created_at").limit(1000),
        supabase.from("eng_sites").select("uf").limit(1000),
      ]);

      setCounts({
        sites: sites.count ?? 0,
        rfiAbertos: rfi.count ?? 0,
        pendCriticas: pend.count ?? 0,
        equipes: eq.count ?? 0,
        projetos: proj.count ?? 0,
        atividadesAndamento: ativ.count ?? 0,
        suprimentosAbertos: sup.count ?? 0,
        fibraEmExec: fibra.count ?? 0,
        energiaSolicitada: energ.count ?? 0,
      });
      setRecentRfi(rfiList.data ?? []);
      setRecentPend(pendList.data ?? []);

      // Aggregations
      const ativMap = new Map<string, number>();
      (ativAll.data ?? []).forEach((r: any) => {
        const k = (r.status ?? "—").replace(/_/g, " ");
        ativMap.set(k, (ativMap.get(k) ?? 0) + 1);
      });
      setAtividadesByStatus(Array.from(ativMap, ([name, value]) => ({ name, value })));

      const months = lastNMonths(6);
      const monthData = months.map((m) => ({ label: m.label, abertas: 0, concluidas: 0, key: m.key }));
      (pendAll.data ?? []).forEach((r: any) => {
        if (!r.created_at) return;
        const k = monthKey(new Date(r.created_at));
        const slot = monthData.find((x) => x.key === k);
        if (!slot) return;
        if (String(r.status) === "concluida") slot.concluidas += 1;
        else slot.abertas += 1;
      });
      setPendByMonth(monthData.map(({ key, ...rest }) => rest));

      const ufMap = new Map<string, number>();
      (sitesAll.data ?? []).forEach((r: any) => {
        const k = r.uf || "—";
        ufMap.set(k, (ufMap.get(k) ?? 0) + 1);
      });
      setSitesByUf(
        Array.from(ufMap, ([name, total]) => ({ name, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 8)
      );
    })();
  }, []);

  return (
    <div className="space-y-5">
      <EngPageHeader
        title="Visão geral — Engenharia"
        description="Indicadores em tempo real dos módulos operacionais."
      />

      <KpiGrid>
        <KpiCard label="Sites" value={counts.sites} icon={MapPin} tone="teal" />
        <KpiCard label="Projetos" value={counts.projetos} icon={FolderKanban} tone="teal" />
        <KpiCard label="Atividades em andamento" value={counts.atividadesAndamento} icon={Activity} tone="warn" />
        <KpiCard label="RFI em aberto" value={counts.rfiAbertos} icon={FileQuestion} tone="warn" />
        <KpiCard label="Pendências críticas" value={counts.pendCriticas} icon={AlertTriangle} tone="danger" />
      </KpiGrid>

      <KpiGrid>
        <KpiCard label="Equipes" value={counts.equipes} icon={Users} tone="success" />
        <KpiCard label="Suprimentos abertos" value={counts.suprimentosAbertos} icon={ShoppingCart} tone="warn" />
        <KpiCard label="Fibra em execução" value={counts.fibraEmExec} icon={Cable} tone="teal" />
        <KpiCard label="Energia solicitada" value={counts.energiaSolicitada} icon={Zap} tone="warn" />
        <KpiCard label="Demandas" value={"—"} icon={ListTodo} tone="neutral" hint="ver módulo" />
      </KpiGrid>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="card-elegant lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-base">Pendências — últimos 6 meses</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={pendByMonth}>
                <defs>
                  <linearGradient id="gAbertas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--warn))" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="hsl(var(--warn))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gConcl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="abertas" stroke="hsl(var(--warn))" fill="url(#gAbertas)" strokeWidth={2} />
                <Area type="monotone" dataKey="concluidas" stroke="hsl(var(--success))" fill="url(#gConcl)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="font-display text-base">Atividades por status</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 260 }}>
            {atividadesByStatus.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados</div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={atividadesByStatus} dataKey="value" nameKey="name" outerRadius={85} innerRadius={45} paddingAngle={2}>
                    {atividadesByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="font-display text-base">Sites por UF</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 260 }}>
            {sitesByUf.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados</div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={sitesByUf} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" fontSize={11} stroke="hsl(var(--muted-foreground))" width={45} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="card-elegant lg:col-span-2 grid md:grid-cols-2 gap-0">
          <div className="border-r">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-display font-semibold text-base">RFI recentes</h3>
              <FileQuestion className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="divide-y max-h-[220px] overflow-y-auto">
              {recentRfi.length === 0 ? (
                <div className="px-4 py-8 text-center text-muted-foreground text-sm">Sem registros</div>
              ) : recentRfi.map((r) => (
                <div key={r.id} className="px-4 py-2 flex items-center gap-2 text-sm">
                  <span className="font-mono text-xs text-muted-foreground w-12 shrink-0">{r.numero ?? "—"}</span>
                  <span className="flex-1 truncate">{r.assunto ?? "(sem assunto)"}</span>
                  <StatusBadge value={r.status} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-display font-semibold text-base">Pendências em destaque</h3>
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="divide-y max-h-[220px] overflow-y-auto">
              {recentPend.length === 0 ? (
                <div className="px-4 py-8 text-center text-muted-foreground text-sm">Sem registros</div>
              ) : recentPend.map((p) => (
                <div key={p.id} className="px-4 py-2 flex items-center gap-2 text-sm">
                  <span className="flex-1 truncate">{p.titulo}</span>
                  <StatusBadge value={p.prioridade} />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EngenhariaDashboard;
