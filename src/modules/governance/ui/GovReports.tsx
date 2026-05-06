/**
 * Relatórios: gera DOCX executivo com KPIs do módulo + plano de ação.
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDown, Loader2 } from "lucide-react";
import { Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell, TextRun, AlignmentType, WidthType } from "docx";
import { saveAs } from "file-saver";
import { toast } from "sonner";

export function GovReports({ moduleKey }: { moduleKey: string }) {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data: ds } = await supabase.from("gov_datasets").select("name,source_filename,sheet_count,created_at").eq("module_key", moduleKey).eq("is_active", true).order("created_at", { ascending: false });
      const { data: ap } = await supabase.from("governance_action_plan").select("*").eq("module_key", moduleKey).order("created_at", { ascending: false });

      const moduleLabel = moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1);
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({ text: `Relatório de Governança — ${moduleLabel}`, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: `Período: ${period}`, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: " " }),
            new Paragraph({ text: "1. Datasets ativos", heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ text: `Total de planilhas mestres: ${ds?.length ?? 0}` }),
            ...(ds ?? []).map((d: any) => new Paragraph({ children: [new TextRun({ text: `• ${d.name} `, bold: true }), new TextRun(`(${d.sheet_count} abas, importada em ${new Date(d.created_at).toLocaleDateString("pt-BR")})`)] })),
            new Paragraph({ text: " " }),
            new Paragraph({ text: "2. Plano de Ação", heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ text: `Total de ações: ${ap?.length ?? 0}` }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({ children: ["Título", "Responsável", "Prazo", "Status", "Prioridade"].map((h) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] })) }),
                ...((ap ?? []) as any[]).map((a) => new TableRow({ children: [a.titulo, a.responsavel ?? "—", a.prazo ? new Date(a.prazo).toLocaleDateString("pt-BR") : "—", a.status, a.prioridade].map((v) => new TableCell({ children: [new Paragraph(String(v))] })) })),
              ],
            }),
          ],
        }],
      });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `governanca-${moduleKey}-${period}.docx`);
      toast.success("Relatório gerado");
    } catch (e: any) {
      toast.error(`Erro: ${e?.message ?? e}`);
    } finally { setLoading(false); }
  };

  return (
    <Card><CardContent className="p-4 space-y-3">
      <div className="text-sm font-semibold">Relatório executivo (DOCX)</div>
      <div className="flex items-end gap-3">
        <div><Label>Período</Label><Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} /></div>
        <Button onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <FileDown className="h-3.5 w-3.5 mr-1" />}Gerar DOCX
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">O relatório agrega datasets ativos, total de linhas e plano de ação completo do módulo.</p>
    </CardContent></Card>
  );
}
