import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Clock } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyId: string | null;
  entidadeTipo: string; // ex: comm_content_posts
  entidadeId: string;
  defaultCaption?: string;
  defaultMediaUrls?: string[];
  onScheduled?: () => void;
}

export function ScheduleDialog({
  open, onOpenChange, companyId, entidadeTipo, entidadeId,
  defaultCaption = "", defaultMediaUrls = [], onScheduled,
}: Props) {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState<string>("");
  const [caption, setCaption] = useState(defaultCaption);
  const [media, setMedia] = useState((defaultMediaUrls ?? []).join("\n"));
  const [mode, setMode] = useState<"now" | "schedule">("schedule");
  const [scheduledFor, setScheduledFor] = useState<string>(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !companyId) return;
    (async () => {
      const { data } = await supabase
        .from("comm_social_accounts")
        .select("id, provider, account_name, status")
        .eq("company_id", companyId)
        .eq("status", "connected")
        .order("provider");
      setAccounts(data ?? []);
      if (data?.[0] && !accountId) setAccountId(data[0].id);
    })();
    setCaption(defaultCaption);
    setMedia((defaultMediaUrls ?? []).join("\n"));
  }, [open, companyId]);

  async function submit() {
    if (!companyId) return;
    if (!accountId) { toast({ title: "Selecione uma conta conectada", variant: "destructive" }); return; }
    if (!caption.trim()) { toast({ title: "Legenda obrigatória", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const acc = accounts.find((a) => a.id === accountId);
      const mediaArr = media.split("\n").map((s) => s.trim()).filter(Boolean);
      const sched = mode === "now" ? new Date().toISOString() : new Date(scheduledFor).toISOString();
      const { data, error } = await supabase.from("comm_social_publish_queue").insert({
        company_id: companyId,
        social_account_id: accountId,
        entidade_tipo: entidadeTipo,
        entidade_id: entidadeId,
        caption,
        media_urls: mediaArr,
        scheduled_for: sched,
        status: mode === "now" ? "enviando" : "agendado",
      }).select("id").maybeSingle();
      if (error) throw error;

      if (mode === "now" && data?.id) {
        // dispara publicação imediatamente via edge function
        await supabase.functions.invoke("comm-social-publish", {
          body: { queue_id: data.id },
        });
      }

      toast({
        title: mode === "now" ? "Publicação enviada" : "Agendado",
        description: `${acc?.provider?.toUpperCase()} · ${acc?.account_name}`,
      });
      onOpenChange(false);
      onScheduled?.();
    } catch (e: any) {
      toast({ title: "Falha ao agendar", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Publicar / Agendar</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Conta social *</Label>
            {accounts.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2">
                Nenhuma conta conectada. Conecte uma em Comunicação → Integrações.
              </p>
            ) : (
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue placeholder="Escolha…" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.provider.toUpperCase()} · {a.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <Label>Legenda *</Label>
            <Textarea rows={4} value={caption} onChange={(e) => setCaption(e.target.value)} />
          </div>
          <div>
            <Label>Mídias (URLs, uma por linha)</Label>
            <Textarea rows={2} value={media} onChange={(e) => setMedia(e.target.value)} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button" variant={mode === "schedule" ? "default" : "outline"}
              onClick={() => setMode("schedule")}
            >
              <Clock className="w-4 h-4 mr-1" /> Agendar
            </Button>
            <Button
              type="button" variant={mode === "now" ? "default" : "outline"}
              onClick={() => setMode("now")}
            >
              <Send className="w-4 h-4 mr-1" /> Publicar agora
            </Button>
          </div>
          {mode === "schedule" && (
            <div>
              <Label>Data/hora *</Label>
              <Input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={submit} disabled={busy || accounts.length === 0}>
            {busy ? "Enviando…" : mode === "now" ? "Publicar" : "Agendar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
