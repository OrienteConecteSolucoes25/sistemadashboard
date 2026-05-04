import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KpiCard, KpiGrid } from "./components/KpiCard";
import { EngPageHeader } from "./components/EngPageHeader";
import { StatusBadge } from "./components/StatusBadge";
import { Card } from "@/components/ui/card";
import { MapPin, FileQuestion, AlertTriangle, Users, Activity, ListTodo, ShoppingCart, FolderKanban, Cable, Zap } from "lucide-react";

type Counts = {
  sites: number;
  rfiAbertos: number;
  pendCriticas: number;
  equipes: number;
  projetos: number;
  atividadesAndamento: number;
  suprimentosAbertos: number;
  fibraEmExec: number;
  energiaSolicitada: number;
};

const initial: Counts = {
  sites: 0, rfiAbertos: 0, pendCriticas: 0, equipes: 0, projetos: 0,
  atividadesAndamento: 0, suprimentosAbertos: 0, fibraEmExec: 0, energiaSolicitada: 0,
};

const EngenhariaDashboard = () => {
  const [counts, setCounts] = useState<Counts>(initial);
  const [recentRfi, setRecentRfi] = useState<any[]>([]);
  const [recentPend, setRecentPend] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const head = (q: any) => q.select("*", { count: "exact", head: true });
      const [sites, rfi, pend, eq, proj, ativ, sup, fibra, energ, rfiList, pendList] = await Promise.all([
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="card-elegant">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-display font-semibold text-base">RFI recentes</h3>
            <FileQuestion className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="divide-y">
            {recentRfi.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">Sem registros</div>
            ) : recentRfi.map((r) => (
              <div key={r.id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                <span className="font-mono text-xs text-muted-foreground w-16 shrink-0">{r.numero ?? "—"}</span>
                <span className="flex-1 truncate">{r.assunto ?? "(sem assunto)"}</span>
                <StatusBadge value={r.status} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="card-elegant">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-display font-semibold text-base">Pendências em destaque</h3>
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="divide-y">
            {recentPend.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">Sem registros</div>
            ) : recentPend.map((p) => (
              <div key={p.id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                <span className="flex-1 truncate">{p.titulo}</span>
                <StatusBadge value={p.prioridade} />
                <StatusBadge value={p.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EngenhariaDashboard;
