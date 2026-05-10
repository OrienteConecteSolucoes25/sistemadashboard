import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Bell, CheckCircle2, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { useGovCompany } from "../lib/useGovCompany";
import { fetchAlertas, GovAlerta, updateAlerta } from "../lib/govApi";
import { GOV_RULES, SEVERITY_COLOR, SEVERITY_LABEL, Severity } from "../lib/govRules";
import { AlertaResolverModal } from "./AlertaResolverModal";

const STATUS = [
  { value: "aberto",     label: "Abertos" },
  { value: "em_revisao", label: "Em revisão" },
  { value: "resolvido",  label: "Resolvidos" },
  { value: "ignorado",   label: "Ignorados" },
];

export function AlertasTab() {
  const { companyId } = useGovCompany();
  const [status, setStatus] = useState("aberto");
  const [list, setList] = useState<GovAlerta[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<GovAlerta | null>(null);

  async function load() {
    if (!companyId) return;
    setLoading(true);
    try {
      const data = await fetchAlertas(companyId, status);
      setList(data);
    } catch (e: any) { toast.error(e?.message ?? "Falha"); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [companyId, status]);

  async function quick(a: GovAlerta, newStatus: string) {
    try {
      await updateAlerta(a.id, { status: newStatus }, `Status → ${newStatus}`);
      toast.success("Alerta atualizado.");
      load();
    } catch (e: any) { toast.error(e?.message ?? "Falha"); }
  }

  return (
    <div className="space-y-4">
      <Card className="card-elegant">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Fila de alertas
          </CardTitle>
          <Tabs value={status} onValueChange={setStatus}>
            <TabsList>
              {STATUS.map(s => (
                <TabsTrigger key={s.value} value={s.value} className="text-xs">{s.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
          ) : list.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum alerta nesta fila.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Criticidade</TableHead>
                  <TableHead>ART</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Aberto em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map(a => {
                  const rule = GOV_RULES.find(r => r.id === a.tipo);
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm font-medium">{rule?.label ?? a.tipo}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${SEVERITY_COLOR[(a.criticidade as Severity) ?? "medium"]}`}>
                          {SEVERITY_LABEL[(a.criticidade as Severity) ?? "medium"]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{a.art?.numero ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-md truncate">{a.observacoes ?? "—"}</TableCell>
                      <TableCell className="text-xs">{a.prazo ?? "—"}</TableCell>
                      <TableCell className="text-xs">{new Date(a.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => setOpen(a)}><Eye className="h-3.5 w-3.5" /></Button>
                        {a.status === "aberto" && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => quick(a, "resolvido")}>
                              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => quick(a, "ignorado")}>
                              <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertaResolverModal alerta={open} onClose={() => setOpen(null)} onChanged={load} />
    </div>
  );
}
