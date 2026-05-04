// Constantes e helpers para a aba Fibra > Checklist Projeto Executivo
import * as XLSX from "xlsx";
import { parseExcelDate } from "./storage";

export type Padrao = "CLARO" | "SEINFRA" | "COELBA";

export const ENTREGA_OPTIONS = [
  { value: "-", label: "—" },
  { value: "planejado", label: "Planejado" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "na", label: "N/A" },
] as const;

export const ENTREGA_LABEL: Record<string, string> = Object.fromEntries(
  ENTREGA_OPTIONS.map((o) => [o.value, o.label]),
);

export const STATUS_GERAL_OPTIONS = [
  "planejado", "em_andamento", "concluido", "pausado", "cancelado",
] as const;

export const PROCESSOS_POR_PADRAO: Record<Padrao, string[]> = {
  CLARO: [
    "PLANILHA CADFIBER","MUB (RUAS)","LOGRADOUROS","POSTES (ALINHAMENTO)","COTAS",
    "CABO (LINHA E NOME)","RESERVAS (CORDOALHA, ESPINAMENTO, NOTA E RT M²)",
    "IDENTIFICAÇÃO DOS SITES","SENTIDO DAS CIDADES","EIXO DA PISTA",
    "FAIXA DE DOMÍNIO","ÁREA NÃO EDIFICADA","ARTICULAÇÕES A1","LAYOUTS","PLOTAGEM A1",
  ],
  SEINFRA: [
    "ARTICULAÇÕES A3","DISTÂNCIA DAS RUAS","DISTÂNCIAS DOS POSTES ENTRE OS EIXOS DAS RUAS",
    "DISTÂNCIAS DOS POSTES ENTRE O MEIO FIO","PLACA DE KM","MARCO KM",
    "TRAVESSIAS (DETALHAMENTO)","TRAVESSIAS (SINALIZAÇÃO NA ROTA DO PROJETO)",
    "NOTAS EXPLICATIVAS SOBRE FIXAÇÃO DO CABO NAS TRAVESSIAS","CERCA",
    "DETALHES DA PONTE (NOTAS TÉCNICAS)","DETALHAMENTO DA PONTE E PASSAGEM DE CABO",
    "ENTRADA DE FAZENDA","GABARITO VERTICAL PERFIL","PERFIL ALTIMÉTRICO","MALHA",
    "LAYOUTS","MEMORIAL DESCRITIVO","MEMORIAL DE JUSTIFICATIVA","CRONOGRAMA",
    "ANÁLISE DE SEGURANÇA VIÁRIA","PLANILHA GEODÉSICA","PLOTAGEM A3",
  ],
  COELBA: [
    "BARRAMENTOS NO PROJETO","BAIXAR AS FOTOS","PROTOCOLO GEOS",
    "1ª ANÁLISE DE PLANTAS","1ª ANÁLISE DE MEMORIAIS","1ª ANÁLISE DE DOCUMENTOS",
    "1ª ANÁLISE DE POSTES NÃO CADASTRADO",
  ],
};

export const PADRAO_LABEL: Record<Padrao, string> = {
  CLARO: "PADRÃO CLARO",
  SEINFRA: "PADRÃO SEINFRA / DNIT",
  COELBA: "PADRÃO COELBA",
};

export interface FibraChecklist {
  id: string; cidade: string; km: string | null;
  cliente: string | null; uf: string | null;
  responsavel_geral: string | null; status_geral: string | null;
  observacoes: string | null; created_by: string | null;
  created_at: string; updated_at: string;
}

export interface FibraChecklistItem {
  id: string; checklist_id: string; padrao: Padrao;
  processo: string; data_inicio: string | null; data_final: string | null;
  responsavel: string | null; entrega_final: string | null;
  observacao: string | null; ordem: number;
  created_at: string; updated_at: string;
}

export function buildDefaultItems(checklistId: string): Omit<FibraChecklistItem, "id" | "created_at" | "updated_at">[] {
  const out: Omit<FibraChecklistItem, "id" | "created_at" | "updated_at">[] = [];
  (Object.keys(PROCESSOS_POR_PADRAO) as Padrao[]).forEach((padrao) => {
    PROCESSOS_POR_PADRAO[padrao].forEach((proc, idx) => {
      out.push({
        checklist_id: checklistId, padrao, processo: proc,
        data_inicio: null, data_final: null, responsavel: null,
        entrega_final: "-", observacao: null, ordem: idx,
      });
    });
  });
  return out;
}

export function progressoPorPadrao(items: FibraChecklistItem[], padrao: Padrao): number {
  const pertinentes = items.filter((i) => i.padrao === padrao && i.entrega_final !== "na");
  if (pertinentes.length === 0) return 0;
  const concluidos = pertinentes.filter((i) => i.entrega_final === "concluido").length;
  return Math.round((concluidos / pertinentes.length) * 100);
}

export function downloadFibraTemplate() {
  const rows: (string | number)[][] = [];
  rows.push(["PROJETO EXECUTIVO (Cidade: XXXXXX) (XXX km)", "", "", "", ""]);
  rows.push(["MAPEAMENTOS / PROCESSOS", "DATA INÍCIO", "DATA FINAL", "RESPONSÁVEL", "ENTREGA FINAL"]);
  (Object.keys(PROCESSOS_POR_PADRAO) as Padrao[]).forEach((padrao) => {
    rows.push([PADRAO_LABEL[padrao], "", "", "", ""]);
    PROCESSOS_POR_PADRAO[padrao].forEach((proc) => rows.push([proc, "", "", "", ""]));
    rows.push(["", "", "", "", ""]);
  });
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 60 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 18 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Checklist");
  XLSX.writeFile(wb, "modelo_checklist_fibra.xlsx");
}

export interface ParsedChecklist {
  cidade: string; km: string;
  itens: { padrao: Padrao; processo: string; data_inicio: string | null; data_final: string | null; responsavel: string | null; entrega_final: string }[];
}

const NORM = (s: string) => s.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const PADRAO_HEADERS: { match: RegExp; padrao: Padrao }[] = [
  { match: /PADRAO\s+CLARO/, padrao: "CLARO" },
  { match: /PADRAO\s+SEINFRA|PADRAO\s+DNIT/, padrao: "SEINFRA" },
  { match: /PADRAO\s+COELBA/, padrao: "COELBA" },
];

function detectPadrao(line: string): Padrao | null {
  const u = NORM(line);
  for (const p of PADRAO_HEADERS) if (p.match.test(u)) return p.padrao;
  return null;
}

function entregaFromText(s: string): string {
  const u = NORM(s);
  if (!u || u === "-") return "-";
  if (/CONCLUI/.test(u)) return "concluido";
  if (/ANDAMENTO/.test(u)) return "em_andamento";
  if (/PLANEJ/.test(u)) return "planejado";
  if (/N\/?A|NAO\s*APLIC/.test(u)) return "na";
  return "-";
}

export async function parseFibraExcel(file: File): Promise<ParsedChecklist> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });

  let cidade = ""; let km = ""; let currentPadrao: Padrao | null = null;
  const itens: ParsedChecklist["itens"] = [];

  for (let i = 0; i < aoa.length; i++) {
    const row = aoa[i].map((c) => (c == null ? "" : String(c).trim()));
    const first = row[0] ?? "";
    if (!first) continue;
    const headMatch = NORM(first).match(/CIDADE[:\s]+([A-Z0-9 \-]+).*?\(\s*([\d.,]+)\s*KM\s*\)/);
    if (headMatch) { cidade = headMatch[1].trim(); km = headMatch[2].replace(",", "."); continue; }
    if (NORM(first).startsWith("MAPEAMENTOS")) continue;
    const det = detectPadrao(first);
    if (det) { currentPadrao = det; continue; }
    if (!currentPadrao) continue;
    itens.push({
      padrao: currentPadrao, processo: first,
      data_inicio: parseExcelDate(row[1]) || null,
      data_final: parseExcelDate(row[2]) || null,
      responsavel: row[3] || null,
      entrega_final: entregaFromText(row[4] ?? ""),
    });
  }
  return { cidade: cidade || "Importado", km, itens };
}

export function exportFibraChecklists(
  checklists: FibraChecklist[],
  itemsByChecklist: Record<string, FibraChecklistItem[]>,
) {
  const wb = XLSX.utils.book_new();
  const resumo = checklists.map((c) => {
    const items = itemsByChecklist[c.id] ?? [];
    return {
      Cidade: c.cidade, KM: c.km ?? "", Cliente: c.cliente ?? "", UF: c.uf ?? "",
      Responsavel: c.responsavel_geral ?? "", Status: c.status_geral ?? "",
      "% Claro": progressoPorPadrao(items, "CLARO"),
      "% SEINFRA": progressoPorPadrao(items, "SEINFRA"),
      "% COELBA": progressoPorPadrao(items, "COELBA"),
      Atualizado: c.updated_at,
    };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumo), "Resumo");
  checklists.forEach((c) => {
    const items = itemsByChecklist[c.id] ?? [];
    const rows: (string | number)[][] = [];
    rows.push([`PROJETO EXECUTIVO (Cidade: ${c.cidade}) (${c.km ?? "—"} km)`, "", "", "", ""]);
    rows.push(["MAPEAMENTOS / PROCESSOS", "DATA INÍCIO", "DATA FINAL", "RESPONSÁVEL", "ENTREGA FINAL"]);
    (Object.keys(PROCESSOS_POR_PADRAO) as Padrao[]).forEach((padrao) => {
      rows.push([PADRAO_LABEL[padrao], "", "", "", ""]);
      items.filter((i) => i.padrao === padrao).sort((a, b) => a.ordem - b.ordem).forEach((it) => {
        rows.push([
          it.processo, it.data_inicio ?? "", it.data_final ?? "",
          it.responsavel ?? "", ENTREGA_LABEL[it.entrega_final ?? "-"] ?? "—",
        ]);
      });
      rows.push(["", "", "", "", ""]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 60 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 18 }];
    const sheetName = (c.cidade || "Checklist").slice(0, 28).replace(/[\\/?*[\]:]/g, " ");
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });
  XLSX.writeFile(wb, `fibra_checklists_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
