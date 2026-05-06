import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, FileWarning } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { FieldSchema } from "@/modules/engenharia/ui/crud/types";
import { parseImportFile, mapImportedRowsToRecords } from "@/lib/dataIO";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  table: string;
  title: string;
  fields: FieldSchema[];
  onImported?: () => void;
};

export const ImportDataModal = ({ open, onOpenChange, table, title, fields, onImported }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ records: any[]; headers: string[]; unmatched: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const reset = () => { setFile(null); setPreview(null); };

  const handleFile = async (f: File | null) => {
    setFile(f);
    setPreview(null);
    if (!f) return;
    setLoading(true);
    try {
      const parsed = await parseImportFile(f);
      const records = mapImportedRowsToRecords(parsed, fields);
      const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, "_");
      const validKeys = new Set([...fields.map((x) => x.key), ...fields.map((x) => norm(x.label))]);
      const unmatched = parsed.headers.filter((h) => !validKeys.has(norm(h)));
      setPreview({ records, headers: parsed.headers, unmatched });
    } catch (e: any) {
      toast.error("Falha ao ler arquivo: " + (e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const commit = async () => {
    if (!preview || preview.records.length === 0) return;
    setImporting(true);
    try {
      const chunkSize = 200;
      let inserted = 0;
      for (let i = 0; i < preview.records.length; i += chunkSize) {
        const slice = preview.records.slice(i, i + chunkSize);
        const { error } = await (supabase.from(table as any).insert(slice) as any);
        if (error) throw error;
        inserted += slice.length;
      }
      toast.success(`${inserted} registros importados`);
      onImported?.();
      onOpenChange(false);
      reset();
    } catch (e: any) {
      toast.error("Erro ao importar: " + (e?.message ?? e));
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Importar · {title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Aceita arquivos <strong>.csv</strong>, <strong>.xlsx</strong> ou <strong>.xls</strong>. Baixe o modelo se quiser garantir as colunas corretas.
          </p>
          <Input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          {loading && <p className="text-sm text-muted-foreground">Lendo arquivo...</p>}
          {preview && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="secondary">{preview.records.length} linhas</Badge>
                <Badge variant="outline">{preview.headers.length} colunas</Badge>
                {preview.unmatched.length > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <FileWarning className="w-3 h-3" /> {preview.unmatched.length} colunas ignoradas
                  </Badge>
                )}
              </div>
              {preview.unmatched.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Ignoradas (não casaram com nenhum campo): {preview.unmatched.join(", ")}
                </p>
              )}
              <div className="border rounded max-h-72 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>{fields.map((f) => <th key={f.key} className="text-left px-2 py-1">{f.label}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.records.slice(0, 20).map((r, i) => (
                      <tr key={i} className="border-t">
                        {fields.map((f) => <td key={f.key} className="px-2 py-1">{String(r[f.key] ?? "")}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.records.length > 20 && (
                <p className="text-xs text-muted-foreground">Mostrando 20 de {preview.records.length} linhas.</p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={commit} disabled={!preview || preview.records.length === 0 || importing}>
            <Upload className="w-4 h-4 mr-1" /> {importing ? "Importando..." : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDataModal;
