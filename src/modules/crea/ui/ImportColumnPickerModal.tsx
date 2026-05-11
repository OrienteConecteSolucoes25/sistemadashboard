import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { parseImportFile } from "@/lib/dataIO";
import { mapAdaptive } from "@/modules/crea/lib/creaCrud";
import type { FieldSchema } from "@/modules/engenharia/ui/crud/types";
import { supabase } from "@/integrations/supabase/client";

const sb: any = supabase;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  table: string;
  title: string;
  fields: FieldSchema[];
  companyId?: string | null;
  onImported?: () => void;
}

export default function ImportColumnPickerModal({ open, onOpenChange, table, title, fields, companyId, onImported }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<{ headers: string[]; rows: any[][] } | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [importing, setImporting] = useState(false);

  useEffect(() => { if (!open) { setFile(null); setParsed(null); setSelected({}); } }, [open]);

  const handleFile = async (f: File | null) => {
    setFile(f); setParsed(null);
    if (!f) return;
    try {
      const p = await parseImportFile(f);
      setParsed({ headers: p.headers, rows: p.rows as any });
      const init: Record<string, boolean> = {};
      p.headers.forEach(h => init[h] = true);
      setSelected(init);
    } catch (e: any) { toast.error("Falha ao ler: " + (e?.message ?? e)); }
  };

  const preview = useMemo(() => {
    if (!parsed) return null;
    const keepHeaders = parsed.headers.filter(h => selected[h]);
    const keepIdx = parsed.headers.map((h, i) => selected[h] ? i : -1).filter(i => i >= 0);
    const rows = parsed.rows.map(r => keepIdx.map(i => r[i]));
    return { headers: keepHeaders, rows };
  }, [parsed, selected]);

  const commit = async () => {
    if (!preview || preview.rows.length === 0) return;
    setImporting(true);
    try {
      const records = mapAdaptive(preview.rows, preview.headers, fields);
      const enriched = companyId ? records.map(r => ({ ...r, company_id: companyId })) : records;
      const chunk = 200;
      let n = 0;
      for (let i = 0; i < enriched.length; i += chunk) {
        const slice = enriched.slice(i, i + chunk);
        const { error } = await sb.from(table).insert(slice);
        if (error) throw error;
        n += slice.length;
      }
      toast.success(`${n} registros importados`);
      onImported?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Erro: " + (e?.message ?? e));
    } finally { setImporting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!importing) onOpenChange(o); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <DialogTitle>Importar · {title}</DialogTitle>
          <DialogDescription>Selecione quais colunas da planilha você quer importar.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-0">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Arquivo (.csv, .xlsx, .xls)</label>
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              className="h-9 text-sm file:mr-2 file:px-3 file:py-1 file:rounded file:border-0 file:bg-primary file:text-primary-foreground file:text-xs"
            />
          </div>

          {parsed && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{parsed.rows.length} linhas</Badge>
                <Badge variant="outline">{parsed.headers.length} colunas</Badge>
                <Badge>{Object.values(selected).filter(Boolean).length} selecionadas</Badge>
                <Button size="sm" variant="ghost" onClick={() => { const all: any = {}; parsed.headers.forEach(h => all[h] = true); setSelected(all); }}>Marcar todas</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected({})}>Limpar</Button>
              </div>
              <div className="border rounded p-2 grid grid-cols-2 md:grid-cols-3 gap-1 max-h-48 overflow-auto">
                {parsed.headers.map(h => (
                  <label key={h} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded">
                    <Checkbox checked={!!selected[h]} onCheckedChange={(v) => setSelected(s => ({ ...s, [h]: !!v }))} />
                    <span className="truncate" title={h}>{h}</span>
                  </label>
                ))}
              </div>
              {preview && preview.rows.length > 0 && (
                <div className="border rounded max-h-60 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>{preview.headers.map(h => <th key={h} className="text-left px-2 py-1 whitespace-nowrap">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {preview.rows.slice(0, 10).map((r, i) => (
                        <tr key={i} className="border-t">{r.map((c, j) => <td key={j} className="px-2 py-1 whitespace-nowrap">{String(c ?? "")}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-3 border-t bg-background">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={importing}>Cancelar</Button>
          <Button onClick={commit} disabled={!preview || preview.rows.length === 0 || importing}>
            <Upload className="w-4 h-4 mr-1" />{importing ? "Importando…" : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
