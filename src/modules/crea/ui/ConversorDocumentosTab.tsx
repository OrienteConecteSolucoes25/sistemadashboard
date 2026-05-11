import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileDown, FileUp, Wand2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const MODELOS = [
  { value: "relatorio_crea", label: "Modelo 1 · Relatório CREA" },
  { value: "art_bloco",      label: "Modelo 2 · ART por Bloco" },
  { value: "servicos",       label: "Modelo 3 · Relatório Gerencial de Serviços" },
];

function fileToBase64(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result ?? "");
      resolve(s.split(",")[1] ?? s);
    };
    r.onerror = reject;
    r.readAsDataURL(f);
  });
}

export default function ConversorDocumentosTab() {
  const [file, setFile] = useState<File | null>(null);
  const [modelo, setModelo] = useState<string>("relatorio_crea");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ rowCount: number; headers: string[]; rows: any[]; csv: string } | null>(null);

  const generate = async () => {
    if (!file) { toast.error("Selecione um arquivo (PDF, Word, imagem)"); return; }
    setBusy(true); setResult(null);
    try {
      const fileBase64 = await fileToBase64(file);
      const { data, error } = await (supabase.functions.invoke as any)("crea-doc-to-csv", {
        body: { fileBase64, mime: file.type, modelo, fileName: file.name },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error ?? "Falha na conversão");
      setResult(data);
      toast.success(`${data.rowCount} registro(s) extraído(s)`);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro inesperado");
    } finally { setBusy(false); }
  };

  const downloadCsv = () => {
    if (!result) return;
    const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${modelo}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Wand2 className="w-4 h-4 text-primary" /> Conversor de Documentos · PDF/Word → CSV</CardTitle>
          <p className="text-xs text-muted-foreground">
            Envie um documento do CREA, escolha o modelo e gere uma planilha CSV pronta para importar nas abas de Governança ART.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label className="text-xs">Modelo de saída</Label>
              <Select value={modelo} onValueChange={setModelo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODELOS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Arquivo (PDF, Word, imagem)</Label>
              <Input type="file" accept=".pdf,.doc,.docx,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={generate} disabled={busy || !file}>
              {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileUp className="w-4 h-4 mr-1" />}
              Gerar CSV
            </Button>
            {result && (
              <Button variant="outline" onClick={downloadCsv}>
                <FileDown className="w-4 h-4 mr-1" /> Baixar CSV
              </Button>
            )}
            {result && <Badge variant="secondary">{result.rowCount} linhas</Badge>}
          </div>

          {result && result.rows.length > 0 && (
            <div className="border rounded max-h-72 overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>{result.headers.map((h) => <th key={h} className="text-left px-2 py-1 whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {result.rows.slice(0, 30).map((r, i) => (
                    <tr key={i} className="border-t">
                      {result.headers.map((h) => <td key={h} className="px-2 py-1 whitespace-nowrap">{String(r[h] ?? "")}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.rows.length > 30 && (
                <p className="text-[11px] text-muted-foreground p-2">Pré-visualização: 30 de {result.rows.length} linhas. Baixe o CSV para ver tudo.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
