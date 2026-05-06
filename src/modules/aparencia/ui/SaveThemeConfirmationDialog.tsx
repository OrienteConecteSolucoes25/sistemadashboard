import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyName: string;
  presetBefore: string;
  presetAfter: string;
  changedColors: string[];
  layoutChanged: boolean;
  chartsChanged: boolean;
  saving: boolean;
  onConfirm: () => void;
}

export function SaveThemeConfirmationDialog(p: Props) {
  return (
    <Dialog open={p.open} onOpenChange={p.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aplicar alterações visuais?</DialogTitle>
          <DialogDescription>
            Deseja realmente aplicar esta alteração visual para a empresa selecionada?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Empresa</span>
            <strong>{p.companyName || "—"}</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Tema</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{p.presetBefore}</Badge>
              <span>→</span>
              <Badge>{p.presetAfter}</Badge>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cores alteradas</span>
            <strong>{p.changedColors.length}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Layout/tipografia</span>
            <strong>{p.layoutChanged ? "Modificado" : "—"}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gráficos</span>
            <strong>{p.chartsChanged ? "Modificado" : "—"}</strong>
          </div>
          <div className="flex gap-2 p-3 rounded-md bg-warn/10 text-warn-foreground border border-warn/30">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-warn" />
            <p className="text-xs">
              Esta alteração será vista por todos os usuários da empresa selecionada assim que recarregarem.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => p.onOpenChange(false)} disabled={p.saving}>Cancelar</Button>
          <Button onClick={p.onConfirm} disabled={p.saving}>
            {p.saving ? "Salvando..." : "Confirmar e aplicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
