import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ShieldCheck, Play, AlertTriangle, BellPlus } from "lucide-react";
import { toast } from "sonner";
import { useGovCompany } from "../lib/useGovCompany";
import { fetchArts, fetchPagamentos, upsertAlerta } from "../lib/govApi";
import { GOV_RULES, runRules, RuleHit, RuleId, SEVERITY_COLOR, SEVERITY_LABEL } from "../lib/govRules";
import { GovFilters } from "../lib/govTypes";

export function AuditoriaTab({ filters }: { filters: GovFilters }) {
  const { companyId } = useGovCompany();
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<RuleHit[]>([]);
  const [selectedRules, setSelectedRules] = useState<RuleId[]>(GOV_RULES.map(r => r.id));
  const [creating, setCreating] = useState(false);

  async function runScan() {
    if (!companyId) return;
    setLoading(true);
    try {
      const [arts, pagamentos] = await Promise.all([
        fetchArts(companyId, filters, 5000),
        fetchPagamentos(companyId),
      ]);
      const result = runRules(arts as any, pagamentos, selectedRules);
      setHits(result);
      toast.success(`${result.length} ocorrência(s) encontradas em ${selectedRules.length} regra(s).`);
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao rodar auditoria");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (companyId) runScan(); /* eslint-disable-next-line */ }, [companyId]);

  const grouped = useMemo(() => {
    const m = new Map<RuleId, RuleHit[]>();
    for (const h of hits) {
      const arr = m.get(h.rule) ?? [];
      arr.push(h); m.set(h.rule, arr);
    }
    return m;
  }, [hits]);

  async function createAllAlerts() {
    if (!companyId || hits.length === 0) return;
    setCreating(true);
    try {
      let created = 0;
      for (const h of hits) {
        await upsertAlerta(companyId, {
          tipo: h.rule, criticidade: h.severity,
          art_id: h.art_id ?? null, pagamento_id: h.pagamento_id ?? null,
          observacoes: h.motivo, prazo: h.prazo ?? null,
        });
        created++;
      }
      toast.success(`${created} alerta(s) abertos (duplicados ignorados).`);
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao criar alertas");
    } finally {
      setCreating(false);
    }
  }

  const toggle = (id: RuleId) =>
    setSelectedRules(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <div className="space-y-4">
      <Card className="card-elegant">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Auditoria de dados</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={runScan} disabled={loading || !companyId}>
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
              Rodar agora
            </Button>
            <Button size="sm" onClick={createAllAlerts} disabled={creating || hits.length === 0}>
              {creating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <BellPlus className="h-4 w-4 mr-1" />}
              Abrir {hits.length} alerta(s)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {GOV_RULES.map(r => {
              const count = grouped.get(r.id)?.length ?? 0;
              return (
                <label key={r.id}
                  className="flex items-start gap-2 rounded-md border border-border/60 p-3 cursor-pointer hover:bg-muted/30 transition">
                  <Checkbox checked={selectedRules.includes(r.id)} onCheckedChange={() => toggle(r.id)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{r.label}</span>
                      <Badge variant="outline" className="text-[10px]">{count}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                    <Badge className={`mt-1 text-[10px] ${SEVERITY_COLOR[r.severity]}`}>{SEVERITY_LABEL[r.severity]}</Badge>
                  </div>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Ocorrências ({hits.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {hits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {loading ? "Analisando…" : "Nenhuma ocorrência encontrada com as regras selecionadas."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Regra</TableHead>
                  <TableHead>Criticidade</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Prazo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hits.slice(0, 500).map((h, i) => {
                  const rule = GOV_RULES.find(r => r.id === h.rule);
                  return (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">{rule?.label ?? h.rule}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${SEVERITY_COLOR[h.severity]}`}>{SEVERITY_LABEL[h.severity]}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{h.numero ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{h.motivo}</TableCell>
                      <TableCell className="text-xs">{h.prazo ?? "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {hits.length > 500 && (
            <p className="text-xs text-muted-foreground mt-2">Exibindo as 500 primeiras de {hits.length}.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
