/**
 * Dashboard agrega KPIs lendo as colunas numericas/currency dos datasets
 * ativos do módulo + status do plano de ação.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { Database, Layers, ListChecks, AlertCircle } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

export function GovDashboard({ moduleKey }: { moduleKey: string }) {
  const [datasetsCount, setDatasetsCount] = useState(0);
  const [sheetsCount, setSheetsCount] = useState(0);
  const [rowsCount, setRowsCount] = useState(0);
  const [actions, setActions] = useState<Array<{ status: string; prioridade: string }>>([]);
  const [colsByType, setColsByType] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const { data: ds } = await supabase.from("gov_datasets").select("id").eq("module_key", moduleKey).eq("is_active", true);
      const ids = (ds ?? []).map((d) => d.id);
      setDatasetsCount(ids.length);
      if (ids.length === 0) { setSheetsCount(0); setRowsCount(0); setColsByType({}); }
      else {
        const { data: sh } = await supabase.from("gov_dataset_sheets").select("id").in("dataset_id", ids);
        const sids = (sh ?? []).map((s) => s.id);
        setSheetsCount(sids.length);
        if (sids.length > 0) {
          const { count: rc } = await supabase.from("gov_dataset_rows").select("id", { count: "exact", head: true }).in("sheet_id", sids);
          setRowsCount(rc ?? 0);
          const { data: cols } = await supabase.from("gov_dataset_columns").select("data_type").in("sheet_id", sids).eq("ignored", false);
          const m: Record<string, number> = {};
          (cols ?? []).forEach((c: any) => { m[c.data_type] = (m[c.data_type] ?? 0) + 1; });
          setColsByType(m);
        }
      }
      const { data: ap } = await supabase.from("governance_action_plan").select("status,prioridade").eq("module_key", moduleKey);
      setActions((ap ?? []) as Array<{ status: string; prioridade: string }>);
    })();
  }, [moduleKey]);

  const statusData = useMemo(() => {
    const m: Record<string, number> = {};
    actions.forEach((a) => { m[a.status] = (m[a.status] ?? 0) + 1; });
    return Object.entries(m).map(([k, v]) => ({ name: k, value: v }));
  }, [actions]);

  const priorData = useMemo(() => {
    const m: Record<string, number> = {};
    actions.forEach((a) => { m[a.prioridade] = (m[a.prioridade] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [actions]);

  const colsData = useMemo(() => Object.entries(colsByType).map(([name, value]) => ({ name, value })), [colsByType]);

  const Kpi = ({ icon: Icon, label, value, hint }: any) => (
    <Card><CardContent className="p-4 flex items-center gap-3">
      <div className="rounded-md bg-primary/10 p-2"><Icon className="h-5 w-5 text-primary" /></div>
      <div><div className="text-2xl font-bold">{value}</div><div className="text-xs text-muted-foreground">{label}</div>{hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}</div>
    </CardContent></Card>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={Database} label="Planilhas mestres" value={datasetsCount} />
        <Kpi icon={Layers} label="Abas detectadas" value={sheetsCount} />
        <Kpi icon={ListChecks} label="Linhas de dados" value={rowsCount.toLocaleString("pt-BR")} />
        <Kpi icon={AlertCircle} label="Ações em aberto" value={actions.filter((a) => a.status !== "concluida" && a.status !== "cancelada").length} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-3">
          <div className="text-xs font-semibold mb-2">Plano de Ação por status</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={70} label>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent></Card>

        <Card><CardContent className="p-3">
          <div className="text-xs font-semibold mb-2">Prioridade das ações</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorData}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent></Card>

        <Card><CardContent className="p-3">
          <div className="text-xs font-semibold mb-2">Tipos de colunas detectadas</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={colsData}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><Tooltip />
              <Bar dataKey="value" fill="hsl(var(--secondary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent></Card>
      </div>
    </div>
  );
}
