import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HardHat, Filter, X, LayoutDashboard, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { VisaoExecutivaTab } from "../governanca/tabs/VisaoExecutivaTab";

const sb: any = supabase;

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const MESES = [
  { v: "01", l: "Jan" }, { v: "02", l: "Fev" }, { v: "03", l: "Mar" }, { v: "04", l: "Abr" },
  { v: "05", l: "Mai" }, { v: "06", l: "Jun" }, { v: "07", l: "Jul" }, { v: "08", l: "Ago" },
  { v: "09", l: "Set" }, { v: "10", l: "Out" }, { v: "11", l: "Nov" }, { v: "12", l: "Dez" },
];
const ALL = "__all";
const COLORS = ["hsl(var(--primary))", "#34d399", "#fbbf24", "#f87171", "#60a5fa", "#a78bfa", "#f472b6", "#94a3b8"];
const fmtBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const KpiCard = ({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) => (
  <Card className={accent ? "border-primary/40 card-elegant" : "card-elegant"}>
    <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">{label}</CardTitle></CardHeader>
    <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
  </Card>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-sm font-semibold text-muted-foreground mb-2 mt-4 uppercase tracking-wider">{children}</h2>
);

export default function CreaDashboard() {
  const [params, setParams] = useSearchParams();
  const fUf = params.get("uf") ?? ALL;
  const fStatus = params.get("status") ?? ALL;
  const fAno = params.get("ano") ?? "";
  const fMes = params.get("mes") ?? "";
  const fRT = params.get("rt") ?? "";
  const fCliente = params.get("cliente") ?? "";
  const view = (params.get("view") ?? "geral") as "geral" | "executiva";

  const setParam = (k: string, v: string) => {
    const np = new URLSearchParams(params);
    if (!v || v === ALL) np.delete(k); else np.set(k, v);
    setParams(np, { replace: true });
  };
  const clear = () => setParams(new URLSearchParams({ view }), { replace: true });

  const [arts, setArts] = useState<any[]>([]);
  const [prots, setProts] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [baixas, setBaixas] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [prazos, setPrazos] = useState<any[]>([]);
  const [rts, setRts] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [anuidades, setAnuidades] = useState<any[]>([]);
  const [govServ, setGovServ] = useState<any[]>([]);
  const [govBloco, setGovBloco] = useState<any[]>([]);
  const [govRel, setGovRel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [a, p, c, b, ct, pr, r, e, d, an, gs, gb, gr] = await Promise.all([
        sb.from("crea_arts").select("id,uf,status,data_emissao,valor,responsavel_tecnico,contratante,created_at").eq("is_deleted", false).limit(2000),
        sb.from("crea_protocols").select("id,uf,status,data_abertura,prazo_esperado").eq("is_deleted", false).limit(2000),
        sb.from("crea_certificates").select("id,uf,status,validade,data_emissao").eq("is_deleted", false).limit(2000),
        sb.from("crea_deregistrations").select("id,uf,status,tipo,created_at").eq("is_deleted", false).limit(2000),
        sb.from("crea_cats").select("id,uf,status,data_emissao").eq("is_deleted", false).limit(2000),
        sb.from("crea_deadlines").select("id,uf,status,prazo").eq("is_deleted", false).limit(2000),
        sb.from("crea_responsible_technicians").select("id,status,empresa_vinculada,inicio_vinculo,fim_vinculo").eq("is_deleted", false).limit(2000),
        sb.from("crea_companies_crea").select("id,empresa,uf,status").eq("is_deleted", false).limit(2000),
        sb.from("crea_documents").select("id,uf,nome,status,created_at").eq("is_deleted", false).limit(2000),
        sb.from("crea_anuidades").select("id,tipo,nome,ano,status,valor").eq("is_deleted", false).limit(2000),
        sb.from("crea_gov_servicos").select("id,analise,baixa,pagamento,cadastro").eq("is_deleted", false).limit(5000),
        sb.from("crea_gov_art_bloco").select("id,valor_art,valor_pago,situacao,data_inicio").eq("is_deleted", false).limit(5000),
        sb.from("crea_gov_relatorio_crea").select("id,valor_contrato,data_inicio,pagamento").eq("is_deleted", false).limit(5000),
      ]);
      setArts(a.data ?? []); setProts(p.data ?? []); setCerts(c.data ?? []);
      setBaixas(b.data ?? []); setCats(ct.data ?? []); setPrazos(pr.data ?? []);
      setRts(r.data ?? []); setEmpresas(e.data ?? []); setDocs(d.data ?? []); setAnuidades(an.data ?? []);
      setGovServ(gs.data ?? []); setGovBloco(gb.data ?? []); setGovRel(gr.data ?? []);
      setLoading(false);
    })();
  }, []);

  const filt = (arr: any[], dateKey?: string) => arr.filter(r => {
    if (fUf !== ALL && r.uf && r.uf !== fUf) return false;
    if (fStatus !== ALL && r.status && r.status !== fStatus) return false;
    if (fAno && dateKey && r[dateKey]) { if (!String(r[dateKey]).startsWith(fAno)) return false; }
    if (fMes && dateKey && r[dateKey]) { if (String(r[dateKey]).slice(5,7) !== fMes) return false; }
    if (fRT && r.responsavel_tecnico) { if (!String(r.responsavel_tecnico).toLowerCase().includes(fRT.toLowerCase())) return false; }
    if (fCliente && r.contratante) { if (!String(r.contratante).toLowerCase().includes(fCliente.toLowerCase())) return false; }
    return true;
  });

  const today = new Date().toISOString().slice(0,10);
  const in30 = new Date(Date.now() + 30*864e5).toISOString().slice(0,10);

  const k = useMemo(() => {
    const fArts = filt(arts, "data_emissao");
    const fProts = filt(prots, "data_abertura");
    const fCerts = filt(certs, "data_emissao");
    const fBaixas = filt(baixas);
    return {
      arts: fArts.length,
      artsEmitidas: fArts.filter(x => x.status === "emitida" || x.status === "registrada").length,
      protAbertos: fProts.filter(x => x.status === "aberto").length,
      certVenc: fCerts.filter(x => x.validade && x.validade <= in30 && x.validade >= today).length,
      certVencidas: fCerts.filter(x => x.validade && x.validade < today).length,
      baixaTotal: fBaixas.length,
      baixaArt: fBaixas.filter(x => /art/i.test(String(x.tipo||""))).length,
      baixaRt: fBaixas.filter(x => /rt|t[eé]cnico/i.test(String(x.tipo||""))).length,
      cats: filt(cats, "data_emissao").length,
      prazos30: filt(prazos).filter(x => x.prazo && x.prazo <= in30).length,
      valorTotal: fArts.reduce((s, x) => s + Number(x.valor ?? 0), 0),
      clientes: empresas.length,
      docs: docs.length,
    };
  }, [arts, prots, certs, baixas, cats, prazos, empresas, docs, fUf, fStatus, fAno, fMes, fRT, fCliente]);

  // RT breakdown
  const rtKpis = useMemo(() => {
    const ativo = rts.filter(x => x.status === "ativo").length;
    const inativo = rts.filter(x => x.status === "inativo").length;
    const incEmAnd = rts.filter(x => x.inicio_vinculo && !x.fim_vinculo && x.status !== "ativo").length;
    return { ativo, inativo, incEmAnd, total: rts.length };
  }, [rts]);

  // Anuidades breakdown
  const anuKpis = useMemo(() => {
    const f = anuidades.filter(a => !fAno || String(a.ano) === fAno);
    return {
      pago: f.filter(x => x.status === "pago").length,
      naoPago: f.filter(x => x.status === "nao_pago").length,
      isento: f.filter(x => x.status === "isento").length,
      desconto: f.filter(x => x.status === "desconto").length,
    };
  }, [anuidades, fAno]);

  // Charts
  const certPorAno = useMemo(() => {
    const map = new Map<string, number>();
    filt(certs, "data_emissao").forEach(x => { if (x.data_emissao) { const y = String(x.data_emissao).slice(0,4); map.set(y, (map.get(y)||0)+1); } });
    return Array.from(map.entries()).sort().map(([name, value]) => ({ name, value }));
  }, [certs, fUf, fStatus, fAno, fMes]);

  const artStatusChart = useMemo(() => {
    const map = new Map<string, number>();
    filt(arts, "data_emissao").forEach(x => { const s = x.status || "—"; map.set(s, (map.get(s)||0)+1); });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [arts, fUf, fStatus, fAno, fMes, fRT, fCliente]);

  const docsPorUf = useMemo(() => {
    const map = new Map<string, number>();
    docs.forEach(x => { const u = x.uf || "—"; map.set(u, (map.get(u)||0)+1); });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a,b)=>b.value-a.value).slice(0,10);
  }, [docs]);

  const baixaRtPorUf = useMemo(() => {
    const map = new Map<string, number>();
    filt(baixas).filter(x => /rt|t[eé]cnico/i.test(String(x.tipo||""))).forEach(x => { const u = x.uf || "—"; map.set(u, (map.get(u)||0)+1); });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a,b)=>b.value-a.value).slice(0,10);
  }, [baixas, fUf]);

  const anosDisp = useMemo(() => {
    const set = new Set<string>();
    [...arts, ...prots, ...certs, ...anuidades.map(a => ({ data_emissao: a.ano ? `${a.ano}-01-01` : null }))].forEach(r => {
      const d = r.data_emissao ?? r.data_abertura ?? r.created_at;
      if (d) set.add(String(d).slice(0,4));
    });
    return Array.from(set).sort().reverse();
  }, [arts, prots, certs, anuidades]);

  const hasAny = fUf !== ALL || fStatus !== ALL || fAno || fMes || fRT || fCliente;

  // Filtros para passar à VisaoExecutivaTab quando view=executiva
  const govFilters = useMemo(() => ({
    uf: fUf !== ALL ? fUf : undefined,
    ano: fAno || undefined,
    mes: fMes || undefined,
    rt: fRT || undefined,
    obra: undefined,
    cidade: undefined,
    art: undefined,
    dataDe: undefined,
    dataAte: undefined,
  }) as any, [fUf, fAno, fMes, fRT]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HardHat className="w-6 h-6 text-primary" /> CREA & ART — Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">Visão consolidada do módulo (filtros persistem na URL).</p>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Filter className="w-4 h-4" /> Filtros</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-6">
          <div>
            <Label className="text-xs">UF</Label>
            <Select value={fUf} onValueChange={(v) => setParam("uf", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>Todas</SelectItem>{UFS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Ano</Label>
            <Select value={fAno || ALL} onValueChange={(v) => setParam("ano", v === ALL ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>Todos</SelectItem>{anosDisp.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Mês</Label>
            <Select value={fMes || ALL} onValueChange={(v) => setParam("mes", v === ALL ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>Todos</SelectItem>{MESES.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">RT</Label>
            <Input value={fRT} onChange={(e) => setParam("rt", e.target.value)} placeholder="nome do RT…" />
          </div>
          <div>
            <Label className="text-xs">Cliente</Label>
            <Input value={fCliente} onChange={(e) => setParam("cliente", e.target.value)} placeholder="contratante…" />
          </div>
          <div className="flex items-end">
            {hasAny && <Button variant="ghost" onClick={clear}><X className="w-4 h-4 mr-1" /> Limpar</Button>}
          </div>
        </CardContent>
      </Card>

      <Tabs value={view} onValueChange={(v) => setParam("view", v)}>
        <TabsList>
          <TabsTrigger value="geral"><LayoutDashboard className="w-4 h-4 mr-1" /> Visão Geral</TabsTrigger>
          <TabsTrigger value="executiva"><BarChart3 className="w-4 h-4 mr-1" /> Visão Executiva (Governança ART)</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4 mt-4">
          <SectionTitle>ARTs</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <KpiCard label="ARTs (filtradas)" value={loading ? "…" : k.arts} accent />
            <KpiCard label="ARTs emitidas/registradas" value={loading ? "…" : k.artsEmitidas} />
            <KpiCard label="Valor total ARTs" value={loading ? "…" : fmtBRL(k.valorTotal)} />
            <KpiCard label="Top escopos" value={loading ? "…" : artStatusChart.length} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card className="card-elegant">
              <CardHeader className="pb-1"><CardTitle className="text-sm">ARTs por status</CardTitle></CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer><BarChart data={artStatusChart}><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis tick={{fontSize:10}} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" /></BarChart></ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="card-elegant">
              <CardHeader className="pb-1"><CardTitle className="text-sm">Certidões emitidas por ano</CardTitle></CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer><BarChart data={certPorAno}><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis tick={{fontSize:10}} /><Tooltip /><Bar dataKey="value" fill="#34d399" /></BarChart></ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <SectionTitle>CATs / Acervo · Certidões · Protocolos</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <KpiCard label="CATs" value={loading ? "…" : k.cats} />
            <KpiCard label="Certidões vencendo (30d)" value={loading ? "…" : k.certVenc} />
            <KpiCard label="Certidões vencidas" value={loading ? "…" : k.certVencidas} />
            <KpiCard label="Protocolos abertos" value={loading ? "…" : k.protAbertos} />
            <KpiCard label="Prazos próximos (30d)" value={loading ? "…" : k.prazos30} />
          </div>

          <SectionTitle>Baixas</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <KpiCard label="Baixas totais" value={loading ? "…" : k.baixaTotal} />
            <KpiCard label="ARTs baixadas" value={loading ? "…" : k.baixaArt} />
            <KpiCard label="RTs baixados" value={loading ? "…" : k.baixaRt} />
          </div>
          <Card className="card-elegant">
            <CardHeader className="pb-1"><CardTitle className="text-sm">RTs baixados por UF</CardTitle></CardHeader>
            <CardContent className="h-56">
              <ResponsiveContainer><BarChart data={baixaRtPorUf}><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis tick={{fontSize:10}} /><Tooltip /><Bar dataKey="value" fill="#f87171" /></BarChart></ResponsiveContainer>
            </CardContent>
          </Card>

          <SectionTitle>Responsáveis Técnicos</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <KpiCard label="RTs ativos" value={loading ? "…" : rtKpis.ativo} />
            <KpiCard label="RTs inativos" value={loading ? "…" : rtKpis.inativo} />
            <KpiCard label="Inclusões em andamento" value={loading ? "…" : rtKpis.incEmAnd} />
            <KpiCard label="Total RTs" value={loading ? "…" : rtKpis.total} />
            <KpiCard label="Anuidades pagas" value={loading ? "…" : anuKpis.pago} />
            <KpiCard label="Anuidades não pagas" value={loading ? "…" : anuKpis.naoPago} />
            <KpiCard label="Isentas" value={loading ? "…" : anuKpis.isento} />
            <KpiCard label="Com desconto" value={loading ? "…" : anuKpis.desconto} />
          </div>

          <SectionTitle>Clientes · Documentações</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <KpiCard label="Total de clientes" value={loading ? "…" : k.clientes} accent />
            <KpiCard label="Documentos cadastrados" value={loading ? "…" : k.docs} />
          </div>
          <Card className="card-elegant">
            <CardHeader className="pb-1"><CardTitle className="text-sm">Documentos por UF</CardTitle></CardHeader>
            <CardContent className="h-56">
              <ResponsiveContainer><BarChart data={docsPorUf}><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis tick={{fontSize:10}} /><Tooltip /><Bar dataKey="value" fill="#60a5fa" /></BarChart></ResponsiveContainer>
            </CardContent>
          </Card>

          <SectionTitle>Governança ART · consolidado (3 fontes)</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <KpiCard label="Serviços (Relatório Gerencial)" value={loading ? "…" : govServ.length} />
            <KpiCard label="ARTs por bloco" value={loading ? "…" : govBloco.length} />
            <KpiCard label="Linhas Relatórios CREA" value={loading ? "…" : govRel.length} />
            <KpiCard label="Valor ART (bloco)" value={loading ? "…" : fmtBRL(govBloco.reduce((s,x)=>s+Number(x.valor_art??0),0))} />
            <KpiCard label="Valor pago (bloco)" value={loading ? "…" : fmtBRL(govBloco.reduce((s,x)=>s+Number(x.valor_pago??0),0))} />
            <KpiCard label="Valor contrato (relatório)" value={loading ? "…" : fmtBRL(govRel.reduce((s,x)=>s+Number(x.valor_contrato??0),0))} />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Filtros aplicados</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {hasAny ? <Badge variant="outline">{[fUf!==ALL&&`UF=${fUf}`, fAno&&`Ano=${fAno}`, fMes&&`Mês=${fMes}`, fRT&&`RT=${fRT}`, fCliente&&`Cliente=${fCliente}`, fStatus!==ALL&&`Status=${fStatus}`].filter(Boolean).join(" · ")}</Badge> : "nenhum"}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executiva" className="mt-4">
          <VisaoExecutivaTab filters={govFilters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
