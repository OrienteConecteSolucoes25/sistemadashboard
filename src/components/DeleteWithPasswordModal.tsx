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
  recordId: string | null;
  recordLabel?: string | null;
  moduleLabel?: string;
  onDeleted?: () => void;
}

export function DeleteWithPasswordModal({
  open, onOpenChange, table, recordId, recordLabel, moduleLabel, onDeleted,
}: Props) {
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => { setPassword(""); setReason(""); };

  const handleConfirm = async () => {
    if (!recordId) return;
    if (!reason.trim()) { toast.error("Informe o motivo da exclusão."); return; }
    if (!password.trim()) { toast.error("Digite a senha de confirmação."); return; }
    setBusy(true);
    const res = await softDeleteRecord(table, recordId, password, reason.trim());
    setBusy(false);
    if (!res.ok) {
      toast.error(DELETE_ERROR_MESSAGES[res.error ?? ""] ?? "Falha ao excluir.");
      return;
    }
    toast.success("Registro excluído (soft delete) e registrado na rastreabilidade.");
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
            <div><strong>Registro:</strong> {recordLabel ?? recordId}</div>
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
