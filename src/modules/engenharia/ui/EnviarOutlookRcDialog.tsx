import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";
import type { ScRcRow } from "../lib/scrcStore";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  solicit: any | null;
  scRcs: ScRcRow[];
}

export function EnviarOutlookRcDialog({ open, onOpenChange, solicit, scRcs }: Props) {
  const [to, setTo] = useState("suprimentos@empresa.com");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [extra, setExtra] = useState("");
  const [sending, setSending] = useState(false);

  const defaultSubject = solicit
    ? `Requisição ${solicit.numero || solicit.id?.slice(0, 6)} — ${solicit.descricao?.slice(0, 60) || "materiais"}`
    : "Requisição de materiais";

  const buildHtml = () => {
    const items = (Array.isArray(solicit?.itens) ? solicit.itens : []) as any[];
    const itensHtml = items.length
      ? `<h4>Itens</h4><ul>${items.map(i => `<li>${i.quantidade || ""} ${i.unidade || ""} — ${i.descricao || ""}</li>`).join("")}</ul>`
      : "";
    const scrcHtml = scRcs.length
      ? `<h4>SC/RC vinculados</h4><table border="1" cellpadding="6" style="border-collapse:collapse;font-size:12px">
          <tr><th>Tipo</th><th>Nº</th><th>Categoria</th><th>Conta fin.</th><th>Centro custo</th><th>Status</th><th>Data</th></tr>
          ${scRcs.map(r => `<tr>
            <td>${r.tipo_documento || ""}</td><td>${r.numero_documento || ""}</td>
            <td>${r.categoria || ""}</td><td>${r.conta_financeira || ""}</td>
            <td>${r.centro_custo || ""}</td><td>${r.status || ""}</td>
            <td>${r.data_solicitacao || ""}</td>
          </tr>`).join("")}
        </table>`
      : "";
    return `
      <div style="font-family:Arial,sans-serif;font-size:13px;color:#1a1f26">
        <h3>Requisição ${solicit?.numero || ""}</h3>
        <p><strong>Solicitante:</strong> ${solicit?.solicitante || "—"}<br/>
           <strong>Responsável:</strong> ${solicit?.responsavel || "—"}<br/>
           <strong>Prazo:</strong> ${solicit?.prazo || "—"}<br/>
           <strong>Status:</strong> ${solicit?.status || "—"}</p>
        ${solicit?.descricao ? `<p>${String(solicit.descricao).replace(/\n/g, "<br/>")}</p>` : ""}
        ${itensHtml}
        ${scrcHtml}
        ${extra ? `<hr/><p>${extra.replace(/\n/g, "<br/>")}</p>` : ""}
      </div>`;
  };

  const send = async () => {
    if (!to.trim()) return toast.error("Informe o destinatário");
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("eng-outlook-send", {
        body: {
          to: to.split(",").map(s => s.trim()).filter(Boolean),
          cc: cc.split(",").map(s => s.trim()).filter(Boolean),
          subject: subject || defaultSubject,
          html: buildHtml(),
        },
      });
      if (error || !data?.ok) throw new Error(data?.error || error?.message || "Falha");
      toast.success("Email enviado via Outlook");
      onOpenChange(false);
      setExtra("");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao enviar");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />Enviar SC/RC por Outlook
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Para (separe por vírgula) *</Label>
            <Input value={to} onChange={e => setTo(e.target.value)} /></div>
          <div><Label className="text-xs">CC</Label>
            <Input value={cc} onChange={e => setCc(e.target.value)} /></div>
          <div><Label className="text-xs">Assunto</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder={defaultSubject} /></div>
          <div><Label className="text-xs">Mensagem adicional</Label>
            <Textarea rows={3} value={extra} onChange={e => setExtra(e.target.value)} placeholder="Texto livre antes do conteúdo da requisição (opcional)" /></div>
          <div className="text-xs text-muted-foreground">
            Conteúdo automático: dados da solicitação + {scRcs.length} SC/RC vinculados.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={send} disabled={sending}>
            <Send className="h-4 w-4 mr-1" />{sending ? "Enviando…" : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
