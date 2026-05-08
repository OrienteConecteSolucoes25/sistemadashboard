import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";

interface Props {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  label?: string;
  deleteLabel?: string;
  disabled?: boolean;
}

/**
 * Barra fixa que aparece quando há itens selecionados em uma lista.
 * Mostra contagem + botão "Limpar seleção" + botão "Excluir selecionados".
 */
export function BulkActionsBar({ count, onClear, onDelete, label, deleteLabel, disabled }: Props) {
  if (count === 0) return null;
  return (
    <div className="sticky top-0 z-30 mb-2 flex items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm shadow-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium text-primary">
          {count} {label ?? (count === 1 ? "item selecionado" : "itens selecionados")}
        </span>
        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onClear}>
          <X className="w-3.5 h-3.5 mr-1" /> Limpar
        </Button>
      </div>
      <Button variant="destructive" size="sm" onClick={onDelete} disabled={disabled}>
        <Trash2 className="w-3.5 h-3.5 mr-1" />
        {deleteLabel ?? "Excluir selecionados"}
      </Button>
    </div>
  );
}
