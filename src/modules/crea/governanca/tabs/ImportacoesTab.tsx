import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useGovCompany } from "../lib/useGovCompany";
import { parseArtFile, hashArt, ParsedArtRow } from "../lib/govParse";
import { UFS_BR } from "../lib/govTypes";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ImportRow = {
  id: string;
  arquivo_nome: string | null;
  uf: string | null;
  kind: string | null;
  total_linhas: number | null;
  ok: number | null;
  falhas: number | null;
  status: string;
  ran_at: string;
};

export const IMPORT_KINDS: { value: string; label: string; hint: string }[] = [
  { value: "arts_extraidas",       label: "1. ARTs extraídas",                  hint: "Planilha base com nº ART, RT, contratante, valores, datas." },
  { value: "relatorio_crea_art",   label: "2. Relatório CREA BA — ART",         hint: "Exportação oficial do CREA BA com status analítico/financeiro." },
  { value: "relatorio_servicos",   label: "3. Relatório de serviços CREA",      hint: "Atividades técnicas, código TOS, quantidade e unidade." },
  { value: "financeiro_baixas",    label: "4. Financeiro / baixas / pagamentos", hint: "Boletos, pagamentos, baixas e conciliação financeira." },
];

export function ImportacoesTab() {
  const { companyId } = useGovCompany();
  const [uf, setUf] = useState<string>("BA");
  const [kind, setKind] = useState<string>("arts_extraidas");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [history, setHistory] = useState<ImportRow[]>([]);
  const [reload, setReload] = useState(0);
  const [lastSummary, setLastSummary] = useState<null | {
    arquivo: string; kind: string; total: number; ok: number; fail: number;
    semNumero: number; semUf: number; semDataCadastro: number; valorInvalido: number;
    duplicadosNoArquivo: number; encodingSuspeito: number; dataInvalida: number;
    artsReconhecidas: number; registrosIncompletos: number;
    unmappedHeaders: string[]; errosLog: { linha: number; tipo: string; detalhe: string }[];
  }>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!companyId) return;
    supabase.from("crea_gov_importacoes")
      .select("id,arquivo_nome,uf,kind,total_linhas,ok,falhas,status,ran_at")
      .eq("company_id", companyId).order("ran_at", { ascending: false }).limit(20)
      .then(({ data }) => setHistory((data as ImportRow[]) ?? []));
  }, [companyId, reload]);

  async function ensureContratante(name: string): Promise<string | null> {
    if (!name || !companyId) return null;
    const trimmed = name.trim();
    const { data: ex } = await supabase.from("crea_gov_contratantes")
      .select("id").eq("company_id", companyId).ilike("nome", trimmed).maybeSingle();
    if (ex?.id) return ex.id;
    const { data: ins } = await supabase.from("crea_gov_contratantes")
      .insert({ company_id: companyId, nome: trimmed }).select("id").single();
    return ins?.id ?? null;
  }

  async function handleImport() {
    if (!file || !companyId) return;
    setBusy(true); setProgress("Lendo arquivo…");
    try {
      const parsed = await parseArtFile(file);
      if (parsed.rows.length === 0) {
        toast.warning("Nenhuma linha válida detectada no arquivo.");
        setBusy(false); return;
      }
      setProgress(`${parsed.rows.length} linhas detectadas. Validando…`);

      // ── Validação técnica (não-destrutiva) ────────────────────────
      const valStats = {
        semNumero: 0, semUf: 0, semDataCadastro: 0, valorInvalido: 0,
        duplicadosNoArquivo: 0, encodingSuspeito: 0, dataInvalida: 0,
        artsReconhecidas: 0, registrosIncompletos: 0,
      };
      const errosLog: { linha: number; tipo: string; detalhe: string }[] = [];
      const seenHash = new Set<string>();
      const ENC_RX = /[ÃÂ�]\w|Ã[©£§ª¡]|â€/; // mojibake típico de UTF-8↔Latin1
      const isISODate = (s: any) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
      let linhaIdx = 0;
      for (const r of parsed.rows) {
        linhaIdx++;
        const push = (tipo: string, detalhe: string) => {
          if (errosLog.length < 50) errosLog.push({ linha: linhaIdx, tipo, detalhe });
        };
        if (!r.numero) { valStats.semNumero++; push("sem_numero", "ART sem número identificado"); }
        else valStats.artsReconhecidas++;
        if (!r.uf && !uf) { valStats.semUf++; push("sem_uf", "UF do CREA ausente e sem default"); }
        if (!r.data_cadastro) { valStats.semDataCadastro++; push("sem_data_cadastro", "Data de cadastro ausente"); }
        else if (!isISODate(r.data_cadastro)) { valStats.dataInvalida++; push("data_invalida", `data_cadastro=${r.data_cadastro}`); }
        if (r.data_pagamento && !isISODate(r.data_pagamento)) { valStats.dataInvalida++; push("data_invalida", `data_pagamento=${r.data_pagamento}`); }
        const vt = Number(r.valor_taxa); const vp = Number(r.valor_pago);
        if ((r.valor_taxa != null && Number.isNaN(vt)) || (r.valor_pago != null && Number.isNaN(vp))) {
          valStats.valorInvalido++; push("valor_invalido", `taxa=${r.valor_taxa} pago=${r.valor_pago}`);
        }
        // encoding suspeito em strings textuais
        const txt = `${r.contratante_nome ?? ""}|${r.rt_nome ?? ""}|${r.atividades_texto ?? ""}|${r.proprietario ?? ""}|${r.endereco ?? ""}`;
        if (ENC_RX.test(txt)) { valStats.encodingSuspeito++; push("encoding", "Caracteres suspeitos (mojibake) em campos textuais"); }
        // registro incompleto: faltam pelo menos 2 dos campos chave
        const faltantes = [r.numero, r.contratante_nome, r.rt_nome, r.data_cadastro].filter((x) => !x).length;
        if (faltantes >= 2) { valStats.registrosIncompletos++; push("incompleto", `${faltantes} campos-chave ausentes`); }
        const key = `${(r.uf ?? uf ?? "BA").toString().trim().toUpperCase()}::${(r.numero ?? "").toString().trim()}::${r.data_cadastro ?? ""}`;
        if (seenHash.has(key)) { valStats.duplicadosNoArquivo++; push("duplicado_arquivo", `chave=${key}`); }
        else seenHash.add(key);
      }

      const { data: imp, error: impErr } = await supabase.from("crea_gov_importacoes").insert({
        company_id: companyId, uf, kind, arquivo_nome: file.name,
        total_linhas: parsed.rows.length, status: "processando",
        mapeamento: {
          unmappedHeaders: parsed.unmappedHeaders,
          origem_importacao: kind,
          validacao: valStats,
        },
      }).select("id").single();
      if (impErr || !imp) throw new Error(impErr?.message ?? "Falha ao registrar importação");

      const contratanteCache = new Map<string, string>();
      const payloads: any[] = [];
      let i = 0;
      for (const r of parsed.rows) {
        i++;
        if (i % 50 === 0) setProgress(`Preparando ${i}/${parsed.rows.length}…`);
        if (!r.numero) continue;
        let contratante_id: string | null = null;
        if (r.contratante_nome) {
          const k = r.contratante_nome.trim().toLowerCase();
          if (contratanteCache.has(k)) contratante_id = contratanteCache.get(k)!;
          else { contratante_id = await ensureContratante(r.contratante_nome); if (contratante_id) contratanteCache.set(k, contratante_id); }
        }
        const ufCrea = (r.uf ?? uf ?? "BA").toString().trim().toUpperCase() || "BA";
        const hash = await hashArt(ufCrea, r.numero, r.data_cadastro, r.empresa_nome);
        payloads.push({
          company_id: companyId,
          numero: r.numero, uf: ufCrea,
          tipo: r.tipo, natureza: r.natureza, participacao_tecnica: r.participacao_tecnica, forma_registro: r.forma_registro,
          contratante_id, proprietario: r.proprietario,
          endereco: r.endereco, cidade: r.cidade, uf_obra: r.uf_obra, cep: r.cep,
          observacao: r.observacao, atividades_texto: r.atividades_texto, codigo_tos: r.codigo_tos,
          quantidade: r.quantidade, unidade_medida: r.unidade_medida,
          valor_taxa: r.valor_taxa, valor_pago: r.valor_pago, valor_contrato: r.valor_contrato,
          centro_custo: r.centro_custo,
          data_cadastro: r.data_cadastro, data_pagamento: r.data_pagamento,
          data_vencimento: r.data_vencimento, data_baixa: r.data_baixa,
          status_analise: r.status_analise, status_baixa: r.status_baixa, status_financeiro: r.status_financeiro,
          boleto_numero: r.boleto_numero,
          arquivo_origem_id: imp.id, raw: r.raw, hash_unico: hash,
        });
      }

      let ok = 0, fail = 0;
      const chunkSize = 200;
      for (let j = 0; j < payloads.length; j += chunkSize) {
        setProgress(`Enviando ${Math.min(j + chunkSize, payloads.length)}/${payloads.length}…`);
        const chunk = payloads.slice(j, j + chunkSize);
        const { error } = await supabase.from("crea_gov_arts").upsert(chunk, { onConflict: "hash_unico", ignoreDuplicates: false });
        if (error) {
          // tenta linha-a-linha para contar precisamente
          for (const p of chunk) {
            const { error: e2 } = await supabase.from("crea_gov_arts").upsert(p, { onConflict: "hash_unico" });
            if (e2) fail++; else ok++;
          }
        } else ok += chunk.length;
      }

      await supabase.from("crea_gov_importacoes")
        .update({ ok, falhas: fail, status: fail === 0 ? "concluido" : "concluido_com_erros" })
        .eq("id", imp.id);

      setLastSummary({
        arquivo: file.name, kind, total: parsed.rows.length, ok, fail,
        ...valStats, unmappedHeaders: parsed.unmappedHeaders, errosLog,
      });

      toast.success(`Importação concluída: ${ok} OK, ${fail} falhas. ${parsed.unmappedHeaders.length ? `Cabeçalhos não mapeados: ${parsed.unmappedHeaders.length}.` : ""}`);
      setProgress(""); setFile(null); if (fileRef.current) fileRef.current.value = "";
      setReload((r) => r + 1);
    } catch (e: any) {
      toast.error("Falha na importação: " + (e?.message ?? e));
      setProgress("");
    } finally { setBusy(false); }
  }

  if (!companyId) return <Card><CardContent className="p-6 text-sm text-muted-foreground">Você precisa estar vinculado a uma empresa.</CardContent></Card>;

  return (
    <div className="space-y-3">
      <Card className="card-elegant">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Upload className="h-4 w-4" /> Importar relatório do CREA</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Aceita .xlsx, .xls e .csv exportados do SITAC/portal CREA. As colunas são detectadas automaticamente; cabeçalhos não reconhecidos vão para o JSON bruto da ART e podem ser mapeados depois. Linhas com mesmo (UF + número + cadastro + empresa) são atualizadas (upsert).</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
            <div>
              <Label className="text-xs">Tipo de importação</Label>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {IMPORT_KINDS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1">{IMPORT_KINDS.find(k => k.value === kind)?.hint}</p>
            </div>
            <div>
              <Label className="text-xs">UF do CREA (default)</Label>
              <Select value={uf} onValueChange={setUf}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{UFS_BR.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Arquivo</Label>
              <Input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="h-9" onChange={(e) => setFile(e.target.files?.[0] ?? null)} disabled={busy} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleImport} disabled={!file || busy}>{busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-1" />} Importar</Button>
            {progress && <span className="text-xs text-muted-foreground">{progress}</span>}
          </div>
        </CardContent>
      </Card>

      {lastSummary && (
        <Card className="card-elegant border-primary/40">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Resumo técnico — {lastSummary.arquivo}
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">
              {IMPORT_KINDS.find(k => k.value === lastSummary.kind)?.label ?? lastSummary.kind}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <SummaryStat label="Linhas no arquivo" value={lastSummary.total} />
              <SummaryStat label="Importadas (OK)" value={lastSummary.ok} tone="ok" />
              <SummaryStat label="Falhas" value={lastSummary.fail} tone={lastSummary.fail > 0 ? "fail" : undefined} />
              <SummaryStat label="Duplicadas no arquivo" value={lastSummary.duplicadosNoArquivo} tone={lastSummary.duplicadosNoArquivo > 0 ? "warn" : undefined} />
              <SummaryStat label="Sem nº ART" value={lastSummary.semNumero} tone={lastSummary.semNumero > 0 ? "warn" : undefined} />
              <SummaryStat label="Sem UF" value={lastSummary.semUf} tone={lastSummary.semUf > 0 ? "warn" : undefined} />
              <SummaryStat label="Sem data cadastro" value={lastSummary.semDataCadastro} tone={lastSummary.semDataCadastro > 0 ? "warn" : undefined} />
              <SummaryStat label="Valores inválidos" value={lastSummary.valorInvalido} tone={lastSummary.valorInvalido > 0 ? "warn" : undefined} />
            </div>
            {lastSummary.unmappedHeaders.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/40">
                <p className="text-[11px] font-semibold text-muted-foreground mb-1">
                  {lastSummary.unmappedHeaders.length} cabeçalho(s) não mapeado(s) — preservados em RAW:
                </p>
                <div className="flex flex-wrap gap-1">
                  {lastSummary.unmappedHeaders.slice(0, 30).map((h, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] font-mono">{h}</Badge>
                  ))}
                  {lastSummary.unmappedHeaders.length > 30 && (
                    <span className="text-[10px] text-muted-foreground self-center">+{lastSummary.unmappedHeaders.length - 30}</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="card-elegant">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Histórico de importações</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Arquivo</TableHead><TableHead>UF</TableHead><TableHead className="text-right">Linhas</TableHead><TableHead className="text-right">OK</TableHead><TableHead className="text-right">Falhas</TableHead><TableHead>Status</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {history.map((h) => {
                const k = IMPORT_KINDS.find(x => x.value === h.kind);
                return (
                <TableRow key={h.id}>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(h.ran_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-xs"><Badge variant="secondary" className="text-[10px]">{k?.label ?? h.kind ?? "—"}</Badge></TableCell>
                  <TableCell className="text-xs">{h.arquivo_nome ?? "—"}</TableCell>
                  <TableCell className="text-xs">{h.uf ?? "—"}</TableCell>
                  <TableCell className="text-xs text-right">{h.total_linhas ?? 0}</TableCell>
                  <TableCell className="text-xs text-right text-emerald-600">{h.ok ?? 0}</TableCell>
                  <TableCell className="text-xs text-right text-rose-600">{h.falhas ?? 0}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{h.status === "concluido" ? <><CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />OK</> : h.status === "concluido_com_erros" ? <><AlertTriangle className="h-3 w-3 mr-1 text-amber-600" />Com erros</> : h.status}</Badge></TableCell>
                </TableRow>
                );
              })}
              {history.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-6">Nenhuma importação ainda.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone?: "ok" | "warn" | "fail" }) {
  const cls =
    tone === "ok"   ? "text-emerald-600"
  : tone === "fail" ? "text-rose-600"
  : tone === "warn" ? "text-amber-600"
  : "text-foreground";
  return (
    <div className="rounded-md border border-border/40 p-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${cls}`}>{value}</p>
    </div>
  );
}
