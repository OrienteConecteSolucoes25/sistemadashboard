// Stub do gerador de relatório de Governança.
import type { GovActionRow } from "./govAtividades";
import { buildResumoGovernanca } from "./govReportBuilders";

export function buildGovernanceReport(rows: GovActionRow[]) {
  const resumo = buildResumoGovernanca(rows);
  return {
    geradoEm: new Date().toISOString(),
    ...resumo,
    detalhes: rows.slice(0, 100),
  };
}
