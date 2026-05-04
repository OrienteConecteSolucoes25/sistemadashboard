// Stub para builders de relatório de Governança (PPT/Word/PDF).
import type { GovActionRow } from "./govAtividades";

export function buildResumoGovernanca(rows: GovActionRow[]) {
  const total = rows.length;
  const concluidas = rows.filter((r) => r.status === "concluida").length;
  return {
    total,
    concluidas,
    pct: total ? Math.round((concluidas / total) * 100) : 0,
  };
}
