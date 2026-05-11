import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, FileText, FileType2, Loader2 } from "lucide-react";
import { useGovCompany } from "../lib/useGovCompany";
import { fetchArts, fetchPagamentos, fetchConciliacoes, fetchAlertas, GovArt } from "../lib/govApi";
import { GovFilters } from "../lib/govTypes";
import { supabase } from "@/integrations/supabase/client";
import { exportData } from "@/lib/dataIO";
import type { FieldSchema } from "@/modules/engenharia/ui/crud/types";
import { toast } from "sonner";

type Template = "arts_completo" | "arts_resumo" | "financeiro" | "vencidas" | "conciliacao_divergencias" | "alertas_abertos";

const TEMPLATES: { value: Template; label: string; desc: string }[] = [
  { value: "arts_completo", label: "ARTs — completo", desc: "Todas as ARTs com 30+ colunas filtradas pela barra acima." },
  { value: "arts_resumo", label: "ARTs — resumo", desc: "Lista enxuta (número, UF, RT, contratante, valores, datas)." },
  { value: "financeiro", label: "Financeiro consolidado", desc: "Valores emitidos, pagos, pendentes por UF/mês." },
  { value: "vencidas", label: "ARTs vencidas e não pagas", desc: "Lista de pendências financeiras." },
  { value: "conciliacao_divergencias", label: "Conciliação — divergências", desc: "Boleto × ART com divergência ou sem par." },
  { value: "alertas_abertos", label: "Alertas abertos", desc: "Fila de auditoria pendente." },
];

const F = (key: string, label: string, type: FieldSchema["type"] = "text"): FieldSchema =>
  ({ key, label, type } as FieldSchema);

const SCHEMAS: Record<Template, FieldSchema[]> = {
  arts_completo: [
    F("numero", "Número"), F("uf", "UF"), F("tipo", "Tipo"), F("natureza", "Natureza"),
    F("empresa_nome", "Empresa"), F("contratante_nome", "Contratante"), F("rt_nome", "RT"),
    F("cidade", "Cidade"), F("uf_obra", "UF Obra"), F("endereco", "Endereço"),
    F("proprietario", "Proprietário"), F("valor_taxa", "Valor Taxa", "number"),
    F("valor_pago", "Valor Pago", "number"), F("valor_contrato", "Valor Contrato", "number"),
    F("data_cadastro", "Cadastro", "date"), F("data_pagamento", "Pagamento", "date"),
    F("data_vencimento", "Vencimento", "date"), F("data_baixa", "Baixa", "date"),
    F("status_analise", "Status Análise"), F("status_baixa", "Status Baixa"),
    F("status_financeiro", "Status Financeiro"), F("boleto_numero", "Boleto"),
    F("centro_custo", "Centro Custo"), F("observacao", "Observação"),
  ],
  arts_resumo: [
    F("numero", "Número"), F("uf", "UF"), F("tipo", "Tipo"),
    F("empresa_nome", "Empresa"), F("contratante_nome", "Contratante"), F("rt_nome", "RT"),
    F("valor_taxa", "Valor Taxa", "number"), F("valor_pago", "Valor Pago", "number"),
    F("data_cadastro", "Cadastro", "date"), F("data_pagamento", "Pagamento", "date"),
    F("status_analise", "Status"),
  ],
  financeiro: [
    F("ano", "Ano", "number"), F("mes", "Mês", "number"), F("uf", "UF"),
    F("emitido", "Emitido", "number"), F("pago", "Pago", "number"), F("pendente", "Pendente", "number"),
    F("qtd", "Qtd ARTs", "number"),
  ],
  vencidas: [
    F("numero", "Número"), F("uf", "UF"), F("valor_taxa", "Valor", "number"),
    F("data_vencimento", "Vencimento", "date"), F("dias_atraso", "Dias atraso", "number"),
  ],
  conciliacao_divergencias: [
    F("art_numero", "ART"), F("art_valor", "ART Valor", "number"),
    F("boleto", "Boleto"), F("boleto_valor", "Boleto Valor", "number"),
    F("score", "Score", "number"), F("motivo", "Motivo"), F("status", "Status"),
  ],
  alertas_abertos: [
    F("tipo", "Tipo"), F("criticidade", "Criticidade"),
    F("numero", "ART"), F("uf", "UF"), F("prazo", "Prazo", "date"),
    F("observacoes", "Observações"),
  ],
};

function aggregateFinanceiro(arts: GovArt[]) {
  const m = new Map<string, { ano: number; mes: number; uf: string; emitido: number; pago: number; qtd: number }>();
  for (const a of arts) {
    const key = `${a.ano ?? 0}-${a.mes ?? 0}-${a.uf ?? "—"}`;
    const cur = m.get(key) ?? { ano: a.ano ?? 0, mes: a.mes ?? 0, uf: a.uf ?? "—", emitido: 0, pago: 0, qtd: 0 };
    cur.emitido += Number(a.valor_taxa ?? 0);
    cur.pago += Number(a.valor_pago ?? 0);
    cur.qtd += 1;
    m.set(key, cur);
  }
  return [...m.values()].map(r => ({ ...r, pendente: Math.max(0, r.emitido - r.pago) }))
    .sort((a, b) => b.ano - a.ano || b.mes - a.mes);
}

export function RelatoriosTab({ filters }: { filters: GovFilters }) {
  const { companyId } = useGovCompany();
  const [template, setTemplate] = useState<Template>("arts_completo");
  const [format, setFormat] = useState<"xlsx" | "csv" | "docx">("xlsx");
  const [loading, setLoading] = useState(false);

  const tpl = useMemo(() => TEMPLATES.find(t => t.value === template)!, [template]);

  async function gerar() {
    if (!companyId) return;
    setLoading(true);
    try {
      let rows: any[] = [];
      const fields = SCHEMAS[template];

      if (template === "arts_completo" || template === "arts_resumo") {
        rows = await fetchArts(companyId, filters, 5000);
      } else if (template === "financeiro") {
        const arts = await fetchArts(companyId, filters, 5000);
        rows = aggregateFinanceiro(arts);
      } else if (template === "vencidas") {
        const arts = await fetchArts(companyId, filters, 5000);
        const today = new Date();
        rows = arts.filter(a => a.data_vencimento && a.data_vencimento < today.toISOString().slice(0, 10) && !a.data_pagamento)
          .map(a => ({
            ...a,
            dias_atraso: Math.floor((today.getTime() - new Date(a.data_vencimento!).getTime()) / 86400000),
          }));
      } else if (template === "conciliacao_divergencias") {
        const cs = await fetchConciliacoes(companyId, "divergente");
        rows = cs.map((c: any) => ({
          art_numero: c.art?.numero ?? "—",
          art_valor: c.art?.valor_taxa ?? 0,
          boleto: c.pagamento?.numero_boleto ?? "—",
          boleto_valor: c.pagamento?.valor ?? 0,
          score: c.score, motivo: c.motivo, status: c.status,
        }));
      } else if (template === "alertas_abertos") {
        const al = await fetchAlertas(companyId, "aberto");
        rows = al.map((a: any) => ({
          tipo: a.tipo, criticidade: a.criticidade,
          numero: a.art?.numero ?? "—", uf: a.art?.uf ?? "—",
          prazo: a.prazo, observacoes: a.observacoes,
        }));
      }

      if (!rows.length) {
        toast.warning("Nenhum dado encontrado para os filtros atuais.");
        return;
      }
      await exportData({
        rows, fields, format,
        filename: `relatorio_${template}_${new Date().toISOString().slice(0, 10)}`,
        title: `Governança ART · ${tpl.label}`,
      });
      toast.success(`Relatório gerado · ${rows.length} linha(s)`);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao gerar");
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <Card className="card-elegant">
        <CardHeader><CardTitle className="text-base">Relatórios Gerenciais</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Os filtros aplicados na barra acima são respeitados. Escolha um template e o formato de saída.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Template</label>
              <Select value={template} onValueChange={(v) => setTemplate(v as Template)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">{tpl.desc}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Formato</label>
              <Select value={format} onValueChange={(v) => setFormat(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                  <SelectItem value="docx">Word (.docx)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={gerar} disabled={loading || !companyId}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
             : format === "xlsx" ? <FileSpreadsheet className="h-4 w-4 mr-2" />
             : format === "docx" ? <FileType2 className="h-4 w-4 mr-2" />
             : <FileText className="h-4 w-4 mr-2" />}
            Gerar relatório
          </Button>
        </CardContent>
      </Card>

      <Card className="card-elegant">
        <CardHeader><CardTitle className="text-base">Templates disponíveis</CardTitle></CardHeader>
        <CardContent>
          <ul className="text-sm space-y-2">
            {TEMPLATES.map(t => (
              <li key={t.value} className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 text-primary" />
                <div><b>{t.label}.</b> <span className="text-muted-foreground">{t.desc}</span></div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
