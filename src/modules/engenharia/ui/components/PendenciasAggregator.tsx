import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Inbox, ExternalLink } from "lucide-react";

interface Pend {
  id: string;
  modulo: string;
  titulo: string;
  responsavel: string;
  prazo?: string | null;
  status: string;
  to: string;
}

const FINALIZADOS = new Set([
  "concluida", "concluído", "concluido", "fechada", "cancelada",
  "entregue", "ligada", "rejeitada", "respondida", "paga", "emitida",
]);
const isFinal = (s?: string | null) => !!s && FINALIZADOS.has(String(s).toLowerCase().trim());

interface QueryDef {
  table: string;
  modulo: string;
  to: string;
  titulo: (r: any) => string;
  responsavel: (r: any) => string;
  prazo?: (r: any) => string | null;
  status?: (r: any) => string;
}

const SOURCES: QueryDef[] = [
  { table: "eng_atividades", modulo: "Atividades", to: "/app/engenharia/atividades",
    titulo: (r) => r.titulo ?? "Atividade",
    responsavel: (r) => r.responsavel ?? "—",
    prazo: (r) => r.prazo, status: (r) => r.status },
  { table: "eng_demandas", modulo: "Demandas", to: "/app/engenharia/demandas",
    titulo: (r) => r.titulo ?? "Demanda",
    responsavel: (r) => r.responsavel ?? "—",
    prazo: (r) => r.prazo, status: (r) => r.status },
  { table: "eng_pendencias", modulo: "Pendências", to: "/app/engenharia/pendencias",
    titulo: (r) => r.titulo ?? "Pendência",
    responsavel: (r) => r.responsavel ?? "—",
    prazo: (r) => r.prazo, status: (r) => r.status },
  { table: "eng_rfi", modulo: "RFI", to: "/app/engenharia/rfi",
    titulo: (r) => `${r.numero ?? "RFI"} ${r.assunto ?? ""}`.trim(),
    responsavel: (r) => r.data?.responsavel ?? "—",
    prazo: (r) => r.prazo, status: (r) => r.status },
  { table: "eng_ligacoes_energia", modulo: "Energia", to: "/app/engenharia/energia",
    titulo: (r) => `${r.protocolo ?? "Energia"} ${r.concessionaria ?? ""}`.trim(),
    responsavel: (r) => r.data?.responsavel ?? "—",
    prazo: (r) => r.data_solicitacao, status: (r) => r.status },
  { table: "eng_art", modulo: "ART", to: "/app/engenharia/art",
    titulo: (r) => `ART ${r.numero ?? r.id?.slice(0, 6)}`,
    responsavel: (r) => r.responsavel_tecnico ?? "—",
    prazo: (r) => r.data_emissao, status: (r) => r.status },
  { table: "eng_projetos_elaboracao", modulo: "Projetos", to: "/app/engenharia/projetos",
    titulo: (r) => `${r.site ?? r.cliente ?? "Projeto"}`,
    responsavel: (r) => r.projetista ?? r.responsavel_solicitante ?? "—",
    prazo: (r) => r.prazo_conclusao, status: (r) => r.status },
  { table: "eng_gov_action_plan", modulo: "Governança", to: "/app/engenharia/governanca",
    titulo: (r) => String(r.acao ?? "Ação").slice(0, 60),
    responsavel: (r) => r.responsavel ?? "—",
    prazo: (r) => r.prazo, status: (r) => r.status },
];

export function PendenciasAggregator() {
  const [items, setItems] = useState<Pend[]>([]);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const out: Pend[] = [];
      const results = await Promise.all(
        SOURCES.map((s) => supabase.from(s.table as any).select("*").limit(300)),
      );
      results.forEach((res, i) => {
        const src = SOURCES[i];
        for (const r of (res.data ?? []) as any[]) {
          const status = src.status?.(r);
          if (isFinal(status)) continue;
          out.push({
            id: `${src.table}-${r.id}`,
            modulo: src.modulo,
            titulo: src.titulo(r),
            responsavel: src.responsavel(r),
            prazo: src.prazo?.(r) ?? null,
            status: String(status ?? "—"),
            to: src.to,
          });
        }
      });
      if (alive) setItems(out);
    };
    load();
    const t = setInterval(load, 90_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const filtered = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      i.titulo.toLowerCase().includes(q) ||
      i.responsavel.toLowerCase().includes(q) ||
      i.modulo.toLowerCase().includes(q) ||
      i.status.toLowerCase().includes(q),
    );
  }, [items, filtro]);

  const grouped = useMemo(() => {
    const m = new Map<string, Pend[]>();
    for (const it of filtered) {
      const k = it.responsavel || "—";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(it);
    }
    return Array.from(m.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  return (
    <Card className="mb-4 border-primary/30 card-elegant">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-display">
          <Inbox className="h-4 w-4" /> Pendências por responsável
          <Badge variant="outline" className="text-[10px]">{filtered.length} item(ns)</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          placeholder="Filtrar por nome, módulo, status…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="mb-2 h-8 text-sm"
        />
        <ScrollArea className="max-h-[360px]">
          {grouped.length === 0 ? (
            <div className="text-xs text-muted-foreground py-4 text-center">Nada pendente ✨</div>
          ) : (
            <div className="space-y-3">
              {grouped.map(([resp, list]) => (
                <div key={resp} className="border rounded-md p-2">
                  <div className="font-semibold text-sm flex items-center gap-2 mb-1">
                    {resp}
                    <Badge variant="secondary" className="text-[10px]">{list.length}</Badge>
                  </div>
                  <ul className="space-y-1">
                    {list.slice(0, 8).map((p) => (
                      <li key={p.id} className="text-xs flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{p.modulo}</Badge>
                        <span className="flex-1 truncate">{p.titulo}</span>
                        {p.prazo && <span className="text-muted-foreground">{String(p.prazo).slice(0, 10)}</span>}
                        <Badge variant="secondary" className="text-[9px]">{p.status}</Badge>
                        <Link to={p.to} className="text-primary hover:underline inline-flex items-center">
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </li>
                    ))}
                    {list.length > 8 && (
                      <li className="text-[10px] text-muted-foreground">+ {list.length - 8} pendência(s)…</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
