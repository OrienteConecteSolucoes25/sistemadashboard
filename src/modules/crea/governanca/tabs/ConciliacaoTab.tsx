import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Link2, Unlink, Play, CheckCircle2, AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";
import { useGovCompany } from "../lib/useGovCompany";
import {
  fetchPagamentos, fetchConciliacoes, runAutoConciliacao, manualConciliar,
  unlinkConciliacao, searchArtsByNumero, GovPagamento, GovConciliacao, GovArt,
} from "../lib/govApi";

const fmtBRL = (v: number | null) => Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ManualMatchModal({
  open, onOpenChange, pagamento, companyId, onDone,
}: {
  open: boolean; onOpenChange: (b: boolean) => void;
  pagamento: GovPagamento | null; companyId: string; onDone: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GovArt[]>([]);
  const [selected, setSelected] = useState<GovArt | null>(null);
  const [motivo, setMotivo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) { setQuery(""); setResults([]); setSelected(null); setMotivo(""); }
  }, [open]);

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try { setResults(await searchArtsByNumero(companyId, query)); }
      catch (e: any) { toast.error(e.message); }
    }, 300);
    return () => clearTimeout(t);
  }, [query, companyId]);

  if (!pagamento) return null;

  const submit = async () => {
    if (!selected) return toast.error("Selecione uma ART");
    if (motivo.trim().length < 3) return toast.error("Informe o motivo (mínimo 3 caracteres)");
    setBusy(true);
    try {
      const res = await manualConciliar(pagamento.id, selected.id, motivo);
      if (!res.ok) throw new Error(res.error);
      toast.success(`Conciliado (${res.status})`);
      onDone(); onOpenChange(false);
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Conciliar manualmente</DialogTitle></DialogHeader>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="card-elegant">
            <CardHeader><CardTitle className="text-sm">Pagamento</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Boleto:</span> <span className="font-mono">{pagamento.numero_boleto || "—"}</span></p>
              <p><span className="text-muted-foreground">Valor:</span> <strong>{fmtBRL(pagamento.valor)}</strong></p>
              <p><span className="text-muted-foreground">Sacado:</span> {pagamento.sacado || "—"}</p>
              <p><span className="text-muted-foreground">Pagamento:</span> {pagamento.data_pagamento || "—"}</p>
              <p><span className="text-muted-foreground">Vencimento:</span> {pagamento.data_vencimento || "—"}</p>
            </CardContent>
          </Card>
          <Card className="card-elegant">
            <CardHeader><CardTitle className="text-sm">ART selecionada</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              {selected ? (
                <>
                  <p><span className="text-muted-foreground">Número:</span> <span className="font-mono">{selected.numero}</span></p>
                  <p><span className="text-muted-foreground">UF:</span> {selected.uf || "—"}</p>
                  <p><span className="text-muted-foreground">Valor taxa:</span> <strong>{fmtBRL(selected.valor_taxa)}</strong></p>
                  <p><span className="text-muted-foreground">Status:</span> {selected.status_analise || "—"}</p>
                  {pagamento.valor != null && selected.valor_taxa != null && Math.abs(Number(pagamento.valor) - Number(selected.valor_taxa)) >= 0.05 && (
                    <p className="text-amber-500 text-xs flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Valores divergentes — será marcado como divergente</p>
                  )}
                </>
              ) : <p className="text-muted-foreground text-xs">Busque por número de ART abaixo.</p>}
            </CardContent>
          </Card>
        </div>

        <div>
          <Label className="text-xs">Buscar ART por número</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Digite parte do número da ART…" />
          </div>
          {results.length > 0 && (
            <div className="border rounded mt-1 max-h-40 overflow-auto">
              {results.map((a) => (
                <button key={a.id} type="button"
                  onClick={() => setSelected(a)}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-muted flex justify-between ${selected?.id === a.id ? "bg-primary/10" : ""}`}>
                  <span><span className="font-mono">{a.numero}</span> · {a.uf} · {a.status_analise}</span>
                  <span className="font-semibold">{fmtBRL(a.valor_taxa)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label className="text-xs">Motivo (auditoria)</Label>
          <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} placeholder="Ex.: pagamento manual identificado por OS xxxxx" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={busy || !selected}>
            {busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Conciliar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UnlinkButton({ id, onDone }: { id: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    const motivo = window.prompt("Motivo para desfazer a conciliação:");
    if (!motivo || motivo.trim().length < 3) return;
    setBusy(true);
    try {
      const r = await unlinkConciliacao(id, motivo);
      if (!r.ok) throw new Error(r.error);
      toast.success("Conciliação desfeita"); onDone();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };
  return (
    <Button size="sm" variant="ghost" onClick={handle} disabled={busy}>
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />}
    </Button>
  );
}

export function ConciliacaoTab() {
  const { companyId } = useGovCompany();
  const [pags, setPags] = useState<GovPagamento[]>([]);
  const [concs, setConcs] = useState<GovConciliacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [target, setTarget] = useState<GovPagamento | null>(null);

  const reload = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [p, c] = await Promise.all([fetchPagamentos(companyId), fetchConciliacoes(companyId)]);
      setPags(p); setConcs(c);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, [companyId]);

  const runAuto = async () => {
    if (!companyId) return;
    setRunning(true);
    try {
      const r = await runAutoConciliacao(companyId);
      if (!r.ok) throw new Error(r.error);
      toast.success(`Conciliados: ${r.matched ?? 0} | Divergentes: ${r.divergent ?? 0} | Fallback: ${r.fallback ?? 0}`);
      await reload();
    } catch (e: any) { toast.error(e.message); }
    finally { setRunning(false); }
  };

  if (!companyId) return <Card className="card-elegant"><CardContent className="p-8 text-center text-muted-foreground">Selecione uma empresa.</CardContent></Card>;

  const conciliados = concs.filter((c) => c.status === "ok");
  const divergentes = concs.filter((c) => c.status === "divergente");
  const semPar = pags.filter((p) => !p.conciliado_art_id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Card className="card-elegant flex-row items-center gap-2 px-3 py-2 flex">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-xs">Conciliados: <strong>{conciliados.length}</strong></span>
          </Card>
          <Card className="card-elegant flex-row items-center gap-2 px-3 py-2 flex">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-xs">Divergentes: <strong>{divergentes.length}</strong></span>
          </Card>
          <Card className="card-elegant flex-row items-center gap-2 px-3 py-2 flex">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs">Sem par: <strong>{semPar.length}</strong></span>
          </Card>
        </div>
        <Button onClick={runAuto} disabled={running}>
          {running ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
          Rodar conciliação automática
        </Button>
      </div>

      <Tabs defaultValue="conciliados">
        <TabsList>
          <TabsTrigger value="conciliados">Conciliados ({conciliados.length})</TabsTrigger>
          <TabsTrigger value="divergentes">Divergentes ({divergentes.length})</TabsTrigger>
          <TabsTrigger value="sempar">Sem par ({semPar.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="conciliados" className="mt-3">
          <Card className="card-elegant"><CardContent className="p-0">
            {loading ? <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div> : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>ART</TableHead><TableHead>Boleto</TableHead><TableHead>Origem</TableHead>
                  <TableHead className="text-right">Valor ART</TableHead><TableHead className="text-right">Valor pago</TableHead>
                  <TableHead>Data</TableHead><TableHead>Score</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {conciliados.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.art?.numero || "—"} · {c.art?.uf}</TableCell>
                      <TableCell className="font-mono text-xs">{c.pagamento?.numero_boleto || "—"}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px]">{c.origem}</Badge></TableCell>
                      <TableCell className="text-right text-xs">{fmtBRL(c.art?.valor_taxa ?? null)}</TableCell>
                      <TableCell className="text-right text-xs">{fmtBRL(c.pagamento?.valor ?? null)}</TableCell>
                      <TableCell className="text-xs">{c.pagamento?.data_pagamento || "—"}</TableCell>
                      <TableCell className="text-xs">{c.score?.toFixed(2) || "—"}</TableCell>
                      <TableCell><UnlinkButton id={c.id} onDone={reload} /></TableCell>
                    </TableRow>
                  ))}
                  {conciliados.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">Nenhum vínculo conciliado ainda. Rode a conciliação automática.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="divergentes" className="mt-3">
          <Card className="card-elegant"><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>ART</TableHead><TableHead>Boleto</TableHead><TableHead>Motivo</TableHead>
                <TableHead className="text-right">Valor ART</TableHead><TableHead className="text-right">Valor pago</TableHead>
                <TableHead className="text-right">Diferença</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {divergentes.map((c) => {
                  const diff = Number(c.pagamento?.valor || 0) - Number(c.art?.valor_taxa || 0);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.art?.numero || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{c.pagamento?.numero_boleto || "—"}</TableCell>
                      <TableCell className="text-xs">{c.motivo}</TableCell>
                      <TableCell className="text-right text-xs">{fmtBRL(c.art?.valor_taxa ?? null)}</TableCell>
                      <TableCell className="text-right text-xs">{fmtBRL(c.pagamento?.valor ?? null)}</TableCell>
                      <TableCell className={`text-right text-xs font-semibold ${diff < 0 ? "text-destructive" : "text-amber-500"}`}>{fmtBRL(diff)}</TableCell>
                      <TableCell><UnlinkButton id={c.id} onDone={reload} /></TableCell>
                    </TableRow>
                  );
                })}
                {divergentes.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Sem divergências.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="sempar" className="mt-3">
          <Card className="card-elegant"><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Boleto</TableHead><TableHead>Sacado</TableHead><TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Valor</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {semPar.slice(0, 200).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.numero_boleto || "—"}</TableCell>
                    <TableCell className="text-xs">{p.sacado || "—"}</TableCell>
                    <TableCell className="text-xs">{p.data_pagamento || "—"}</TableCell>
                    <TableCell className="text-right text-xs font-semibold">{fmtBRL(p.valor)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => { setTarget(p); setManualOpen(true); }}>
                        <Link2 className="h-3 w-3 mr-1" />Conciliar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {semPar.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Tudo conciliado!</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <ManualMatchModal
        open={manualOpen} onOpenChange={setManualOpen}
        pagamento={target} companyId={companyId} onDone={reload}
      />
    </div>
  );
}
