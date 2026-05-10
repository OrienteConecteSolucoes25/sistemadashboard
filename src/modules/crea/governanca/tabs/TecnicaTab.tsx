import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { GovFilters } from "../lib/govTypes";
import { fetchArts, GovArt } from "../lib/govApi";
import { useGovCompany } from "../lib/useGovCompany";
import { DeleteWithPasswordModal } from "@/components/DeleteWithPasswordModal";
import { toast } from "sonner";

const fmt = (n: number | null | undefined) => n == null ? "—" : Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string | null | undefined) => d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "—";

function statusColor(s: string | null | undefined) {
  const v = (s ?? "").toLowerCase();
  if (v.includes("registrada")) return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30";
  if (v.includes("aguard")) return "bg-amber-500/15 text-amber-700 border-amber-500/30";
  if (v.includes("cancel") || v.includes("invalid")) return "bg-rose-500/15 text-rose-700 border-rose-500/30";
  return "bg-muted text-muted-foreground border-border";
}

export function TecnicaTab({ filters }: { filters: GovFilters }) {
  const { companyId, loading: cl } = useGovCompany();
  const [arts, setArts] = useState<GovArt[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [delOpen, setDelOpen] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!companyId) return;
    setArts(null); setErr(null); setSel(new Set());
    fetchArts(companyId, filters, 2000).then(setArts).catch((e) => setErr(e.message));
  }, [companyId, JSON.stringify(filters), reload]);

  const filtered = useMemo(() => {
    if (!arts) return [];
    const t = q.trim().toLowerCase();
    if (!t) return arts;
    return arts.filter((a) =>
      [a.numero, a.observacao, a.proprietario, a.endereco, a.cidade, a.boleto_numero]
        .some((v) => (v ?? "").toLowerCase().includes(t)));
  }, [arts, q]);

  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSel((s) => s.size === filtered.length ? new Set() : new Set(filtered.map((a) => a.id)));

  if (cl) return <Skeleton className="h-64 w-full" />;
  if (!companyId) return <Card><CardContent className="p-6 text-sm text-muted-foreground">Você precisa estar vinculado a uma empresa.</CardContent></Card>;
  if (err) return <Card><CardContent className="p-6 text-sm text-destructive">{err}</CardContent></Card>;
  if (!arts) return <Skeleton className="h-64 w-full" />;

  return (
    <Card className="card-elegant">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center gap-2 justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input className="h-9 pl-7" placeholder="Buscar por número, observação, cidade…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{filtered.length} de {arts.length} ARTs</span>
            {sel.size > 0 && (
              <Button size="sm" variant="destructive" onClick={() => setDelOpen(true)}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir {sel.size}
              </Button>
            )}
          </div>
        </div>
        <div className="overflow-auto rounded-md border" style={{ maxHeight: "60vh" }}>
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="w-8"><Checkbox checked={sel.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></TableHead>
                <TableHead>Nº ART</TableHead>
                <TableHead>UF</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Status análise</TableHead>
                <TableHead>Status fin.</TableHead>
                <TableHead className="text-right">Taxa</TableHead>
                <TableHead className="text-right">Pago</TableHead>
                <TableHead className="text-right">Contrato</TableHead>
                <TableHead>Boleto</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id} className={sel.has(a.id) ? "bg-primary/5" : ""}>
                  <TableCell><Checkbox checked={sel.has(a.id)} onCheckedChange={() => toggle(a.id)} /></TableCell>
                  <TableCell className="font-mono text-xs">{a.numero}</TableCell>
                  <TableCell>{a.uf ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{fmtDate(a.data_cadastro)}</TableCell>
                  <TableCell><Badge variant="outline" className={`text-xs ${statusColor(a.status_analise)}`}>{a.status_analise ?? "—"}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={`text-xs ${statusColor(a.status_financeiro)}`}>{a.status_financeiro ?? "—"}</Badge></TableCell>
                  <TableCell className="text-right text-xs">{fmt(a.valor_taxa)}</TableCell>
                  <TableCell className="text-right text-xs">{fmt(a.valor_pago)}</TableCell>
                  <TableCell className="text-right text-xs">{fmt(a.valor_contrato)}</TableCell>
                  <TableCell className="text-xs">{a.boleto_numero ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{fmtDate(a.data_vencimento)}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{fmtDate(a.data_pagamento)}</TableCell>
                  <TableCell className="text-xs">{a.cidade ?? "—"}</TableCell>
                  <TableCell className="text-xs max-w-[260px] truncate" title={a.observacao ?? ""}>{a.observacao ?? "—"}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={14} className="text-center text-sm text-muted-foreground py-8">Nenhuma ART encontrada.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DeleteWithPasswordModal
          open={delOpen}
          onOpenChange={setDelOpen}
          tableName="crea_gov_arts"
          rpcName="crea_soft_delete"
          recordIds={Array.from(sel)}
          recordLabel={`${sel.size} ART(s)`}
          onSuccess={() => { setSel(new Set()); setReload((r) => r + 1); toast.success("Excluído com sucesso"); }}
        />
      </CardContent>
    </Card>
  );
}
