import * as XLSX from "xlsx";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  WidthType,
  AlignmentType,
} from "docx";
import type { FieldSchema } from "@/modules/engenharia/ui/crud/types";

export type IOFormat = "csv" | "xlsx" | "docx";

const sanitize = (name: string) => name.replace(/[^a-z0-9-_]+/gi, "_").toLowerCase();

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const toCellValue = (v: any, f: FieldSchema): string | number | boolean => {
  if (v === null || v === undefined) return "";
  if (f.type === "boolean") return v ? "sim" : "nao";
  if (f.type === "date") {
    try {
      return new Date(v).toLocaleDateString("pt-BR");
    } catch {
      return String(v);
    }
  }
  if (f.type === "number") return typeof v === "number" ? v : Number(v) || 0;
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

const fromCellValue = (v: any, f: FieldSchema): any => {
  if (v === null || v === undefined || v === "") return null;
  if (f.type === "boolean") {
    const s = String(v).toLowerCase().trim();
    return ["sim", "true", "1", "yes", "y", "x"].includes(s);
  }
  if (f.type === "number") {
    const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  if (f.type === "date") {
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    const s = String(v).trim();
    // dd/mm/yyyy
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    // already iso
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  return String(v);
};

// ========== EXPORT ==========

export const exportData = async (opts: {
  rows: any[];
  fields: FieldSchema[];
  filename: string;
  format: IOFormat;
  title?: string;
}) => {
  const { rows, fields, filename, format, title } = opts;
  const base = sanitize(filename);
  const headers = fields.map((f) => f.label);
  const matrix = rows.map((r) => fields.map((f) => toCellValue(r[f.key], f)));

  if (format === "csv") {
    const escape = (v: any) => {
      const s = String(v ?? "");
      return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers, ...matrix].map((row) => row.map(escape).join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    triggerDownload(blob, `${base}.csv`);
    return;
  }

  if (format === "xlsx") {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...matrix]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    triggerDownload(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${base}.xlsx`);
    return;
  }

  if (format === "docx") {
    const headerRow = new TableRow({
      children: headers.map(
        (h) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
            shading: { fill: "E5EAF0", type: "clear", color: "auto" } as any,
          })
      ),
    });
    const bodyRows = matrix.map(
      (row) =>
        new TableRow({
          children: row.map(
            (c) => new TableCell({ children: [new Paragraph(String(c ?? ""))] })
          ),
        })
    );
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(title || filename)] }),
            new Paragraph({ children: [new TextRun({ text: `Exportado em ${new Date().toLocaleString("pt-BR")}`, italics: true })] }),
            new Paragraph(""),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [headerRow, ...bodyRows],
            }),
          ],
        },
      ],
    });
    const blob = await Packer.toBlob(doc);
    triggerDownload(blob, `${base}.docx`);
    return;
  }
};

// ========== TEMPLATE ==========

export const downloadTemplate = async (opts: {
  fields: FieldSchema[];
  filename: string;
  format: IOFormat;
  title?: string;
}) => {
  const { fields, filename, format, title } = opts;
  const sample: Record<string, any> = {};
  fields.forEach((f) => {
    if (f.type === "boolean") sample[f.key] = "sim";
    else if (f.type === "number") sample[f.key] = 0;
    else if (f.type === "date") sample[f.key] = new Date().toISOString().slice(0, 10);
    else if (f.type === "select") sample[f.key] = (f.options ?? [])[0] ?? "";
    else sample[f.key] = `Exemplo ${f.label}`;
  });
  await exportData({
    rows: [sample],
    fields,
    filename: `modelo_${filename}`,
    format,
    title: `Modelo · ${title || filename}`,
  });
};

// ========== IMPORT (CSV / XLSX) ==========

export type ParsedImport = {
  headers: string[];
  rows: any[][];
};

const parseCSV = (text: string): ParsedImport => {
  const lines = text.replace(/^\ufeff/, "").split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const sep = lines[0].includes(";") ? ";" : ",";
  const splitLine = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (c === sep && !inQuotes) {
        out.push(cur); cur = "";
      } else cur += c;
    }
    out.push(cur);
    return out;
  };
  const headers = splitLine(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map(splitLine);
  return { headers, rows };
};

export const parseImportFile = async (file: File): Promise<ParsedImport> => {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) {
    return parseCSV(await file.text());
  }
  // xlsx / xls
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: true, defval: "" });
  if (aoa.length === 0) return { headers: [], rows: [] };
  const headers = (aoa[0] as any[]).map((h) => String(h ?? "").trim());
  const rows = aoa.slice(1).filter((r) => (r as any[]).some((c) => c !== "" && c !== null && c !== undefined));
  return { headers, rows: rows as any[][] };
};

export const mapImportedRowsToRecords = (parsed: ParsedImport, fields: FieldSchema[]) => {
  const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, "_");
  const headerToField = parsed.headers.map((h) => {
    const nh = norm(h);
    return (
      fields.find((f) => f.key === nh) ||
      fields.find((f) => norm(f.label) === nh) ||
      null
    );
  });
  return parsed.rows.map((row) => {
    const rec: Record<string, any> = {};
    row.forEach((cell, i) => {
      const f = headerToField[i];
      if (!f) return;
      rec[f.key] = fromCellValue(cell, f);
    });
    return rec;
  });
};
