import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, FileText, FileType2, Loader2 } from "lucide-react";
import { useGovCompany } from "../lib/useGovCompany";
import { fetchArts, fetchConciliacoes, fetchAlertas, GovArt } from "../lib/govApi";
import { GovFilters } from "../lib/govTypes";
import { supabase } from "@/integrations/supabase/client";
import { exportData } from "@/lib/dataIO";
import type { FieldSchema } from "@/modules/engenharia/ui/crud/types";
import { toast } from "sonner";

type Template = "art_crea_pb" | "arts_resumo" | "financeiro" | "vencidas" | "conciliacao_divergencias" | "alertas_abertos";

// Prefixo de aba — todos os arquivos exportados/modelo desta aba começam com isso.
const TAB_PREFIX = "Governanca_ART__Relatorio_Gerencial";

const TEMPLATES: { value: Template; label: string; desc: string }[] = [
  { value: "art_crea_pb", label: "ART CREA — completo (padrão CREA-PB)", desc: "Espelha exatamente as 23 colunas da planilha oficial do CREA-PB (ART, Tipo, Participação Técnica, Forma de Registro, Pagamento, Taxa Paga, Cadastro, Observação, Contratante e CNPJ, Proprietário e CNPJ, número, valor do contrato, datas, endereços, atividades, nível, atividade subordinada, atividade/serviço, quantidade e unidade de medida)." },
  { value: "arts_resumo", label: "ARTs — resumo", desc: "Lista enxuta (número, UF, RT, contratante, valores, datas)." },
  { value: "financeiro", label: "Financeiro consolidado", desc: "Valores emitidos, pagos, pendentes por UF/mês." },
  { value: "vencidas", label: "ARTs vencidas e não pagas", desc: "Lista de pendências financeiras." },
  { value: "conciliacao_divergencias", label: "Conciliação — divergências", desc: "Boleto × ART com divergência ou sem par." },
  { value: "alertas_abertos", label: "Alertas abertos", desc: "Fila de auditoria pendente." },
];

const F = (key: string, label: string, type: FieldSchema["type"] = "text"): FieldSchema =>
  ({ key, label, type } as FieldSchema);

const SCHEMAS: Record<Template, FieldSchema[]> = {
  art_crea_pb: [
    F("ART", "ART"),
    F("Tipo", "Tipo"),
    F("Participação Técnica", "Participação Técnica"),
    F("Forma de Registro", "Forma de Registro"),
    F("Pagamento", "Pagamento"),
    F("Taxa Paga", "Taxa Paga", "number"),
    F("Cadastro", "Cadastro"),
    F("Observação", "Observação"),
    F("Contratante:", "Contratante:"),
    F("CNPJ do contratante:", "CNPJ do contratante:"),
    F("proprietário", "proprietário"),
    F("CNPJ do proprietario", "CNPJ do proprietario"),
    F("numero", "numero"),
    F("valor do contrato:", "valor do contrato:"),
    F("data de inicio:", "data de inicio:"),
    F("data de fim:", "data de fim:"),
    F("endereços", "endereços"),
    F("atividades", "atividades"),
    F("nível", "nível"),
    F("atividade subordinada", "atividade subordinada"),
    F("atividade/serviço", "atividade/serviço"),
    F("quantidade", "quantidade", "number"),
    F("unidade de medida", "unidade de medida"),
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
    F("numero", "Número"), F("uf", "UF"),
    F("empresa_nome", "Empresa"), F("contratante_nome", "Contratante"), F("rt_nome", "RT"),
    F("valor_taxa", "Valor", "number"),
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

type NameRec = { nome: string; cnpj: string };

async function fetchNameMap(table: string, ids: string[], cols = "id,nome,cnpj"): Promise<Record<string, NameRec>> {
  const out: Record<string, NameRec> = {};
  if (!ids.length) return out;
  const { data } = await supabase.from(table as any).select(cols).in("id", ids);
  (data ?? []).forEach((r: any) => {
    out[r.id] = {
      nome: r.nome ?? r.razao_social ?? r.nome_fantasia ?? r.full_name ?? "",
      cnpj: r.cnpj ?? "",
    };
  });
  return out;
}

async function enrichArts(arts: GovArt[]): Promise<any[]> {
  const empresaIds = Array.from(new Set(arts.map(a => a.empresa_id).filter(Boolean))) as string[];
  const contIds = Array.from(new Set(arts.map(a => a.contratante_id).filter(Boolean))) as string[];
  const rtIds = Array.from(new Set(arts.map(a => a.rt_id).filter(Boolean))) as string[];
  const [empresas, contratantes, rts] = await Promise.all([
    fetchNameMap("crea_empresas", empresaIds, "id,nome_fantasia,razao_social,cnpj"),
    fetchNameMap("crea_gov_contratantes", contIds, "id,nome,cnpj"),
    fetchNameMap("crea_rts", rtIds, "id,nome"),
  ]);
  return arts.map(a => {
    const emp = a.empresa_id ? empresas[a.empresa_id] : null;
    const con = a.contratante_id ? contratantes[a.contratante_id] : null;
    const rt = a.rt_id ? rts[a.rt_id] : null;
    return {
      ...a,
      empresa_nome: emp?.nome || "",
      empresa_cnpj: emp?.cnpj || "",
      contratante_nome: con?.nome || "",
      contratante_cnpj: con?.cnpj || "",
      rt_nome: rt?.nome || "",
    };
  });
}

// Mapeia uma ART enriquecida para as 23 colunas exatas da planilha oficial CREA-PB.
function mapToCreaPb(a: any): Record<string, any> {
  const fmtDate = (d: string | null | undefined) => {
    if (!d) return "";
    const [y, m, dd] = String(d).slice(0, 10).split("-");
    return y && m && dd ? `${dd}/${m}/${y}` : "";
  };
  const fmtMoney = (n: number | null | undefined) => {
    if (n == null || n === 0) return "";
    return `R$${Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  return {
    "ART": a.numero ?? "",
    "Tipo": a.tipo ?? "",
    "Participação Técnica": a.participacao_tecnica ?? "",
    "Forma de Registro": a.forma_registro ?? "",
    "Pagamento": fmtDate(a.data_pagamento),
    "Taxa Paga": a.valor_pago ?? "",
    "Cadastro": fmtDate(a.data_cadastro),
    "Observação": a.observacao ?? "",
    "Contratante:": a.contratante_nome ?? "",
    "CNPJ do contratante:": a.contratante_cnpj ?? "",
    "proprietário": a.proprietario ?? a.empresa_nome ?? "",
    "CNPJ do proprietario": a.empresa_cnpj ?? "",
    "numero": a.boleto_numero ?? "",
    "valor do contrato:": fmtMoney(a.valor_contrato),
    "data de inicio:": fmtDate(a.data_cadastro),
    "data de fim:": fmtDate(a.data_vencimento),
    "endereços": a.endereco ?? "",
    "atividades": a.atividades_texto ?? "",
    "nível": a.codigo_tos ?? "",
    "atividade subordinada": a.atividades_texto ?? "",
    "atividade/serviço": a.atividades_texto ?? "",
    "quantidade": a.quantidade ?? "",
    "unidade de medida": a.unidade_medida ?? "",
  };
}

export function RelatoriosTab({ filters }: { filters: GovFilters }) {
  const { companyId } = useGovCompany();
  const [template, setTemplate] = useState<Template>("art_crea_pb");
  const [format, setFormat] = useState<"xlsx" | "csv" | "docx">("xlsx");
  const [loading, setLoading] = useState(false);

  const tpl = useMemo(() => TEMPLATES.find(t => t.value === template)!, [template]);

  async function gerar() {
    if (!companyId) return;
    setLoading(true);
    try {
      let rows: any[] = [];
      const fields = SCHEMAS[template];

      if (template === "art_crea_pb") {
        const arts = await fetchArts(companyId, filters, 5000);
        const enriched = await enrichArts(arts);
        rows = enriched.map(mapToCreaPb);
      } else if (template === "arts_resumo") {
        const arts = await fetchArts(companyId, filters, 5000);
        rows = await enrichArts(arts);
      } else if (template === "financeiro") {
        const arts = await fetchArts(companyId, filters, 5000);
        rows = aggregateFinanceiro(arts);
      } else if (template === "vencidas") {
        const arts = await fetchArts(companyId, filters, 5000);
        const today = new Date();
        const venc = arts.filter(a => a.data_vencimento && a.data_vencimento < today.toISOString().slice(0, 10) && !a.data_pagamento);
        const enriched = await enrichArts(venc);
        rows = enriched.map(a => ({
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
        filename: `${TAB_PREFIX}__${template}__${new Date().toISOString().slice(0, 10)}`,
        title: `Governança ART · Relatório Gerencial · ${tpl.label}`,
      });
      toast.success(`Relatório gerado · ${rows.length} linha(s)`);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao gerar");
    } finally { setLoading(false); }
  }

  async function baixarModelo() {
    const fields = SCHEMAS[template];
    // 1 linha de exemplo vazia para preservar cabeçalhos no .xlsx/.csv
    const sample: any = {};
    fields.forEach(f => { sample[f.key] = ""; });
    await exportData({
      rows: [sample],
      fields,
      format: "xlsx",
      filename: `${TAB_PREFIX}__MODELO__${template}`,
      title: `Modelo · Governança ART · Relatório Gerencial · ${tpl.label}`,
    });
    toast.success("Modelo baixado");
  }

  return (
    <div className="space-y-4">
      <Card className="card-elegant">
        <CardHeader><CardTitle className="text-base">Relatórios Gerenciais — Governança ART</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Os filtros aplicados na barra acima são respeitados. Escolha um template e o formato de saída.
            Todos os arquivos gerados (relatórios e modelos) são prefixados com <code className="px-1 rounded bg-muted">{TAB_PREFIX}</code> para
            evitar confusão entre abas.
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

          <div className="flex flex-wrap gap-2">
            <Button onClick={gerar} disabled={loading || !companyId}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
               : format === "xlsx" ? <FileSpreadsheet className="h-4 w-4 mr-2" />
               : format === "docx" ? <FileType2 className="h-4 w-4 mr-2" />
               : <FileText className="h-4 w-4 mr-2" />}
              Gerar relatório
            </Button>
            <Button variant="outline" onClick={baixarModelo} disabled={loading}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Baixar modelo (.xlsx)
            </Button>
          </div>
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
