import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { composeOutlook, type ComposeInput, type OutlookMode } from "../../lib/automations/outlook";

interface Props {
  defaults?: Partial<ComposeInput>;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
}

/** Botão que abre composer Outlook (mailto / OWA / desktop) e registra log. */
export function OutlookComposeButton({ defaults, variant = "outline", size = "sm", label = "E-mail" }: Props) {
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState((defaults?.to ?? []).join(", "));
  const [cc, setCc] = useState((defaults?.cc ?? []).join(", "));
  const [assunto, setAssunto] = useState(defaults?.assunto ?? "");
  const [corpo, setCorpo] = useState(defaults?.corpo ?? "");
  const [mode, setMode] = useState<OutlookMode>("mailto");
  const [busy, setBusy] = useState(false);

  const split = (s: string) => s.split(/[,;]/).map((x) => x.trim()).filter(Boolean);

  async function send() {
    if (!to.trim()) { toast.error("Informe ao menos um destinatário."); return; }
    setBusy(true);
    try {
      await composeOutlook({
        to: split(to), cc: split(cc), assunto, corpo,
        origem: defaults?.origem, origem_id: defaults?.origem_id,
        modulo: defaults?.modulo, notify_internal: true,
      }, mode);
      toast.success("Composer aberto e registrado no log.");
      setOpen(false);
    } catch (e: any) {
      toast.error("Falha ao preparar e-mail: " + (e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}><Mail className="h-4 w-4 mr-2" />{label}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Preparar e-mail (Outlook)</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label>Para</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="nome@dominio, outro@dominio" />
          </div>
          <div className="grid gap-1.5">
            <Label>Cc</Label>
            <Input value={cc} onChange={(e) => setCc(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Assunto</Label>
            <Input value={assunto} onChange={(e) => setAssunto(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Corpo</Label>
            <Textarea value={corpo} onChange={(e) => setCorpo(e.target.value)} rows={8} />
          </div>
          <div className="grid gap-1.5">
            <Label>Abrir em</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as OutlookMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mailto">Cliente padrão (mailto)</SelectItem>
                <SelectItem value="owa">Outlook Web (nova aba)</SelectItem>
                <SelectItem value="ms-outlook">Outlook Desktop (ms-outlook)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={send} disabled={busy}>{busy ? "Abrindo..." : "Abrir composer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
