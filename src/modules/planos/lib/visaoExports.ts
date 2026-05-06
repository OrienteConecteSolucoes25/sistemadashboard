import * as XLSX from "xlsx";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, WidthType, ImageRun } from "docx";
import PptxGenJS from "pptxgenjs";

export type VisaoRow = { modulo: string; total: number; counts: Record<string, number> };
export type VisaoBranding = { logo_url?: string | null; primary_color?: string | null; rodape?: string | null; nome?: string | null };

const trigger = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

async function fetchAsBase64(url: string): Promise<string | null> {
  try {
    const r = await fetch(url);
    const blob = await r.blob();
    return await new Promise((res) => {
      const fr = new FileReader();
      fr.onloadend = () => res(fr.result as string);
      fr.readAsDataURL(blob);
    });
  } catch { return null; }
}

const BUCKETS = ["atrasado","em_aberto","em_andamento","pendente","concluido","finalizado","entregue","emitido"];

export async function exportVisaoXlsx(rows: VisaoRow[], filtros: string, branding: VisaoBranding) {
  const header = ["Módulo", "Total", ...BUCKETS];
  const data = rows.map((r) => [r.modulo, r.total, ...BUCKETS.map((b) => r.counts[b] ?? 0)]);
  const aoa = [
    [`Visão Geral · ${branding.nome ?? "OCS"}`],
    [filtros],
    [],
    header,
    ...data,
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 24 }, { wch: 8 }, ...BUCKETS.map(() => ({ wch: 13 }))];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Visão Geral");
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  trigger(new Blob([out]), `visao_geral_${Date.now()}.xlsx`);
}

export async function exportVisaoDocx(rows: VisaoRow[], filtros: string, branding: VisaoBranding) {
  const header = ["Módulo", "Total", ...BUCKETS];
  const headerRow = new TableRow({
    children: header.map((h) => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
      shading: { fill: "E5EAF0", type: "clear", color: "auto" } as any,
    })),
  });
  const bodyRows = rows.map((r) => new TableRow({
    children: [r.modulo, String(r.total), ...BUCKETS.map((b) => String(r.counts[b] ?? 0))]
      .map((v) => new TableCell({ children: [new Paragraph(v)] })),
  }));

  const headerChildren: any[] = [];
  if (branding.logo_url) {
    const b64 = await fetchAsBase64(branding.logo_url);
    if (b64) {
      const bin = Uint8Array.from(atob(b64.split(",")[1]), (c) => c.charCodeAt(0));
      headerChildren.push(new Paragraph({ children: [new ImageRun({ data: bin, transformation: { width: 120, height: 60 } } as any)] }));
    }
  }
  headerChildren.push(
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(`Visão Geral · ${branding.nome ?? "OCS"}`)] }),
    new Paragraph({ children: [new TextRun({ text: filtros, italics: true })] }),
    new Paragraph(""),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...bodyRows] }),
  );
  if (branding.rodape) headerChildren.push(new Paragraph(""), new Paragraph({ children: [new TextRun({ text: branding.rodape, italics: true, size: 18 })] }));

  const doc = new Document({ sections: [{ children: headerChildren }] });
  const blob = await Packer.toBlob(doc);
  trigger(blob, `visao_geral_${Date.now()}.docx`);
}

export async function exportVisaoPptx(rows: VisaoRow[], filtros: string, branding: VisaoBranding) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  const accent = branding.primary_color || "#2BBDC0";

  // Capa
  const cover = pptx.addSlide();
  cover.background = { color: "F8FAFC" };
  if (branding.logo_url) {
    const b64 = await fetchAsBase64(branding.logo_url);
    if (b64) cover.addImage({ data: b64, x: 0.5, y: 0.5, w: 1.6, h: 0.8 });
  }
  cover.addText(`Visão Geral · ${branding.nome ?? "OCS"}`, { x: 0.5, y: 2, w: 12, h: 1, fontSize: 36, bold: true, color: accent.replace("#","") });
  cover.addText(filtros, { x: 0.5, y: 3, w: 12, h: 0.5, fontSize: 16, color: "555555" });
  cover.addText(new Date().toLocaleString("pt-BR"), { x: 0.5, y: 6.8, w: 12, h: 0.3, fontSize: 10, color: "888888" });

  // Tabela consolidada
  const table = pptx.addSlide();
  table.addText("Status por módulo", { x: 0.5, y: 0.3, w: 12, h: 0.5, fontSize: 22, bold: true, color: accent.replace("#","") });
  const head = ["Módulo","Total",...BUCKETS].map((h) => ({ text: h, options: { bold: true, fill: { color: "E5EAF0" } } }));
  const body = rows.map((r) => [r.modulo, String(r.total), ...BUCKETS.map((b) => String(r.counts[b] ?? 0))]);
  table.addTable([head as any, ...body], { x: 0.3, y: 0.9, w: 12.5, fontSize: 11, border: { type: "solid", pt: 0.5, color: "DDDDDD" } });
  if (branding.rodape) table.addText(branding.rodape, { x: 0.5, y: 7, w: 12, h: 0.3, fontSize: 9, italic: true, color: "888888" });

  // Slide por módulo
  for (const r of rows) {
    const s = pptx.addSlide();
    s.addText(r.modulo, { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, bold: true, color: accent.replace("#","") });
    s.addText(`Total: ${r.total}`, { x: 0.5, y: 1, w: 12, h: 0.4, fontSize: 16 });
    const data = BUCKETS.map((b) => ({ name: b, labels: [b], values: [r.counts[b] ?? 0] }));
    s.addChart(pptx.ChartType.bar, [{ name: "Status", labels: BUCKETS, values: BUCKETS.map((b) => r.counts[b] ?? 0) }] as any,
      { x: 0.5, y: 1.5, w: 12, h: 5, showLegend: false, chartColors: [accent.replace("#","")] });
  }

  await pptx.writeFile({ fileName: `visao_geral_${Date.now()}.pptx` });
}
