import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HardHat, Filter, X } from "lucide-react";

const sb: any = supabase;

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const ALL = "__all";

const KpiCard = ({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) => (
  <Card className={accent ? "border-primary/40" : ""}>
    <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">{label}</CardTitle></CardHeader>
    <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
  </Card>
);

export default function CreaDashboard() {
  const [params, setParams] = useSearchParams();
  const fUf = params.get("uf") ?? ALL;
  const fStatus = params.get("status") ?? ALL;
  const fAno = params.get("ano") ?? "";
  const fRT = params.get("rt") ?? "";

  const setParam = (k: string, v: string) => {
    const np = new URLSearchParams(params);
    if (!v || v === ALL) np.delete(k); else np.set(k, v);
    setParams(np, { replace: true });
  };
  const clear = () => setParams(new URLSearchParams(), { replace: true });

  const [arts, setArts] = useState<any[]>([]);
  const [prots, setProts] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [baixas, setBaixas] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [prazos, setPrazos] = useState<any[]>([]);
  const [govServ, setGovServ] = useState<any[]>([]);
  const [govBloco, setGovBloco] = useState<any[]>([]);
  const [govRel, setGovRel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [a, p, c, b, ct, pr, gs, gb, gr] = await Promise.all([
        sb.from("crea_arts").select("id,uf,status,data_emissao,valor,created_at").eq("is_deleted", false).limit(2000),
        sb.from("crea_protocols").select("id,uf,status,data_abertura,prazo_esperado").eq("is_deleted", false).limit(2000),
        sb.from("crea_certificates").select("id,uf,status,validade,data_emissao").eq("is_deleted", false).limit(2000),
        sb.from("crea_deregistrations").select("id,uf,status,created_at").eq("is_deleted", false).limit(2000),
        sb.from("crea_cats").select("id,uf,status,data_emissao").eq("is_deleted", false).limit(2000),
        sb.from("crea_deadlines").select("id,uf,status,prazo").eq("is_deleted", false).limit(2000),
        sb.from("crea_gov_servicos").select("id,analise,baixa,pagamento,cadastro").eq("is_deleted", false).limit(5000),
        sb.from("crea_gov_art_bloco").select("id,valor_art,valor_pago,situacao,data_inicio").eq("is_deleted", false).limit(5000),
        sb.from("crea_gov_relatorio_crea").select("id,valor_contrato,data_inicio,pagamento").eq("is_deleted", false).limit(5000),
      ]);
      setArts(a.data ?? []); setProts(p.data ?? []); setCerts(c.data ?? []);
      setBaixas(b.data ?? []); setCats(ct.data ?? []); setPrazos(pr.data ?? []);
      setGovServ(gs.data ?? []); setGovBloco(gb.data ?? []); setGovRel(gr.data ?? []);
      setLoading(false);
    })();
  }, []);

  const filt = (arr: any[], dateKey?: string) => arr.filter(r => {
    if (fUf !== ALL && r.uf !== fUf) return false;
    if (fStatus !== ALL && r.status !== fStatus) return false;
    if (fAno && dateKey && r[dateKey]) { if (!String(r[dateKey]).startsWith(fAno)) return false; }
    return true;
  });

  const today = new Date().toISOString().slice(0,10);
  const in30 = new Date(Date.now() + 30*864e5).toISOString().slice(0,10);

  const k = useMemo(() => {
    const fArts = filt(arts, "data_emissao");
    const fProts = filt(prots, "data_abertura");
    const fCerts = filt(certs, "data_emissao");
    return {
      arts: fArts.length,
      artsEmitidas: fArts.filter(x => x.status === "emitida" || x.status === "registrada").length,
      protAbertos: fProts.filter(x => x.status === "aberto").length,
      certVenc: fCerts.filter(x => x.validade && x.validade <= in30 && x.validade >= today).length,
      certVencidas: fCerts.filter(x => x.validade && x.validade < today).length,
      baixaPend: filt(baixas).filter(x => x.status === "pendente").length,
      cats: filt(cats, "data_emissao").length,
      prazos30: filt(prazos).filter(x => x.prazo && x.prazo <= in30).length,
      valorTotal: fArts.reduce((s, x) => s + Number(x.valor ?? 0), 0),
    };
  }, [arts, prots, certs, baixas, cats, prazos, fUf, fStatus, fAno]);

  const anosDisp = useMemo(() => {
    const set = new Set<string>();
    [...arts, ...prots, ...certs].forEach(r => {
      const d = r.data_emissao ?? r.data_abertura ?? r.created_at;
      if (d) set.add(String(d).slice(0,4));
    });
    return Array.from(set).sort().reverse();
  }, [arts, prots, certs]);

  const hasAny = fUf !== ALL || fStatus !== ALL || fAno || fRT;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HardHat className="w-6 h-6 text-primary" /> CREA & ART — Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">Visão geral filtrada (filtros persistem na URL).</p>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Filter className="w-4 h-4" /> Filtros</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <div>
            <Label className="text-xs">UF</Label>
            <Select value={fUf} onValueChange={(v) => setParam("uf", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>Todas</SelectItem>{UFS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={fStatus} onValueChange={(v) => setParam("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {["nao_iniciada","em_emissao","emitida","paga","registrada","baixada","aberto","deferido","pendente"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
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
            <Label className="text-xs">RT (busca livre)</Label>
            <Input value={fRT} onChange={(e) => setParam("rt", e.target.value)} placeholder="nome do RT…" />
          </div>
          <div className="flex items-end">
            {hasAny && <Button variant="ghost" onClick={clear}><X className="w-4 h-4 mr-1" /> Limpar</Button>}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <KpiCard label="ARTs (filtradas)" value={loading ? "…" : k.arts} accent />
        <KpiCard label="ARTs emitidas/registradas" value={loading ? "…" : k.artsEmitidas} />
        <KpiCard label="Valor total ARTs (R$)" value={loading ? "…" : k.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} />
        <KpiCard label="Protocolos abertos" value={loading ? "…" : k.protAbertos} />
        <KpiCard label="Certidões vencendo (30d)" value={loading ? "…" : k.certVenc} />
        <KpiCard label="Certidões vencidas" value={loading ? "…" : k.certVencidas} />
        <KpiCard label="Baixas pendentes" value={loading ? "…" : k.baixaPend} />
        <KpiCard label="CATs" value={loading ? "…" : k.cats} />
        <KpiCard label="Prazos próximos (30d)" value={loading ? "…" : k.prazos30} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-2 mt-2 uppercase tracking-wider">Governança ART · consolidado</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <KpiCard label="Serviços (relatório gerencial)" value={loading ? "…" : govServ.length} />
          <KpiCard label="ARTs por bloco" value={loading ? "…" : govBloco.length} />
          <KpiCard label="Linhas Relatórios CREA" value={loading ? "…" : govRel.length} />
          <KpiCard
            label="Valor ART (bloco) R$"
            value={loading ? "…" : govBloco.reduce((s, x) => s + Number(x.valor_art ?? 0), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          />
          <KpiCard
            label="Valor pago (bloco) R$"
            value={loading ? "…" : govBloco.reduce((s, x) => s + Number(x.valor_pago ?? 0), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          />
          <KpiCard
            label="Valor contrato (relatório) R$"
            value={loading ? "…" : govRel.reduce((s, x) => s + Number(x.valor_contrato ?? 0), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Próximos passos</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>• Filtros aplicados: {hasAny ? <Badge variant="outline">{[fUf!==ALL&&`UF=${fUf}`, fStatus!==ALL&&`Status=${fStatus}`, fAno&&`Ano=${fAno}`, fRT&&`RT=${fRT}`].filter(Boolean).join(" · ")}</Badge> : "nenhum"}</p>
          <p>• Use a aba <strong>Assistente IA → Conversor de Documentos</strong> para transformar PDFs/Word do CREA em CSV.</p>
          <p>• Em <strong>Admin → Integrações</strong> habilite scraping/RPA quando autorizado.</p>
        </CardContent>
      </Card>
    </div>
  );
}
