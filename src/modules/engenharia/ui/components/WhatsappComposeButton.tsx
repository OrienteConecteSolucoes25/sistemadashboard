import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { sendWhatsapp, type WaSendInput } from "../../lib/automations/whatsapp";

interface Props {
  defaults?: Partial<WaSendInput>;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
}

export function WhatsappComposeButton({ defaults, variant = "outline", size = "sm", label = "WhatsApp" }: Props) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(defaults?.phone ?? "");
  const [message, setMessage] = useState(defaults?.message ?? "");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!message.trim()) { toast.error("Mensagem obrigatória."); return; }
    setBusy(true);
    try {
      await sendWhatsapp({
        phone, message,
        origem: defaults?.origem, origem_id: defaults?.origem_id,
        modulo: defaults?.modulo, notify_internal: true,
      });
      toast.success("WhatsApp aberto e registrado.");
      setOpen(false);
    } catch (e: any) {
      toast.error("Falha: " + (e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}><MessageCircle className="h-4 w-4 mr-2" />{label}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Preparar WhatsApp</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label>Telefone (E.164, apenas dígitos)</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="5511999998888" />
          </div>
          <div className="grid gap-1.5">
            <Label>Mensagem</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={send} disabled={busy}>{busy ? "Abrindo..." : "Abrir WhatsApp"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
