import { supabase } from "@/integrations/supabase/client";
import type { FieldSchema } from "@/modules/engenharia/ui/crud/types";

const sb: any = supabase;

export type CreaTable =
  | "crea_arts" | "crea_protocols" | "crea_cats" | "crea_certificates"
  | "crea_deregistrations" | "crea_treatments" | "crea_deadlines"
  | "crea_responsible_technicians" | "crea_engineers" | "crea_companies_crea"
  | "crea_documents" | "crea_norms" | "crea_links_oficiais"
  | "crea_credentials" | "crea_ai_sources";

export const CREA_TABLES: CreaTable[] = [
  "crea_arts","crea_protocols","crea_cats","crea_certificates",
  "crea_deregistrations","crea_treatments","crea_deadlines",
  "crea_responsible_technicians","crea_engineers","crea_companies_crea",
  "crea_documents","crea_norms","crea_links_oficiais","crea_credentials","crea_ai_sources",
];

export async function creaSoftDelete(table: CreaTable, id: string, reason: string) {
  const { data, error } = await sb.rpc("crea_soft_delete", { _table: table, _id: id, _reason: reason });
  if (error) return { ok: false, error: error.message };
  return data ?? { ok: false, error: "unknown" };
}

/** Mapeia headers livres da planilha para os campos conhecidos.
 *  Tudo que não casar vai para o jsonb `data` (modo adaptativo). */
export function mapAdaptive(parsedRows: any[][], headers: string[], fields: FieldSchema[]) {
  const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, "_");
  const known = new Map<string, FieldSchema>();
  fields.forEach((f) => { known.set(f.key, f); known.set(norm(f.label), f); });

  return parsedRows.map((row) => {
    const rec: Record<string, any> = {};
    const extra: Record<string, any> = {};
    row.forEach((cell, i) => {
      const h = headers[i];
      if (h === undefined) return;
      const f = known.get(norm(h));
      if (f) {
        if (cell === "" || cell === null || cell === undefined) { rec[f.key] = null; return; }
        if (f.type === "number") {
          const n = Number(String(cell).replace(",", "."));
          rec[f.key] = Number.isFinite(n) ? n : null;
        } else if (f.type === "date") {
          const s = String(cell).trim();
          const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
          if (m) rec[f.key] = `${m[3]}-${m[2]}-${m[1]}`;
          else if (/^\d{4}-\d{2}-\d{2}/.test(s)) rec[f.key] = s.slice(0, 10);
          else { const d = new Date(s); rec[f.key] = isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10); }
        } else if (f.type === "boolean") {
          rec[f.key] = ["sim","true","1","yes","y","x"].includes(String(cell).toLowerCase().trim());
        } else {
          rec[f.key] = String(cell);
        }
      } else {
        extra[h] = cell;
      }
    });
    if (Object.keys(extra).length) rec.data = extra;
    return rec;
  });
}
