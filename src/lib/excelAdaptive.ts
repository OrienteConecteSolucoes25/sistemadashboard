import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

export interface ImportProgress {
  step: string;
  detail?: string;
  current?: number;
  total?: number;
}

function inferType(cell: XLSX.CellObject | undefined): { data_type: string; format_hint: string | null } {
  if (!cell) return { data_type: "text", format_hint: null };
  const z = (cell.z as string | undefined) ?? null;
  if (cell.t === "n") {
    if (z?.includes("%")) return { data_type: "percent", format_hint: z };
    if (z && /R\$|\$|€/.test(z)) return { data_type: "currency", format_hint: z };
    return { data_type: "number", format_hint: z };
  }
  if (cell.t === "d") return { data_type: "date", format_hint: z };
  if (cell.t === "b") return { data_type: "boolean", format_hint: null };
  return { data_type: "text", format_hint: z };
}

function normalizeKey(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 60);
}

export async function importAdaptiveExcel(
  file: File,
  opts: { datasetName: string; moduleKey: string; userId: string; onProgress?: (p: ImportProgress) => void; description?: string },
): Promise<string> {
  const { datasetName, moduleKey, userId, onProgress, description } = opts;
  onProgress?.({ step: "Lendo arquivo…" });
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { cellFormula: true, cellDates: true, cellNF: true });

  const { data: ds, error: dsErr } = await supabase
    .from("gov_datasets")
    .insert({ module_key: moduleKey, name: datasetName, description, source_filename: file.name, uploaded_by: userId, sheet_count: wb.SheetNames.length })
    .select("id").single();
  if (dsErr || !ds) throw new Error(dsErr?.message ?? "Falha ao criar dataset");

  for (let order = 0; order < wb.SheetNames.length; order++) {
    const sheetName = wb.SheetNames[order];
    const ws = wb.Sheets[sheetName];
    if (!ws["!ref"]) continue;
    const range = XLSX.utils.decode_range(ws["!ref"]);
    onProgress?.({ step: `Sheet "${sheetName}"`, current: order + 1, total: wb.SheetNames.length });

    // Detecção da linha de header: a primeira linha com células não vazias suficientes
    let headerRow = range.s.r;
    for (let r = range.s.r; r <= Math.min(range.s.r + 25, range.e.r); r++) {
      let nonEmpty = 0;
      for (let c = range.s.c; c <= range.e.c; c++) {
        if (ws[XLSX.utils.encode_cell({ r, c })]?.v != null) nonEmpty++;
      }
      if (nonEmpty >= Math.min(3, range.e.c - range.s.c + 1)) { headerRow = r; break; }
    }

    const { data: sh, error: shErr } = await supabase
      .from("gov_dataset_sheets")
      .insert({ dataset_id: ds.id, sheet_name: sheetName, sheet_order: order, header_row_index: headerRow, row_count: range.e.r - headerRow, col_count: range.e.c - range.s.c + 1 })
      .select("id").single();
    if (shErr || !sh) throw new Error(shErr?.message ?? "Falha ao criar sheet");

    // Colunas
    const columns: any[] = [];
    const formulasToAnalyze: { col_letter: string; header: string; sample_formula: string; sample_values: unknown[] }[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const colLetter = XLSX.utils.encode_col(c);
      const headerCell = ws[XLSX.utils.encode_cell({ r: headerRow, c })];
      const header = headerCell?.v != null ? String(headerCell.v).trim() : colLetter;
      // Amostragem para detecção
      let typeVote: { data_type: string; format_hint: string | null } = { data_type: "text", format_hint: null };
      let isFormula = false;
      let sampleFormula: string | null = null;
      const samples: unknown[] = [];
      for (let r = headerRow + 1; r <= Math.min(headerRow + 20, range.e.r); r++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        if (!cell) continue;
        if (cell.f) { isFormula = true; sampleFormula = sampleFormula ?? cell.f; }
        if (typeVote.data_type === "text") typeVote = inferType(cell);
        if (cell.v != null) samples.push(cell.v);
      }
      const colData: any = {
        sheet_id: sh.id, col_index: c, col_letter: colLetter, header,
        key_normalized: normalizeKey(header) || colLetter.toLowerCase(),
        data_type: isFormula ? "number" : typeVote.data_type,
        format_hint: typeVote.format_hint,
        is_formula: isFormula, formula_excel: sampleFormula,
      };
      columns.push(colData);
      if (isFormula && sampleFormula) {
        formulasToAnalyze.push({ col_letter: colLetter, header, sample_formula: sampleFormula, sample_values: samples.slice(0, 3) });
      }
    }

    if (formulasToAnalyze.length > 0) {
      onProgress?.({ step: `Analisando ${formulasToAnalyze.length} fórmulas com IA…` });
      try {
        const { data: ai, error: aiErr } = await supabase.functions.invoke("gov-analyze-formula", { body: { formulas: formulasToAnalyze } });
        if (!aiErr && ai?.results) {
          for (const t of ai.results as Array<{ col_letter: string; formula_js: string; purpose: string; return_type?: string }>) {
            const tgt = columns.find((c) => c.col_letter === t.col_letter);
            if (tgt) {
              tgt.formula_js = t.formula_js;
              tgt.formula_purpose = t.purpose;
              if (t.return_type) tgt.data_type = t.return_type;
            }
          }
        }
      } catch (e) { console.warn("AI analysis failed, continuing", e); }
    }

    const { error: colErr } = await supabase.from("gov_dataset_columns").insert(columns);
    if (colErr) throw new Error(colErr.message);

    // Linhas (apenas valores, sem fórmulas)
    onProgress?.({ step: `Salvando linhas de "${sheetName}"…` });
    const rows: any[] = [];
    for (let r = headerRow + 1; r <= range.e.r; r++) {
      const values: Record<string, unknown> = {};
      let hasAny = false;
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        if (!cell) continue;
        const letter = XLSX.utils.encode_col(c);
        let v: unknown = cell.v ?? null;
        if (cell.t === "d" && v instanceof Date) v = v.toISOString().slice(0, 10);
        if (v != null && v !== "") { values[letter] = v; hasAny = true; }
      }
      if (hasAny) rows.push({ sheet_id: sh.id, row_index: r - headerRow, values });
    }
    for (let i = 0; i < rows.length; i += 500) {
      const slice = rows.slice(i, i + 500);
      const { error: rowErr } = await supabase.from("gov_dataset_rows").insert(slice);
      if (rowErr) throw new Error(rowErr.message);
    }
  }
  onProgress?.({ step: "Concluído!" });
  return ds.id;
}
