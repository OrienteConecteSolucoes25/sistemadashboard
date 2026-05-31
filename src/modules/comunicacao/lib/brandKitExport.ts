import jsPDF from "jspdf";
import { saveAs } from "file-saver";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun,
} from "docx";

type Brand = any;

const arr = (v: any): string[] =>
  Array.isArray(v) ? v.filter(Boolean) : typeof v === "string" && v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];

const field = (label: string, value: any): [string, string] | null => {
  const s = Array.isArray(value) ? value.join(", ") : (value ?? "").toString().trim();
  return s ? [label, s] : null;
};

function brandSections(b: Brand) {
  return {
    identidade: [
      field("Nome", b.nome),
      field("Slogan", b.slogan),
      field("Segmento", b.segmento),
      field("Website", b.website),
      field("Descrição", b.descricao),
    ].filter(Boolean) as [string, string][],
    institucional: [
      field("Missão", b.missao),
      field("Visão", b.visao),
      field("Valores", b.valores),
      field("Proposta de valor", b.proposta_valor),
      field("Diferenciais", b.diferenciais),
    ].filter(Boolean) as [string, string][],
    voz: [
      field("Público-alvo", b.publico_alvo),
      field("Persona", b.persona),
      field("Tom de voz", b.tom_de_voz),
      field("Tipo de linguagem", b.tipo_linguagem),
      field("CTA padrão", b.cta_padrao),
      field("Palavras permitidas", arr(b.palavras_permitidas)),
      field("Palavras proibidas", arr(b.palavras_proibidas)),
    ].filter(Boolean) as [string, string][],
    visual: [
      field("Cores principais", arr(b.cores_principais)),
      field("Cores secundárias", arr(b.cores_secundarias)),
      field("Fontes", arr(b.fontes)),
      field("Estilo visual", b.estilo_visual),
    ].filter(Boolean) as [string, string][],
    extras: [field("Observações", b.observacoes)].filter(Boolean) as [string, string][],
  };
}

async function urlToDataUrl(url: string): Promise<{ data: string; mime: string } | null> {
  try {
    const r = await fetch(url, { mode: "cors" });
    const blob = await r.blob();
    const mime = blob.type || "image/png";
    const data = await new Promise<string>((res) => {
      const fr = new FileReader();
      fr.onloadend = () => res(fr.result as string);
      fr.readAsDataURL(blob);
    });
    return { data, mime };
  } catch { return null; }
}

// ========== PDF ==========
export async function exportBrandKitPdf(b: Brand) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 15;
  let y = M;

  const primary = (arr(b.cores_principais)[0] || "#2BBDC0").replace("#", "");
  const rgb = (hex: string) => [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)] as [number, number, number];
  const [pr, pg, pb] = rgb(primary.padEnd(6, "0").slice(0, 6));

  // Header
  doc.setFillColor(pr, pg, pb);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255);
  doc.setFontSize(20);
  doc.text(b.nome || "Brand Kit", M, 13);
  doc.setFontSize(10);
  if (b.slogan) doc.text(`"${b.slogan}"`, M, 20);
  doc.text(`Brand Kit · ${new Date().toLocaleDateString("pt-BR")}`, W - M, 20, { align: "right" });
  y = 36;

  // Logo
  if (b.logo_url) {
    const img = await urlToDataUrl(b.logo_url);
    if (img) {
      try { doc.addImage(img.data, "PNG", M, y, 35, 35); y = Math.max(y + 38, y); } catch {}
    }
  }

  doc.setTextColor(20);

  const drawSection = (title: string, rows: [string, string][]) => {
    if (rows.length === 0) return;
    if (y > 260) { doc.addPage(); y = M; }
    doc.setFillColor(245);
    doc.rect(M, y, W - M * 2, 7, "F");
    doc.setFontSize(12);
    doc.setTextColor(pr, pg, pb);
    doc.text(title, M + 2, y + 5);
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(20);
    for (const [k, v] of rows) {
      const lines: string[] = doc.splitTextToSize(`${k}: ${v}`, W - M * 2);
      if (y + lines.length * 5 > 285) { doc.addPage(); y = M; }
      (doc as any).text(lines, M, y);
      y += lines.length * 5 + 1;
    }
    y += 2;
  };

  const s = brandSections(b);
  drawSection("Identidade", s.identidade);
  drawSection("Institucional", s.institucional);
  drawSection("Voz & Mensagem", s.voz);
  drawSection("Visual", s.visual);

  // Palette swatches
  const cores = [...arr(b.cores_principais), ...arr(b.cores_secundarias)];
  if (cores.length) {
    if (y > 250) { doc.addPage(); y = M; }
    doc.setFontSize(12); doc.setTextColor(pr, pg, pb); doc.text("Paleta", M, y); y += 5;
    let x = M;
    for (const c of cores) {
      const hex = c.replace("#", "").padEnd(6, "0").slice(0, 6);
      const [r, g, bl] = rgb(hex);
      doc.setFillColor(r, g, bl); doc.rect(x, y, 18, 18, "F");
      doc.setTextColor(40); doc.setFontSize(8); doc.text(`#${hex}`, x, y + 22);
      x += 22;
      if (x + 18 > W - M) { x = M; y += 28; }
    }
    y += 28;
  }

  drawSection("Extras", s.extras);

  doc.save(`brandkit_${(b.nome || "marca").replace(/[^a-z0-9-_]+/gi, "_").toLowerCase()}.pdf`);
}

// ========== DOCX ==========
export async function exportBrandKitDocx(b: Brand) {
  const primary = (arr(b.cores_principais)[0] || "#2BBDC0").replace("#", "");
  const s = brandSections(b);

  const sectionToTable = (rows: [string, string][]) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: rows.map(([k, v]) => new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: k, bold: true })] })],
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            children: [new Paragraph(v)],
          }),
        ],
      })),
    });

  const heading = (text: string) =>
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, color: primary })] });

  const children: any[] = [];

  // Logo
  if (b.logo_url) {
    const img = await urlToDataUrl(b.logo_url);
    if (img) {
      try {
        const b64 = img.data.split(",")[1];
        const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new ImageRun({ type: "png", data: bin, transformation: { width: 120, height: 120 } } as any)],
        }));
      } catch {}
    }
  }

  children.push(
    new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, children: [new TextRun({ text: b.nome || "Brand Kit", bold: true, color: primary })] }),
  );
  if (b.slogan) children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `"${b.slogan}"`, italics: true })] }));
  children.push(new Paragraph(""));

  const blocks: [string, [string, string][]][] = [
    ["Identidade", s.identidade], ["Institucional", s.institucional],
    ["Voz & Mensagem", s.voz], ["Visual", s.visual], ["Extras", s.extras],
  ];
  for (const [title, rows] of blocks) {
    if (rows.length === 0) continue;
    children.push(heading(title));
    children.push(sectionToTable(rows));
    children.push(new Paragraph(""));
  }

  // Paleta
  const cores = [...arr(b.cores_principais), ...arr(b.cores_secundarias)];
  if (cores.length) {
    children.push(heading("Paleta"));
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({
        children: cores.map((c) => {
          const hex = c.replace("#", "").padEnd(6, "0").slice(0, 6).toUpperCase();
          return new TableCell({
            shading: { fill: hex, type: "clear", color: "auto" } as any,
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: " ", size: 32 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `#${hex}`, bold: true })] }),
            ],
          });
        }),
      })],
    }));
  }

  const doc = new Document({
    creator: "OCS Comunicação",
    title: `Brand Kit · ${b.nome ?? ""}`,
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `brandkit_${(b.nome || "marca").replace(/[^a-z0-9-_]+/gi, "_").toLowerCase()}.docx`);
}
