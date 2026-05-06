import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Eye } from "lucide-react";
import { useImpersonation } from "../hooks/useImpersonation";
import { toast } from "sonner";

export default function ImpersonateButton({ company }: { company: { id: string; nome: string } }) {
  const imp = useImpersonation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [dataAccess, setDataAccess] = useState(false);

  async function go() {
    if (!reason.trim()) { toast.error("Informe um motivo"); return; }
    try {
      await imp.start(company, { reason, dataAccess });
      toast.success(`Visualizando ambiente de ${company.nome}`);
      setOpen(false);
    } catch (e: any) { toast.error(e.message || "Falha ao iniciar"); }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Eye className="w-4 h-4 mr-1" /> Ver como cliente
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Visualizar ambiente de {company.nome}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Você verá o ERP exatamente como o cliente vê (módulos liberados, layout, fluxo).
              Por padrão os dados ficam mascarados — só ative "ver dados reais" se o cliente autorizou.
              Toda sessão é registrada em auditoria.
            </p>
            <div>
              <Label>Motivo da visualização *</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                placeholder="Ex: Cliente reportou bug na tela de Sites" />
            </div>
            <label className="flex items-start gap-2">
              <Checkbox checked={dataAccess} onCheckedChange={(v) => setDataAccess(!!v)} />
              <span className="text-xs">Cliente autorizou ver os <b>dados reais</b> (não apenas a estrutura).</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={go}>Iniciar visualização</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
