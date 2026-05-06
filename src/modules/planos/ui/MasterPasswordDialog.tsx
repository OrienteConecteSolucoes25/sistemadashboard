import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const sb: any = supabase;

type Props = {
  open: boolean;
  companyId: string;
  companyName: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function MasterPasswordDialog({ open, companyId, companyName, onClose, onSuccess }: Props) {
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);

  async function check() {
    if (!pwd) return;
    setBusy(true);
    try {
      const { data, error } = await sb.rpc("verify_company_master_password", {
        _company_id: companyId,
        _password: pwd,
      });
      if (error) throw error;
      if (data === true) {
        toast.success("Senha mestre validada");
        setPwd("");
        onSuccess();
      } else {
        toast.error("Senha mestre incorreta");
      }
    } catch (e: any) {
      toast.error(e.message || "Falha ao validar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && (setPwd(""), onClose())}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> Senha mestre — {companyName}
          </DialogTitle>
          <DialogDescription>
            Para visualizar os <b>dados reais</b> deste cliente, informe a senha mestre que ele
            cadastrou ao contratar o ERP. Por padrão é <code>12345678</code> até o cliente alterar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Senha mestre</Label>
          <Input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
            autoFocus
            placeholder="••••••••"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setPwd(""); onClose(); }}>Cancelar</Button>
          <Button onClick={check} disabled={busy || !pwd}>
            {busy ? "Validando…" : "Liberar dados reais"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
