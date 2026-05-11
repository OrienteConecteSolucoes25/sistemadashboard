import * as XLSX from "xlsx";
import {
  RtPessoa, PLANILHA_HEADERS_RT, headerToFieldRt,
  normalizeStatusRt, normalizeModelo, normalizeAnuidade, parseDateOrIndef,
  STATUS_RT_LABEL, MODELO_LABEL, ANUIDADE_LABEL, fmtDateBr,
} from "./rtsTypes";

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const matrixFromRows = (rows: RtPessoa[]) => {
  const head = [...PLANILHA_HEADERS_RT];
  const body = rows.map((r) => [
    r.nome ?? "",
    r.cpf ?? "",
    r.uf ?? "",
    STATUS_RT_LABEL[r.status] ?? r.status ?? "",
    fmtDateBr(r.data_inicio),
    r.termino_indefinido ? "Indefinido" : fmtDateBr(r.data_termino),
    MODELO_LABEL[r.modelo_contrato] ?? r.modelo_contrato ?? "",
    r.visto ?? "",
    r.rnp ?? "",
    r.registro ?? "",
    ANUIDADE_LABEL[r.anuidade] ?? r.anuidade ?? "",
    r.anuidade_ano ?? "",
    r.inclusao_ativa === false ? "Não" : "Sim",
    r.observacao ?? "",
    "", "", "",
  ]);
  return [head, ...body];
};

export function exportRtsXlsx(rows: RtPessoa[]) {
  const ws = XLSX.utils.aoa_to_sheet(matrixFromRows(rows));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "RTs");
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  triggerDownload(new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }), "responsaveis_tecnicos.xlsx");
}

export function exportRtsCsv(rows: RtPessoa[]) {
  const escape = (v: any) => {
    const s = String(v ?? "");
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = matrixFromRows(rows).map((r) => r.map(escape).join(";")).join("\n");
  triggerDownload(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }), "responsaveis_tecnicos.csv");
}

export function downloadTemplateRts() {
  // Modelo com 1 linha de exemplo cobrindo dados do RT + Login do portal
  const example = [[
    "JOÃO ARTHUR", "000.000.000-00", "BA", "Ativo",
    "01/01/2024", "Indefinido", "CLT",
    "BA", "1234567", "BA-12345", "Paga", "2025", "Sim", "Observação opcional",
    "BAHIA (BA)", "Arthur1309*", "Acesso ao portal CREA-BA",
  ]];
  const aoa = [[...PLANILHA_HEADERS_RT], ...example];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "RTs");
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  triggerDownload(new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }), "modelo_responsaveis_tecnicos.xlsx");
}

export type ParsedRt = Partial<Omit<RtPessoa, "id" | "company_id" | "created_at" | "updated_at">> & {
  _login_regiao?: string;
  _login_senha?: string;
  _login_obs?: string;
};

export async function parseRtsFile(file: File): Promise<{ records: ParsedRt[]; headers: string[]; unmatched: string[] }> {
  const buf = await file.arrayBuffer();
  let aoa: any[][] = [];
  if (file.name.toLowerCase().endsWith(".csv")) {
    const text = new TextDecoder("utf-8").decode(buf);
    const lines = text.replace(/^\ufeff/, "").split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { records: [], headers: [], unmatched: [] };
    const sep = lines[0].includes(";") ? ";" : ",";
    aoa = lines.map((l) => l.split(sep));
  } else {
    const wb = XLSX.read(buf, { type: "array" });
    const sheetName = wb.SheetNames.find((n) => /rt/i.test(n)) ?? wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    aoa = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: true, defval: "" });
  }
  if (aoa.length === 0) return { records: [], headers: [], unmatched: [] };

  let headerRowIdx = 0; let bestScore = -1;
  for (let i = 0; i < Math.min(3, aoa.length); i++) {
    const score = (aoa[i] as any[]).filter((c) => headerToFieldRt(String(c))).length;
    if (score > bestScore) { bestScore = score; headerRowIdx = i; }
  }
  const headers = (aoa[headerRowIdx] as any[]).map((h) => String(h ?? "").trim());
  const dataRows = aoa.slice(headerRowIdx + 1)
    .filter((r) => (r as any[]).some((c) => c !== "" && c !== null && c !== undefined));
  const fieldByCol = headers.map((h) => headerToFieldRt(h));
  const unmatched = headers.filter((_, i) => !fieldByCol[i]);

  const records: ParsedRt[] = dataRows.map((row) => {
    const rec: ParsedRt = {};
    row.forEach((cell, i) => {
      const key = fieldByCol[i];
      if (!key) return;
      if (key === "status") rec.status = normalizeStatusRt(cell);
      else if (key === "modelo_contrato") rec.modelo_contrato = normalizeModelo(cell);
      else if (key === "anuidade") rec.anuidade = normalizeAnuidade(cell);
      else if (key === "data_inicio") {
        const { date } = parseDateOrIndef(cell); rec.data_inicio = date;
      } else if (key === "data_termino") {
        const { date, indef } = parseDateOrIndef(cell);
        rec.data_termino = date; rec.termino_indefinido = indef;
      } else if (key === "uf") rec.uf = String(cell ?? "").trim().toUpperCase().slice(0, 2);
      else if (key === "anuidade_ano") {
        const n = parseInt(String(cell ?? "").replace(/\D/g, ""), 10);
        rec.anuidade_ano = isNaN(n) ? null : n;
      } else if (key === "inclusao_ativa") {
        const s = String(cell ?? "").trim().toLowerCase();
        rec.inclusao_ativa = !(s === "nao" || s === "não" || s === "n" || s === "false" || s === "0");
      } else (rec as any)[key] = String(cell ?? "").trim();
    });
    return rec;
  }).filter((r) => (r.nome ?? "").length > 0);

  return { records, headers, unmatched };
}
