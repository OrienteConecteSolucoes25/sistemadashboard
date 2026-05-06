/**
 * Tabela dinâmica de uma sheet: render colunas detectadas, edição inline,
 * recálculo de fórmulas com expr-eval ao vivo.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sigma, Loader2, RefreshCw } from "lucide-react";
import { evalFormula, buildColsAggregation } from "@/lib/formulaRuntime";
import { toast } from "sonner";

interface Col {
  id: string; col_index: number; col_letter: string; header: string; data_type: string;
  is_formula: boolean; formula_excel: string | null; formula_js: string | null; formula_purpose: string | null;
  format_hint: string | null; ignored: boolean; width: number;
}
interface Row { id: string; row_index: number; values: Record<string, unknown>; computed: Record<string, unknown> | null }

const fmtBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
const fmtNum = (n: number) => n.toLocaleString("pt-BR");

function formatValue(v: unknown, type: string): string {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (type === "currency" && !isNaN(n)) return fmtBRL(n);
  if (type === "percent" && !isNaN(n)) return fmtPct(n > 1 ? n / 100 : n);
  if (type === "number" && !isNaN(n)) return fmtNum(n);
  if (type === "date") {
    const d = new Date(String(v));
    if (!isNaN(d.getTime())) return d.toLocaleDateString("pt-BR");
  }
  return String(v);
}

export function DynamicSheetTable({ sheetId, canEdit }: { sheetId: string; canEdit: boolean }) {
  const [cols, setCols] = useState<Col[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ rowId: string; letter: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: r }] = await Promise.all([
      supabase.from("gov_dataset_columns").select("*").eq("sheet_id", sheetId).eq("ignored", false).order("col_index"),
      supabase.from("gov_dataset_rows").select("*").eq("sheet_id", sheetId).order("row_index").limit(500),
    ]);
    setCols((c ?? []) as Col[]);
    setRows((r ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [sheetId]);

  // Realtime
  useEffect(() => {
    const ch = supabase.channel(`gov-rows-${sheetId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "gov_dataset_rows", filter: `sheet_id=eq.${sheetId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [sheetId]);

  const colsAgg = useMemo(() => buildColsAggregation(rows), [rows]);

  const saveCell = async (row: Row, letter: string, raw: string) => {
    let parsed: unknown = raw;
    const col = cols.find((x) => x.col_letter === letter);
    if (col && (col.data_type === "number" || col.data_type === "currency" || col.data_type === "percent")) {
      const n = Number(raw.replace(/\./g, "").replace(",", "."));
      parsed = isNaN(n) ? raw : n;
    }
    const newValues = { ...row.values, [letter]: parsed };
    const { error } = await supabase.from("gov_dataset_rows").update({ values: newValues }).eq("id", row.id);
    if (error) { toast.error("Erro ao salvar célula"); return; }
    setEditing(null);
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, values: newValues } : r)));
  };

  const recomputeAll = async () => {
    toast.info("Recalculando fórmulas…");
    const formulaCols = cols.filter((c) => c.is_formula && c.formula_js);
    if (formulaCols.length === 0) { toast.success("Nenhuma fórmula para recalcular"); return; }
    let updated = 0;
    for (const r of rows) {
      const computed: Record<string, unknown> = {};
      for (const fc of formulaCols) computed[fc.col_letter] = evalFormula(fc.formula_js, r.values, colsAgg);
      await supabase.from("gov_dataset_rows").update({ computed }).eq("id", r.id);
      updated++;
    }
    toast.success(`${updated} linhas recalculadas`);
    load();
  };

  if (loading) return <div className="flex items-center justify-center p-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" />Carregando…</div>;
  if (cols.length === 0) return <div className="p-8 text-center text-muted-foreground">Sem colunas detectadas.</div>;

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{rows.length} linhas · {cols.length} colunas</span>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={recomputeAll}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />Recalcular fórmulas
          </Button>
        )}
      </div>
      <ScrollArea className="h-[500px] border rounded">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead className="w-12 text-xs">#</TableHead>
              {cols.map((c) => (
                <TableHead key={c.id} className="text-xs whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {c.header}
                    {c.is_formula && (
                      <Tooltip>
                        <TooltipTrigger asChild><Badge variant="secondary" className="h-4 px-1 text-[10px]"><Sigma className="h-2.5 w-2.5" /></Badge></TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="text-xs"><b>Fórmula:</b> {c.formula_excel}</div>
                          {c.formula_purpose && <div className="text-xs mt-1">{c.formula_purpose}</div>}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs text-muted-foreground">{r.row_index}</TableCell>
                {cols.map((c) => {
                  const isEditing = editing?.rowId === r.id && editing.letter === c.col_letter;
                  let value: unknown = r.values[c.col_letter];
                  if (c.is_formula) value = r.computed?.[c.col_letter] ?? evalFormula(c.formula_js, r.values, colsAgg);
                  return (
                    <TableCell key={c.id} className={`text-xs whitespace-nowrap ${c.is_formula ? "bg-primary/5 text-primary" : ""}`}
                      onDoubleClick={() => { if (canEdit && !c.is_formula) { setEditing({ rowId: r.id, letter: c.col_letter }); setEditValue(String(r.values[c.col_letter] ?? "")); } }}>
                      {isEditing ? (
                        <Input autoFocus className="h-7 text-xs" value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => saveCell(r, c.col_letter, editValue)}
                          onKeyDown={(e) => { if (e.key === "Enter") saveCell(r, c.col_letter, editValue); if (e.key === "Escape") setEditing(null); }} />
                      ) : (
                        formatValue(value, c.data_type)
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </TooltipProvider>
  );
}
