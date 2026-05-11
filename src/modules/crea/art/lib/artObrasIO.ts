import * as XLSX from "xlsx";
import {
  ArtObra, PLANILHA_HEADERS, headerToField, normalizeTipoObra, normalizeStatus, parseDate,
  fmtDateBr,
} from "./artObrasTypes";

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const matrixFromRows = (rows: ArtObra[]) => {
  const head = [...PLANILHA_HEADERS];
  const body = rows.map((r) => [
    r.obra ?? "",
    r.tipo_obra === "eletrica" ? "ELETRICA" : r.tipo_obra === "civil" ? "CIVIL" : (r.tipo_obra ?? ""),
    r.cidade ?? "",
    r.uf ?? "",
    r.escopo ?? "",
    r.cliente ?? "",
    r.responsavel ?? "",
    r.status ?? "",
    fmtDateBr(r.data_criacao_art),
    fmtDateBr(r.data_validacao),
    fmtDateBr(r.data_envio_pagamento),
    fmtDateBr(r.data_pasta),
    r.coordenador ?? "",
    r.observacao ?? "",
  ]);
  return [head, ...body];
};

export function exportObrasXlsx(rows: ArtObra[]) {
  const ws = XLSX.utils.aoa_to_sheet(matrixFromRows(rows));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "ART");
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  triggerDownload(new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }), "art_obras.xlsx");
}

export function exportObrasCsv(rows: ArtObra[]) {
  const escape = (v: any) => {
    const s = String(v ?? "");
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = matrixFromRows(rows).map((r) => r.map(escape).join(";")).join("\n");
  triggerDownload(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }), "art_obras.csv");
}

export function downloadTemplate() {
  exportObrasXlsx([]);
}

export type ParsedObra = Partial<Omit<ArtObra, "id" | "company_id" | "created_at" | "updated_at">>;

export async function parseObrasFile(file: File): Promise<{ records: ParsedObra[]; headers: string[]; unmatched: string[] }> {
  const buf = await file.arrayBuffer();
  let aoa: any[][] = [];
  let headers: string[] = [];
  if (file.name.toLowerCase().endsWith(".csv")) {
    const text = new TextDecoder("utf-8").decode(buf);
    const lines = text.replace(/^\ufeff/, "").split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { records: [], headers: [], unmatched: [] };
    const sep = lines[0].includes(";") ? ";" : ",";
    aoa = lines.map((l) => l.split(sep));
  } else {
    const wb = XLSX.read(buf, { type: "array" });
    // Procura aba "ART" (case-insensitive); senão usa a primeira.
    const sheetName = wb.SheetNames.find((n) => n.toLowerCase() === "art") ?? wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    aoa = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: true, defval: "" });
  }
  if (aoa.length === 0) return { records: [], headers: [], unmatched: [] };

  // Detecta linha de cabeçalho (até 3 primeiras linhas) — escolhe a que tem mais headers reconhecidos.
  let headerRowIdx = 0; let bestScore = -1;
  for (let i = 0; i < Math.min(3, aoa.length); i++) {
    const score = (aoa[i] as any[]).filter((c) => headerToField(String(c))).length;
    if (score > bestScore) { bestScore = score; headerRowIdx = i; }
  }
  headers = (aoa[headerRowIdx] as any[]).map((h) => String(h ?? "").trim());
  const dataRows = aoa.slice(headerRowIdx + 1).filter((r) => (r as any[]).some((c) => c !== "" && c !== null && c !== undefined));

  const fieldByCol = headers.map((h) => headerToField(h));
  const unmatched = headers.filter((_, i) => !fieldByCol[i]);

  const records: ParsedObra[] = dataRows.map((row) => {
    const rec: ParsedObra = {};
    row.forEach((cell, i) => {
      const key = fieldByCol[i];
      if (!key) return;
      if (key === "tipo_obra") rec.tipo_obra = normalizeTipoObra(cell);
      else if (key === "status") rec.status = normalizeStatus(cell);
      else if (key === "uf") rec.uf = String(cell ?? "").trim().toUpperCase().slice(0, 2);
      else if (
        key === "data_criacao_art" || key === "data_validacao" ||
        key === "data_envio_pagamento" || key === "data_pasta"
      ) (rec as any)[key] = parseDate(cell);
      else (rec as any)[key] = String(cell ?? "").trim();
    });
    return rec;
  }).filter((r) => (r.obra ?? "").length > 0);

  return { records, headers, unmatched };
}
