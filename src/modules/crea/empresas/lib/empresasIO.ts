import * as XLSX from "xlsx";
import { Empresa, PLANILHA_HEADERS_EMPRESA, headerToField, maskCnpj, maskCep } from "./empresasTypes";

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const matrixFromRows = (rows: Empresa[]) => {
  const head = [...PLANILHA_HEADERS_EMPRESA];
  const body = rows.map((r) => [
    r.nome_fantasia ?? "",
    r.razao_social ?? "",
    r.endereco_completo ?? "",
    r.cidade ?? "",
    r.uf ?? "",
    maskCep(r.cep) || (r.cep ?? ""),
    maskCnpj(r.cnpj) || (r.cnpj ?? ""),
  ]);
  return [head, ...body];
};

export function exportEmpresasXlsx(rows: Empresa[]) {
  const ws = XLSX.utils.aoa_to_sheet(matrixFromRows(rows));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Empresas");
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  triggerDownload(new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }), "empresas.xlsx");
}

export function exportEmpresasCsv(rows: Empresa[]) {
  const escape = (v: any) => {
    const s = String(v ?? "");
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = matrixFromRows(rows).map((r) => r.map(escape).join(";")).join("\n");
  triggerDownload(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }), "empresas.csv");
}

export function downloadTemplate() {
  exportEmpresasXlsx([]);
}

export type ParsedEmpresa = Partial<Omit<Empresa, "id" | "company_id" | "created_at" | "updated_at">>;

export async function parseEmpresasFile(file: File): Promise<{ records: ParsedEmpresa[]; headers: string[]; unmatched: string[] }> {
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
    const sheetName =
      wb.SheetNames.find((n) => /empresa|cnpj/i.test(n)) ?? wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    aoa = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: true, defval: "" });
  }
  if (aoa.length === 0) return { records: [], headers: [], unmatched: [] };

  // Detecta linha de cabeçalho (entre as primeiras 8 linhas)
  let headerRowIdx = 0; let bestScore = -1;
  for (let i = 0; i < Math.min(8, aoa.length); i++) {
    const score = (aoa[i] as any[]).filter((c) => headerToField(String(c))).length;
    if (score > bestScore) { bestScore = score; headerRowIdx = i; }
  }
  headers = (aoa[headerRowIdx] as any[]).map((h) => String(h ?? "").trim());
  const dataRows = aoa.slice(headerRowIdx + 1)
    .filter((r) => (r as any[]).some((c) => c !== "" && c !== null && c !== undefined));

  const fieldByCol = headers.map((h) => headerToField(h));
  const unmatched = headers.filter((_, i) => !fieldByCol[i] && headers[i]);

  const records: ParsedEmpresa[] = dataRows.map((row) => {
    const rec: ParsedEmpresa = {};
    row.forEach((cell, i) => {
      const key = fieldByCol[i];
      if (!key) return;
      const s = String(cell ?? "").trim();
      if (key === "uf") rec.uf = s.toUpperCase().slice(0, 2);
      else if (key === "cnpj") rec.cnpj = s.replace(/\D/g, "");
      else if (key === "cep") rec.cep = s.replace(/\D/g, "");
      else (rec as any)[key] = s;
    });
    return rec;
  }).filter((r) => (r.nome_fantasia ?? "").length > 0 || (r.razao_social ?? "").length > 0 || (r.cnpj ?? "").length > 0);

  return { records, headers, unmatched };
}
