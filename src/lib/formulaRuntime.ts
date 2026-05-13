import { Parser } from "expr-eval-fork";

const parser = new Parser({ allowMemberAccess: true });
parser.functions.sum = (a: any) => (Array.isArray(a) ? a : [a]).reduce((s: number, x: any) => s + (Number(x) || 0), 0);
parser.functions.avg = (a: any) => { const arr = Array.isArray(a) ? a : [a]; return arr.length ? parser.functions.sum(arr) / arr.length : 0; };
parser.functions.min = (a: any) => Math.min(...((Array.isArray(a) ? a : [a]).map(Number).filter((n) => !isNaN(n))));
parser.functions.max = (a: any) => Math.max(...((Array.isArray(a) ? a : [a]).map(Number).filter((n) => !isNaN(n))));
parser.functions.count = (a: any) => (Array.isArray(a) ? a : [a]).filter((x: any) => x != null && x !== "").length;
parser.functions.iff = (c: any, x: any, y: any) => (c ? x : y);
parser.functions.round = (n: any, d = 0) => { const p = Math.pow(10, d); return Math.round(Number(n) * p) / p; };
parser.functions.abs = (n: any) => Math.abs(Number(n) || 0);
parser.functions.and = (a: any, b: any) => Boolean(a) && Boolean(b);
parser.functions.or = (a: any, b: any) => Boolean(a) || Boolean(b);
parser.functions.not = (a: any) => !a;
parser.functions.concat = (...args: any[]) => args.map((a) => String(a ?? "")).join("");

export interface RowVars { [letter: string]: unknown }
export interface ColVars { [letter: string]: unknown[] }

export function evalFormula(formulaJs: string | null | undefined, row: RowVars, cols: ColVars): unknown {
  if (!formulaJs) return null;
  try {
    return parser.parse(formulaJs).evaluate({ row, cols } as never);
  } catch (e) {
    console.warn("formula eval failed", formulaJs, e);
    return null;
  }
}

export function buildColsAggregation(rows: Array<{ values: Record<string, unknown> }>): ColVars {
  const cols: ColVars = {};
  for (const r of rows) {
    for (const [k, v] of Object.entries(r.values || {})) {
      if (!cols[k]) cols[k] = [];
      cols[k].push(v);
    }
  }
  return cols;
}
