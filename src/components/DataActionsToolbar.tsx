import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Download, Upload, FileSpreadsheet, FileText, FileType2 } from "lucide-react";
import { toast } from "sonner";
import { downloadTemplate, exportData, type IOFormat } from "@/lib/dataIO";
import type { FieldSchema } from "@/modules/engenharia/ui/crud/types";
import { ImportDataModal } from "@/components/ImportDataModal";

type Props = {
  table: string;
  title: string;
  fields: FieldSchema[];
  rows: any[];
  onImported?: () => void;
  /** se false, oculta botão de importar (quando tabela é só leitura) */
  canImport?: boolean;
};

const formatIcon = (f: IOFormat) =>
  f === "xlsx" ? <FileSpreadsheet className="w-4 h-4 mr-2" /> :
  f === "docx" ? <FileType2 className="w-4 h-4 mr-2" /> :
                 <FileText className="w-4 h-4 mr-2" />;

const formatLabel = (f: IOFormat) => f === "xlsx" ? "Excel (.xlsx)" : f === "docx" ? "Word (.docx)" : "CSV (.csv)";

export const DataActionsToolbar = ({ table, title, fields, rows, onImported, canImport = true }: Props) => {
  const [importOpen, setImportOpen] = useState(false);

  const doExport = async (format: IOFormat) => {
    if (rows.length === 0) {
      toast.warning("Nenhum dado para exportar");
      return;
    }
    try {
      await exportData({ rows, fields, filename: table, format, title });
      toast.success(`Exportado (${format.toUpperCase()})`);
    } catch (e: any) {
      toast.error("Falha ao exportar: " + (e?.message ?? e));
    }
  };

  const doTemplate = async (format: IOFormat) => {
    try {
      await downloadTemplate({ fields, filename: table, format, title });
      toast.success("Modelo baixado");
    } catch (e: any) {
      toast.error("Falha ao gerar modelo: " + (e?.message ?? e));
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Exportar</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Exportar dados</DropdownMenuLabel>
          {(["xlsx", "csv", "docx"] as IOFormat[]).map((f) => (
            <DropdownMenuItem key={f} onClick={() => doExport(f)}>{formatIcon(f)} {formatLabel(f)}</DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Modelo (vazio com cabeçalhos)</DropdownMenuLabel>
          {(["xlsx", "csv", "docx"] as IOFormat[]).map((f) => (
            <DropdownMenuItem key={"t" + f} onClick={() => doTemplate(f)}>{formatIcon(f)} Modelo {formatLabel(f)}</DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {canImport && (
        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
          <Upload className="w-4 h-4 mr-1" /> Importar
        </Button>
      )}

      <ImportDataModal
        open={importOpen}
        onOpenChange={setImportOpen}
        table={table}
        title={title}
        fields={fields}
        onImported={onImported}
      />
    </>
  );
};

export default DataActionsToolbar;
