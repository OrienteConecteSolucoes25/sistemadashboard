import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Colunas EXATAS da planilha modelo DADOS_MATERIAIS.xlsx (aba DADOS)
const HEADERS = ["CODIGO", "CONTA FINANCEIRA", "CATEGORIA", "DESCRIÇÃO", "UNIDADE"] as const;

type Item = { codigo: string; conta_financeira: string; categoria: string; descricao: string; unidade: string };

export type CatMatRow = {
  id: string;
  codigo: string;
  conta_financeira: string;
  categoria: string;
  descricao: string;
  unidade: string;
};

const cleanDescricao = (s: any) =>
  String(s ?? "").replace(/^[\u0095\u2022\s•·]+/, "").trim();

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const toRows = (items: CatMatRow[]) =>
  items.map((i) => ({
    "CODIGO": i.codigo,
    "CONTA FINANCEIRA": i.conta_financeira,
    "CATEGORIA": i.categoria,
    "DESCRIÇÃO": i.descricao,
    "UNIDADE": i.unidade,
  }));

const writeXlsx = (rows: any[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(rows, { header: HEADERS as any });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DADOS");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  triggerDownload(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
};

const writeCsv = (rows: any[], filename: string) => {
  const headers = HEADERS;
  const escape = (v: any) => {
    const s = String(v ?? "");
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(";"), ...rows.map((r) => headers.map((h) => escape(r[h])).join(";"))];
  triggerDownload(new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" }), filename);
};

type Props = { items: CatMatRow[]; onImported: () => void };

export const MateriaisCatalogToolbar = ({ items, onImported }: Props) => {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Item[] | null>(null);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const doExport = (fmt: "xlsx" | "csv") => {
    if (!items.length) return toast.warning("Nenhum dado para exportar");
    const rows = toRows(items);
    if (fmt === "xlsx") writeXlsx(rows, "materiais_catalogo.xlsx");
    else writeCsv(rows, "materiais_catalogo.csv");
    toast.success(`Exportado (${fmt.toUpperCase()})`);
  };

  const doTemplate = (fmt: "xlsx" | "csv") => {
    const sample = [{
      "CODIGO": "012465",
      "CONTA FINANCEIRA": "1050",
      "CATEGORIA": "ELÉTRICO",
      "DESCRIÇÃO": "QUADRO QTM 3F PADRÃO CLARO CONFORME PROJETO",
      "UNIDADE": "UN",
    }];
    if (fmt === "xlsx") writeXlsx(sample, "modelo_materiais.xlsx");
    else writeCsv(sample, "modelo_materiais.csv");
    toast.success("Modelo baixado");
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      // tenta aba "DADOS", senão a primeira
      const sheetName = wb.SheetNames.find((n) => n.toUpperCase() === "DADOS") || wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
      const norm = (s: string) => String(s || "").toUpperCase().trim();
      const items: Item[] = json
        .map((r) => {
          const get = (key: string) => {
            const k = Object.keys(r).find((kk) => norm(kk) === key);
            return k ? r[k] : "";
          };
          return {
            codigo: String(get("CODIGO") ?? get("CÓDIGO") ?? "").trim(),
            conta_financeira: String(get("CONTA FINANCEIRA") ?? "").trim(),
            categoria: String(get("CATEGORIA") ?? "").trim(),
            descricao: cleanDescricao(get("DESCRIÇÃO") ?? get("DESCRICAO") ?? ""),
            unidade: String(get("UNIDADE") ?? "").trim() || "UN",
          };
        })
        .filter((i) => i.descricao && !/^#REF/.test(i.descricao));
      if (!items.length) return toast.error("Nenhuma linha válida encontrada");
      setPreview(items);
      setOpen(true);
    } catch (e: any) {
      toast.error("Falha ao ler arquivo: " + (e?.message ?? e));
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const commit = async () => {
    if (!preview?.length) return;
    setImporting(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id ?? null;
      const chunkSize = 200;
      let inserted = 0;
      for (let i = 0; i < preview.length; i += chunkSize) {
        const slice = preview.slice(i, i + chunkSize).map((it) => ({
          kind: "cad_materiais",
          data: {
            codigo: it.codigo,
            conta_financeira: it.conta_financeira,
            categoria: it.categoria,
            descricao: it.descricao,
            unidade: it.unidade,
            quantidade: "0",
          },
          created_by: uid,
        }));
        const { error } = await supabase.from("eng_shared_records").insert(slice as any);
        if (error) throw error;
        inserted += slice.length;
      }
      toast.success(`${inserted} materiais importados`);
      setOpen(false); setPreview(null);
      onImported();
    } catch (e: any) {
      toast.error("Erro ao importar: " + (e?.message ?? e));
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Exportar</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Exportar catálogo</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => doExport("xlsx")}><FileSpreadsheet className="w-4 h-4 mr-2" /> Excel (.xlsx)</DropdownMenuItem>
          <DropdownMenuItem onClick={() => doExport("csv")}><FileText className="w-4 h-4 mr-2" /> CSV (.csv)</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Modelo (vazio com cabeçalhos)</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => doTemplate("xlsx")}><FileSpreadsheet className="w-4 h-4 mr-2" /> Modelo Excel</DropdownMenuItem>
          <DropdownMenuItem onClick={() => doTemplate("csv")}><FileText className="w-4 h-4 mr-2" /> Modelo CSV</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
        <Upload className="w-4 h-4 mr-1" /> Importar
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setPreview(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Importar catálogo de materiais</DialogTitle></DialogHeader>
          {preview && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{preview.length} linhas</Badge>
                <Badge variant="outline">Colunas: {HEADERS.join(", ")}</Badge>
              </div>
              <div className="border rounded max-h-80 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>{HEADERS.map((h) => <th key={h} className="text-left px-2 py-1.5">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 30).map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-1 font-mono">{r.codigo}</td>
                        <td className="px-2 py-1">{r.conta_financeira}</td>
                        <td className="px-2 py-1">{r.categoria}</td>
                        <td className="px-2 py-1">{r.descricao}</td>
                        <td className="px-2 py-1">{r.unidade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.length > 30 && (
                <p className="text-xs text-muted-foreground">Mostrando 30 de {preview.length} linhas.</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={commit} disabled={!preview?.length || importing}>
              <Upload className="w-4 h-4 mr-1" /> {importing ? "Importando..." : `Importar ${preview?.length ?? 0}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MateriaisCatalogToolbar;
