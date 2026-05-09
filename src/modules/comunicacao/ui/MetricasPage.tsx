import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useComunicacaoAccess } from "../hooks/useComunicacaoAccess";
import { useActiveBrandKit } from "../hooks/useActiveBrandKit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";
import { BarChart3, Sparkles, Plus, RefreshCw, TrendingUp, TrendingDown, Eye, Heart, MessageCircle, Share2, Bookmark, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PROVIDERS = ["instagram", "facebook", "linkedin", "tiktok", "youtube"];

export default function MetricasPage() {
  const { companyId } = useComunicacaoAccess();
  const { activeBrand } = useActiveBrandKit();
  const [metrics, setMetrics] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [days, setDays] = useState("30");

  async function load() {
    if (!companyId) return;
    setLoading(true);
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString();
    const [m, i] = await Promise.all([
      supabase.from("comm_post_metrics").select("*").eq("company_id", companyId).gte("collected_at", since).order("collected_at", { ascending: false }),
      supabase.from("comm_ai_insights").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(10),
    ]);
    setMetrics(m.data ?? []);
    setInsights(i.data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [companyId, days]);

  const agg = useMemo(() => {
    return metrics.reduce((acc: any, m: any) => {
      acc.impressions += m.impressions ?? 0;
      acc.reach += m.reach ?? 0;
      acc.likes += m.likes ?? 0;
      acc.comments += m.comments ?? 0;
      acc.shares += m.shares ?? 0;
      acc.saves += m.saves ?? 0;
      acc.clicks += m.clicks ?? 0;
      acc.posts += 1;
      acc.er += Number(m.engagement_rate ?? 0);
      return acc;
    }, { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0, posts: 0, er: 0 });
  }, [metrics]);
  const erAvg = agg.posts ? +(agg.er / agg.posts).toFixed(2) : 0;

  const byProvider = useMemo(() => {
    const map: Record<string, any> = {};
    for (const m of metrics) {
      const p = m.provider ?? "outros";
      map[p] ||= { provider: p, impressions: 0, likes: 0, comments: 0, posts: 0 };
      map[p].impressions += m.impressions ?? 0;
      map[p].likes += m.likes ?? 0;
      map[p].comments += m.comments ?? 0;
      map[p].posts += 1;
    }
    return Object.values(map);
  }, [metrics]);

  const timeseries = useMemo(() => {
    const map: Record<string, any> = {};
    for (const m of metrics) {
      const day = new Date(m.collected_at).toISOString().slice(0, 10);
      map[day] ||= { day, impressions: 0, engagement: 0 };
      map[day].impressions += m.impressions ?? 0;
      map[day].engagement += (m.likes ?? 0) + (m.comments ?? 0) + (m.shares ?? 0);
    }
    return Object.values(map).sort((a: any, b: any) => a.day.localeCompare(b.day));
  }, [metrics]);

  async function generateInsights() {
    if (!companyId) return;
    setGenerating(true);
    try {
      const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase.functions.invoke("comm-metrics-insights", {
        body: {
          company_id: companyId,
          client_brand_id: activeBrand?.id ?? null,
          scope: "periodo",
          periodo_de: since,
          brand_context: activeBrand ? { nome: activeBrand.nome, tom: activeBrand.tom_de_voz, persona: activeBrand.persona } : {},
        },
      });
      if (error) throw error;
      const r: any = data;
      if (!r?.ok) throw new Error(r?.error ?? r?.message ?? "Falha");
      toast.success("Insights gerados pelo Diretor IA");
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao gerar insights");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Métricas & Insights IA
          </h1>
          <p className="text-sm text-muted-foreground">
            Desempenho dos conteúdos publicados + análise automática do Diretor OCS.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </Button>
          <AddMetricDialog companyId={companyId} clientBrandId={activeBrand?.id ?? null} onDone={load} />
          <Button onClick={generateInsights} disabled={generating || metrics.length === 0}>
            {generating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Gerar insights
          </Button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        <KPI icon={Eye} label="Impressões" value={agg.impressions} />
        <KPI icon={Eye} label="Alcance" value={agg.reach} />
        <KPI icon={Heart} label="Curtidas" value={agg.likes} />
        <KPI icon={MessageCircle} label="Comentários" value={agg.comments} />
        <KPI icon={Share2} label="Compart." value={agg.shares} />
        <KPI icon={Bookmark} label="Salvos" value={agg.saves} />
        <KPI icon={TrendingUp} label="ER médio" value={`${erAvg}%`} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="posts">Posts ({metrics.length})</TabsTrigger>
          <TabsTrigger value="insights">Insights IA ({insights.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3 mt-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Card><CardHeader className="pb-1"><CardTitle className="text-base">Engajamento por dia</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer><LineChart data={timeseries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Line type="monotone" dataKey="impressions" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="engagement" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                </LineChart></ResponsiveContainer>
              </CardContent>
            </Card>
            <Card><CardHeader className="pb-1"><CardTitle className="text-base">Por canal</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer><BarChart data={byProvider}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="provider" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="impressions" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                </BarChart></ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="posts" className="mt-3">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead className="max-w-xs">Legenda</TableHead>
                  <TableHead className="text-right">Impr.</TableHead>
                  <TableHead className="text-right">Curtidas</TableHead>
                  <TableHead className="text-right">Coment.</TableHead>
                  <TableHead className="text-right">ER</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">Nenhuma métrica registrada.</TableCell></TableRow>
                )}
                {metrics.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs whitespace-nowrap">{new Date(m.collected_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell><Badge variant="outline">{m.provider ?? "—"}</Badge></TableCell>
                    <TableCell className="text-xs max-w-xs truncate">{m.caption ?? "—"}</TableCell>
                    <TableCell className="text-right text-xs">{m.impressions ?? 0}</TableCell>
                    <TableCell className="text-right text-xs">{m.likes ?? 0}</TableCell>
                    <TableCell className="text-right text-xs">{m.comments ?? 0}</TableCell>
                    <TableCell className="text-right text-xs font-medium">{Number(m.engagement_rate ?? 0).toFixed(2)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-3 mt-3">
          {insights.length === 0 && (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
              Nenhum insight ainda. Clique em "Gerar insights" para o Diretor IA analisar suas métricas.
            </CardContent></Card>
          )}
          {insights.map((ins) => (
            <Card key={ins.id} className="card-elegant">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> Análise do Diretor OCS
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">{new Date(ins.created_at).toLocaleString("pt-BR")}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="whitespace-pre-wrap">{ins.resumo}</p>
                {ins.pontos_fortes?.length > 0 && (
                  <div>
                    <div className="text-xs font-display uppercase text-emerald-600 mb-1 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Pontos fortes</div>
                    <ul className="list-disc pl-5 text-xs space-y-1">
                      {ins.pontos_fortes.map((p: string, i: number) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                )}
                {ins.pontos_fracos?.length > 0 && (
                  <div>
                    <div className="text-xs font-display uppercase text-amber-600 mb-1 flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Atenção</div>
                    <ul className="list-disc pl-5 text-xs space-y-1">
                      {ins.pontos_fracos.map((p: string, i: number) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                )}
                {ins.recomendacoes?.length > 0 && (
                  <div>
                    <div className="text-xs font-display uppercase text-primary mb-1">Recomendações</div>
                    <div className="space-y-1.5">
                      {ins.recomendacoes.map((r: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs p-2 rounded border bg-muted/30">
                          <Badge variant="outline" className="shrink-0">{r.impacto ?? "—"}</Badge>
                          <div className="flex-1">{r.acao}</div>
                          {r.prazo && <span className="text-muted-foreground shrink-0">{r.prazo}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPI({ icon: Icon, label, value }: any) {
  return (
    <Card className="card-elegant">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Icon className="h-3 w-3" /> {label}
        </div>
        <div className="text-xl font-display font-bold">{typeof value === "number" ? value.toLocaleString("pt-BR") : value}</div>
      </CardContent>
    </Card>
  );
}

function AddMetricDialog({ companyId, clientBrandId, onDone }: { companyId: string | null; clientBrandId: string | null; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState("instagram");
  const [caption, setCaption] = useState("");
  const [url, setUrl] = useState("");
  const [impressions, setImpressions] = useState("");
  const [reach, setReach] = useState("");
  const [likes, setLikes] = useState("");
  const [comments, setComments] = useState("");
  const [shares, setShares] = useState("");
  const [saves, setSaves] = useState("");
  const [clicks, setClicks] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!companyId) return;
    setBusy(true);
    try {
      const imp = parseInt(impressions || "0");
      const lk = parseInt(likes || "0");
      const cm = parseInt(comments || "0");
      const sh = parseInt(shares || "0");
      const sv = parseInt(saves || "0");
      const er = imp > 0 ? +(((lk + cm + sh + sv) / imp) * 100).toFixed(2) : 0;
      const { error } = await supabase.from("comm_post_metrics").insert({
        company_id: companyId,
        client_brand_id: clientBrandId,
        provider,
        caption: caption || null,
        external_url: url || null,
        impressions: imp,
        reach: parseInt(reach || "0"),
        likes: lk, comments: cm, shares: sh, saves: sv,
        clicks: parseInt(clicks || "0"),
        engagement_rate: er,
      });
      if (error) throw error;
      toast.success("Métrica registrada");
      setOpen(false);
      setCaption(""); setUrl(""); setImpressions(""); setReach(""); setLikes(""); setComments(""); setShares(""); setSaves(""); setClicks("");
      onDone();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-1" /> Lançar métrica</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Registrar métrica de publicação</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Canal</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PROVIDERS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">URL do post</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div>
            <Label className="text-xs">Legenda / referência</Label>
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Impressões" value={impressions} onChange={setImpressions} />
            <Field label="Alcance" value={reach} onChange={setReach} />
            <Field label="Curtidas" value={likes} onChange={setLikes} />
            <Field label="Comentários" value={comments} onChange={setComments} />
            <Field label="Compart." value={shares} onChange={setShares} />
            <Field label="Salvos" value={saves} onChange={setSaves} />
            <Field label="Cliques" value={clicks} onChange={setClicks} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null} Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
