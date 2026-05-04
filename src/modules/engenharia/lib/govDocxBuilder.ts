// Stub leve para portabilidade. As funções de geração avançada de relatórios
// de governança (DOCX/PPTX) serão habilitadas em iteração futura.
import type { GovActionRow } from "./govAtividades";

export function buildGovDocx(_rows: GovActionRow[]): Promise<Blob> {
  return Promise.resolve(new Blob([], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
}
