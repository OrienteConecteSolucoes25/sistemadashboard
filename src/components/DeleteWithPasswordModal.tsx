import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  softDeleteRecord,
  DELETE_ERROR_MESSAGES,
  type SoftDeleteTable,
} from "@/modules/engenharia/lib/deleteWithAudit";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  table: SoftDeleteTable;
  recordId?: string | null;
  /** Quando informado, exclui em lote (uma senha+motivo para todos). */
  recordIds?: string[];
  recordLabel?: string | null;
  moduleLabel?: string;
  onDeleted?: () => void;
}

export function DeleteWithPasswordModal({
  open, onOpenChange, table, recordId, recordIds, recordLabel, moduleLabel, onDeleted,
}: Props) {
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const ids = (recordIds && recordIds.length > 0)
    ? recordIds
    : (recordId ? [recordId] : []);
  const isBulk = ids.length > 1;

  const reset = () => { setPassword(""); setReason(""); };

  const handleConfirm = async () => {
    if (ids.length === 0) return;
    if (!reason.trim()) { toast.error("Informe o motivo da exclusão."); return; }
    if (!password.trim()) { toast.error("Digite a senha de confirmação."); return; }
    setBusy(true);
    let okCount = 0;
    let lastErr: string | undefined;
    // Roda em paralelo com limite simples (lotes de 5)
    for (let i = 0; i < ids.length; i += 5) {
      const slice = ids.slice(i, i + 5);
      const results = await Promise.all(
        slice.map((id) => softDeleteRecord(table, id, password, reason.trim())),
      );
      results.forEach((r) => { if (r.ok) okCount++; else lastErr = r.error; });
    }
    setBusy(false);
    if (okCount === 0) {
      toast.error(DELETE_ERROR_MESSAGES[lastErr ?? ""] ?? "Falha ao excluir.");
      return;
    }
    if (okCount < ids.length) {
      toast.warning(`${okCount} de ${ids.length} registros excluídos. ${DELETE_ERROR_MESSAGES[lastErr ?? ""] ?? ""}`);
    } else {
      toast.success(isBulk
        ? `${okCount} registros excluídos (soft delete) e registrados na rastreabilidade.`
        : "Registro excluído (soft delete) e registrado na rastreabilidade.");
    }
    reset();
    onOpenChange(false);
    onDeleted?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) { onOpenChange(o); if (!o) reset(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-destructive" /> Confirmar exclusão
          </DialogTitle>
          <DialogDescription>
            Esta ação faz exclusão lógica e fica registrada na auditoria.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription className="text-xs space-y-1">
            <div><strong>Módulo:</strong> {moduleLabel ?? table}</div>
            <div><strong>Registro:</strong> {isBulk
              ? `${ids.length} registros selecionados`
              : (recordLabel ?? ids[0])}</div>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div>
            <Label htmlFor="del-reason">Motivo da exclusão *</Label>
            <Textarea id="del-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: Registro duplicado / cadastro incorreto" />
          </div>
          <div>
            <Label htmlFor="del-pwd">Senha de confirmação *</Label>
            <Input id="del-pwd" type="password" autoComplete="off" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={busy}>
            {busy && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Confirmar exclusão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
