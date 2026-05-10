// Parser de PDF do CREA usando pdfjs-dist com heurística de colunas.
// Roda 100% no client; nada vai para o servidor além do resultado consolidado.
import * as pdfjsLib from "pdfjs-dist";
// @ts-ignore - worker entry
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerSrc;

export interface PdfPagina {
  numero_pagina: number;
  texto: string;
  tabelas: string[][][];
  metadata: {
    width: number;
    height: number;
    numero_linhas: number;
    colunas_detectadas: number;
  };
}

interface TextItem { str: string; transform: number[]; width: number; height: number; }

/**
 * Heurística simples de detecção de colunas:
 * - Agrupa itens da mesma linha (Y próximo).
 * - Detecta posições X recorrentes em várias linhas → colunas.
 * - Monta uma matriz [linha][coluna].
 */
function buildTable(items: TextItem[]): { tabela: string[][]; colunas: number } {
  if (items.length === 0) return { tabela: [], colunas: 0 };

  // Agrupar por linha (Y arredondado em buckets de 4 pt)
  const linhas = new Map<number, TextItem[]>();
  for (const it of items) {
    const y = Math.round(it.transform[5] / 4) * 4;
    const arr = linhas.get(y) ?? [];
    arr.push(it); linhas.set(y, arr);
  }
  // Ordenar linhas top→bottom (Y maior = topo no PDF)
  const linhasSorted = Array.from(linhas.entries()).sort((a, b) => b[0] - a[0]);

  // Posições X recorrentes
  const xCounts = new Map<number, number>();
  for (const [, arr] of linhasSorted) {
    for (const it of arr) {
      const x = Math.round(it.transform[4] / 8) * 8;
      xCounts.set(x, (xCounts.get(x) ?? 0) + 1);
    }
  }
  const minRecorrencia = Math.max(2, Math.floor(linhasSorted.length * 0.3));
  const colunas = Array.from(xCounts.entries())
    .filter(([, c]) => c >= minRecorrencia)
    .map(([x]) => x).sort((a, b) => a - b);

  if (colunas.length < 2) {
    const tabela = linhasSorted.map(([, arr]) =>
      [arr.sort((a, b) => a.transform[4] - b.transform[4]).map(i => i.str).join(" ").trim()]);
    return { tabela: tabela.filter(r => r[0]), colunas: 1 };
  }

  const tabela: string[][] = [];
  for (const [, arr] of linhasSorted) {
    const sortedRow = arr.sort((a, b) => a.transform[4] - b.transform[4]);
    const linha = new Array(colunas.length).fill("");
    for (const it of sortedRow) {
      const x = it.transform[4];
      let idx = 0;
      for (let i = 0; i < colunas.length; i++) {
        if (x >= colunas[i] - 6) idx = i;
      }
      linha[idx] = (linha[idx] ? linha[idx] + " " : "") + it.str;
    }
    if (linha.some(c => c.trim())) tabela.push(linha.map(c => c.trim()));
  }
  return { tabela, colunas: colunas.length };
}

export async function parsePdfFile(file: File, onProgress?: (n: number, total: number) => void): Promise<PdfPagina[]> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const out: PdfPagina[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items = (content.items as any[])
      .filter(i => "str" in i && (i.str ?? "").trim() !== "")
      .map(i => ({ str: i.str, transform: i.transform, width: i.width, height: i.height }));
    const { tabela, colunas } = buildTable(items);
    const texto = items
      .sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4])
      .map(i => i.str).join(" ");
    out.push({
      numero_pagina: p,
      texto,
      tabelas: tabela.length > 0 ? [tabela] : [],
      metadata: {
        width: Math.round(viewport.width),
        height: Math.round(viewport.height),
        numero_linhas: tabela.length,
        colunas_detectadas: colunas,
      },
    });
    onProgress?.(p, pdf.numPages);
  }
  return out;
}
