import * as XLSX from "xlsx";

export function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}
export function lsSet<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function exportXlsx(rows: Record<string, unknown>[], filename: string, sheet = "Dados") {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  XLSX.writeFile(wb, filename);
}

export function downloadTemplate(headers: string[], filename: string) {
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Modelo");
  XLSX.writeFile(wb, filename);
}

export function parseExcelDate(val: unknown): string {
  if (val == null || val === "") return "";
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return "";
    const y = val.getUTCFullYear();
    const m = String(val.getUTCMonth() + 1).padStart(2, "0");
    const d = String(val.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof val === "number" && isFinite(val)) {
    const ms = Math.round((val - 25569) * 86400 * 1000);
    const dt = new Date(ms);
    if (isNaN(dt.getTime())) return "";
    return dt.toISOString().slice(0, 10);
  }
  const s = String(val).trim();
  if (!s) return "";
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (m) {
    let y = parseInt(m[3], 10);
    if (y < 100) y += 2000;
    const mo = m[2].padStart(2, "0");
    const d = m[1].padStart(2, "0");
    return `${y}-${mo}-${d}`;
  }
  return s;
}

const normalizeHeader = (value: unknown) => String(value ?? "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/\s+/g, " ").trim().toUpperCase();

export async function readXlsxFile(file: File, opts?: { sheet?: string; expectedHeaders?: string[] }): Promise<Record<string, unknown>[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const wantedSheet = opts?.sheet ? normalizeHeader(opts.sheet) : "";
  const sheetName = wantedSheet
    ? (wb.SheetNames.find((s) => normalizeHeader(s) === wantedSheet) ?? wb.SheetNames.find((s) => normalizeHeader(s).includes(wantedSheet)) ?? wb.SheetNames[0])
    : wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "", raw: false, dateNF: "yyyy-mm-dd" });
  if (!aoa.length) return [];
  const expected = (opts?.expectedHeaders ?? []).map(normalizeHeader).filter(Boolean);
  let headerIdx = 0;
  let bestScore = -1;
  for (let i = 0; i < Math.min(aoa.length, 25); i++) {
    const row = aoa[i] ?? [];
    const nonEmpty = row.filter((v) => v != null && String(v).trim() !== "").length;
    const normalized = row.map(normalizeHeader).filter(Boolean);
    const matches = expected.length ? expected.filter((h) => normalized.includes(h)).length : 0;
    const score = matches * 100 + nonEmpty;
    if (nonEmpty >= 3 && score > bestScore) { bestScore = score; headerIdx = i; }
  }
  const headers = (aoa[headerIdx] ?? []).map((h, j) => {
    const s = h == null ? "" : String(h).trim();
    return s || `col_${j}`;
  });
  const out: Record<string, unknown>[] = [];
  for (let i = headerIdx + 1; i < aoa.length; i++) {
    const row = aoa[i] ?? [];
    if (!row.some((v) => v != null && String(v).trim() !== "")) continue;
    const obj: Record<string, unknown> = {};
    headers.forEach((h, j) => { obj[h] = row[j] ?? ""; });
    out.push(obj);
  }
  return out;
}

export function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

export function fmtDate(d?: string | Date | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return String(d); }
}

export function diffDays(a: string | Date, b: string | Date) {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24));
}
