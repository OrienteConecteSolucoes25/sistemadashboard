import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2, ExternalLink, MapPin } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useObraVinculos, CATEGORIAS_CUSTO, type SiteCost } from "../../hooks/useObraVinculos";
import { useUserModules } from "@/modules/planos/hooks/useUserModules";

const PIE = ["hsl(181 65% 46%)", "hsl(41 100% 47%)", "hsl(0 70% 60%)", "hsl(158 64% 42%)", "hsl(217 10% 55%)", "hsl(260 60% 60%)", "hsl(200 70% 55%)", "hsl(28 80% 55%)", "hsl(340 70% 55%)", "hsl(100 50% 50%)"];

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

export interface ObraRow {
  id: string;
  nome: string;
  cidade: string | null;
  uf: string | null;
  endereco?: string | null;
  cep?: string | null;
  maps_url?: string | null;
  trigger_date?: string | null;
  delivery_date?: string | null;
  total_value?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

const StatusBadge = ({ status }: { status?: string }) => {
  const s = (status ?? "").toLowerCase();
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  if (/(concl|aprov|pago|ok)/.test(s)) variant = "default";
  else if (/(cancel|venc|reprov)/.test(s)) variant = "destructive";
  else if (/(pend|aguard)/.test(s)) variant = "secondary";
  return <Badge variant={variant}>{status || "—"}</Badge>;
};

interface Props {
  obra: ObraRow | null;
  onClose: () => void;
  onEdit: (o: ObraRow) => void;
  onChanged: () => void;
}

export const ObraDetailSheet = ({ obra, onClose, onEdit, onChanged }: Props) => {
  const userModules = useUserModules();
  const moduleSet = useMemo(() => new Set(userModules), [userModules]);
  const has = (k: string) => moduleSet.size === 0 || moduleSet.has(k); // se sem plano, mostra todos

  const v = useObraVinculos(obra?.nome, obra?.id);

  const [costOpen, setCostOpen] = useState(false);
  const [editCost, setEditCost] = useState<Partial<SiteCost> | null>(null);

  if (!obra) return null;

  const totalGeral = (v.valorGovTotal || 0) + (v.totalCustos || 0);
  const cadastrado = Number(obra.total_value || 0);
  const variacao = cadastrado > 0 ? ((totalGeral - cadastrado) / cadastrado) * 100 : 0;
  const variacaoColor = variacao <= 0 ? "text-green-500" : "text-red-500";

  const saveCost = async () => {
    if (!editCost?.categoria || !editCost?.valor) return toast.error("Categoria e valor são obrigatórios");
    const payload = {
      site_id: obra.id,
      site_name: obra.nome,
      categoria: editCost.categoria,
      descricao: editCost.descricao ?? null,
      valor: Number(editCost.valor),
      data_lancamento: editCost.data_lancamento ?? new Date().toISOString().slice(0, 10),
      observacao: editCost.observacao ?? null,
      origem: editCost.origem ?? "manual",
    };
    const { error } = editCost.id
      ? await supabase.from("eng_site_costs").update(payload).eq("id", editCost.id)
      : await supabase.from("eng_site_costs").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Lançamento salvo");
    setCostOpen(false); setEditCost(null);
    v.refresh();
  };

  const delCost = async (id: string) => {
    if (!confirm("Excluir lançamento?")) return;
    const { error } = await supabase.from("eng_site_costs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removido"); v.refresh();
  };

  return (
    <Sheet open={!!obra} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="sm:max-w-[860px] w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl">{obra.nome}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Cabeçalho */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {[obra.cidade, obra.uf].filter(Boolean).join(" / ") || "Sem cidade/UF"}
                  </div>
                  {obra.endereco && <div>{obra.endereco}{obra.cep ? ` — ${obra.cep}` : ""}</div>}
                  {obra.maps_url && (
                    <a href={obra.maps_url} target="_blank" rel="noreferrer"
                       className="inline-flex items-center gap-1 text-primary hover:underline">
                      Google Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => onEdit(obra)}>
                  <Pencil className="w-4 h-4 mr-2" /> Editar dados
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Cadastrado</div>
                  <div className="text-lg font-semibold">{fmtMoney(cadastrado)}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Governança</div>
                  <div className="text-lg font-semibold">{fmtMoney(v.valorGovTotal)}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Custos lançados</div>
                  <div className="text-lg font-semibold">{fmtMoney(v.totalCustos)}</div>
                </div>
              </div>

              <div className="text-sm">
                Total real (gov+custos): <strong>{fmtMoney(totalGeral)}</strong> —{" "}
                <span className={variacaoColor}>
                  variação {variacao >= 0 ? "+" : ""}{variacao.toFixed(1)}% vs cadastrado
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Vínculos por módulo */}
          {has("eng.projetos") && (
            <Card>
              <CardHeader><CardTitle className="text-base">Projetos ({v.projetos.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                {v.projetos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum projeto vinculado.</p>}
                {v.projetos.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm border-b pb-1">
                    <div>
                      <div className="font-medium">{p.cliente || "—"}</div>
                      <div className="text-xs text-muted-foreground">{p.escopo} · {p.projetista}</div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline">{p.dentro_prazo || "—"}</Badge>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {has("eng.art") && (
            <Card>
              <CardHeader><CardTitle className="text-base">ARTs ({v.arts.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                {v.arts.length === 0 && <p className="text-sm text-muted-foreground">Sem ARTs.</p>}
                {v.arts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm border-b pb-1">
                    <div>{a.numero} · {a.tipo} · {a.cliente}</div>
                    <div className="flex gap-2"><span>{fmtMoney(a.custo ?? 0)}</span><StatusBadge status={a.status} /></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {has("eng.solicitacoes") && (
            <Card>
              <CardHeader><CardTitle className="text-base">Solicitações ({v.solicits.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                {v.solicits.length === 0 && <p className="text-sm text-muted-foreground">Sem solicitações.</p>}
                {v.solicits.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm border-b pb-1">
                    <div>{s.categoria} · {s.escopo} · {s.cliente}</div>
                    <StatusBadge status={s.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {has("eng.energia") && (
            <Card>
              <CardHeader><CardTitle className="text-base">Energia ({v.energias.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                {v.energias.length === 0 && <p className="text-sm text-muted-foreground">Sem registros de energia.</p>}
                {v.energias.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm border-b pb-1">
                    <div>{e.concessionaria} · {e.protocolo}</div>
                    <StatusBadge status={e.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {has("eng.governanca") && (
            <Card>
              <CardHeader><CardTitle className="text-base">Governança ({v.govs.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-72 overflow-y-auto">
                {v.govs.length === 0 && <p className="text-sm text-muted-foreground">Sem governança.</p>}
                {v.govs.map((g) => (
                  <div key={g.id} className="flex items-center justify-between text-sm border-b pb-1">
                    <div>
                      <div className="font-medium">{g.servico || "—"}</div>
                      <div className="text-xs text-muted-foreground">{g.cliente} · {g.pct_conclusao_campo ?? 0}% campo</div>
                    </div>
                    <div className="text-right">
                      <div>{fmtMoney(g.valor_total_atividade ?? 0)}</div>
                      <div className="flex gap-1 justify-end">
                        <StatusBadge status={g.status_bi} />
                        <StatusBadge status={g.status_atividade} />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Custos */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Custos da obra</CardTitle>
              <Button size="sm" onClick={() => { setEditCost({}); setCostOpen(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Lançar
              </Button>
            </CardHeader>
            <CardContent>
              {v.costs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum custo lançado.</p>
              ) : (
                <div className="grid lg:grid-cols-2 gap-4">
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={v.custosPorCategoria} dataKey="valor" nameKey="categoria" outerRadius={80}>
                          {v.custosPorCategoria.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                        </Pie>
                        <Tooltip formatter={(val: number) => fmtMoney(val)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1 text-sm max-h-64 overflow-y-auto">
                    <div className="flex justify-between border-b pb-1 font-semibold">
                      <span>Total</span><span>{fmtMoney(v.totalCustos)}</span>
                    </div>
                    {v.costs.map((c) => (
                      <div key={c.id} className="flex justify-between items-center border-b py-1">
                        <div>
                          <Badge variant="outline" className="mr-2">{c.categoria}</Badge>
                          {c.descricao || "—"}
                          <div className="text-[11px] text-muted-foreground">
                            {c.data_lancamento} · {c.origem}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{fmtMoney(c.valor)}</span>
                          <Button size="icon" variant="ghost" onClick={() => { setEditCost(c); setCostOpen(true); }}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => delCost(c.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={costOpen} onOpenChange={setCostOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editCost?.id ? "Editar lançamento" : "Lançar custo"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Categoria *</Label>
                <Select value={editCost?.categoria ?? ""} onValueChange={(v) => setEditCost((s) => ({ ...s, categoria: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_CUSTO.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descrição</Label>
                <Input value={editCost?.descricao ?? ""} onChange={(e) => setEditCost((s) => ({ ...s, descricao: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valor *</Label>
                  <Input type="number" step="0.01" value={editCost?.valor ?? ""} onChange={(e) => setEditCost((s) => ({ ...s, valor: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Data</Label>
                  <Input type="date" value={editCost?.data_lancamento ?? ""} onChange={(e) => setEditCost((s) => ({ ...s, data_lancamento: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Observação</Label>
                <Textarea value={editCost?.observacao ?? ""} onChange={(e) => setEditCost((s) => ({ ...s, observacao: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setCostOpen(false)}>Cancelar</Button>
              <Button onClick={saveCost}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
};
