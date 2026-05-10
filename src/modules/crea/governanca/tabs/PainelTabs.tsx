import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useGovCompany } from "../lib/useGovCompany";
import { fetchArts, GovArt, computeKpis } from "../lib/govApi";
import { GovFilters } from "../lib/govTypes";
import { toast } from "sonner";

interface PanelProps {
  filters: GovFilters;
  groupKey: "empresa_id" | "rt_id" | "contratante_id";
  /** tabela de origem do nome (pode ser null = usa proprio id) */
  lookupTable?: "crea_rts" | "crea_empresas" | "crea_gov_contratantes";
  lookupSelect?: string; // ex: "id,nome"
  title: string;
  description: string;
  entityLabel: string;
}

function GroupPanel({ filters, groupKey, lookupTable, lookupSelect = "id,nome", title, description, entityLabel }: PanelProps) {
  const { companyId } = useGovCompany();
  const [arts, setArts] = useState<GovArt[]>([]);
  const [loading, setLoading] = useState(false);
  const [names, setNames] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    fetchArts(companyId, filters, 5000)
      .then(setArts)
      .catch(e => toast.error(e?.message ?? "Falha"))
      .finally(() => setLoading(false));
  }, [companyId, JSON.stringify(filters)]);

  useEffect(() => {
    if (!companyId || !lookupTable) return;
    (async () => {
      const ids = Array.from(new Set(arts.map(a => (a as any)[groupKey]).filter(Boolean))) as string[];
      if (ids.length === 0) return;
      const { data } = await supabase.from(lookupTable as any).select(lookupSelect).in("id", ids);
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: any) => { map[r.id] = r.nome ?? r.razao_social ?? r.id; });
      setNames(map);
    })();
  }, [arts, companyId, lookupTable, lookupSelect, groupKey]);

  const groups = useMemo(() => {
    const m = new Map<string, GovArt[]>();
    for (const a of arts) {
      const k = ((a as any)[groupKey] ?? "—") as string;
      const arr = m.get(k) ?? [];
      arr.push(a); m.set(k, arr);
    }
    return Array.from(m, ([id, items]) => ({
      id, name: names[id] ?? (id === "—" ? "Sem vínculo" : id.slice(0, 8)),
      kpis: computeKpis(items), items,
    })).sort((a, b) => b.kpis.valor_emitido - a.kpis.valor_emitido);
  }, [arts, names, groupKey]);

  const filtered = useMemo(() => {
    if (!search) return groups;
    const s = search.toLowerCase();
    return groups.filter(g => g.name.toLowerCase().includes(s));
  }, [groups, search]);

  const detail = selected ? groups.find(g => g.id === selected) : null;

  return (
    <div className="space-y-4">
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent>
          <div className="relative mb-3 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder={`Buscar ${entityLabel}...`} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {loading ? (
            <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{entityLabel}</TableHead>
                  <TableHead className="text-right">ARTs</TableHead>
                  <TableHead className="text-right">Vencidas</TableHead>
                  <TableHead className="text-right">Valor emitido</TableHead>
                  <TableHead className="text-right">Valor pago</TableHead>
                  <TableHead className="text-right">Pendente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 200).map(g => (
                  <TableRow key={g.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setSelected(g.id)}>
                    <TableCell className="font-medium text-sm">{g.name}</TableCell>
                    <TableCell className="text-right">{g.kpis.total}</TableCell>
                    <TableCell className="text-right">
                      {g.kpis.vencidas > 0 ? <Badge variant="destructive">{g.kpis.vencidas}</Badge> : g.kpis.vencidas}
                    </TableCell>
                    <TableCell className="text-right text-xs">R$ {g.kpis.valor_emitido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right text-xs">R$ {g.kpis.valor_pago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right text-xs text-warning">R$ {g.kpis.valor_pendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {detail && (
        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Drill-down · {detail.name}</CardTitle>
            <button className="text-xs text-muted-foreground hover:underline" onClick={() => setSelected(null)}>Fechar</button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>UF</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Taxa</TableHead>
                  <TableHead className="text-right">Pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.items.slice(0, 100).map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.numero}</TableCell>
                    <TableCell className="text-xs">{a.uf}</TableCell>
                    <TableCell className="text-xs">{a.status_analise ?? "—"}</TableCell>
                    <TableCell className="text-xs">{a.data_vencimento ?? "—"}</TableCell>
                    <TableCell className="text-right text-xs">R$ {Number(a.valor_taxa ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right text-xs">R$ {Number(a.valor_pago ?? 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {detail.items.length > 100 && <p className="text-xs text-muted-foreground mt-2">100 de {detail.items.length}.</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export const EmpresasPanel = ({ filters }: { filters: GovFilters }) => (
  <GroupPanel filters={filters} groupKey="empresa_id"
    title="Painel por empresa" description="Visão consolidada por empresa."
    entityLabel="empresa" />
);
export const RtsPanel = ({ filters }: { filters: GovFilters }) => (
  <GroupPanel filters={filters} groupKey="rt_id"
    title="Painel por responsável técnico" description="Carga de ARTs por RT."
    entityLabel="RT" />
);
export const ClientesPanel = ({ filters }: { filters: GovFilters }) => (
  <GroupPanel filters={filters} groupKey="contratante_id" lookupTable="crea_gov_contratantes"
    title="Painel por cliente" description="ARTs e custos por contratante."
    entityLabel="cliente" />
);
