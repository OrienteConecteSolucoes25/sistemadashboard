import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GovAlerta, updateAlerta } from "../lib/govApi";
import { GOV_RULES, SEVERITY_COLOR, SEVERITY_LABEL, Severity } from "../lib/govRules";

export function AlertaResolverModal({
  alerta, onClose, onChanged,
}: { alerta: GovAlerta | null; onClose: () => void; onChanged: () => void }) {
  const [status, setStatus] = useState("aberto");
  const [obs, setObs] = useState("");
  const [prazo, setPrazo] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!alerta) return;
    setStatus(alerta.status);
    setObs(alerta.observacoes ?? "");
    setPrazo(alerta.prazo ?? "");
    setNote("");
  }, [alerta]);

  if (!alerta) return null;
  const rule = GOV_RULES.find(r => r.id === alerta.tipo);
  const hist = Array.isArray(alerta.historico) ? alerta.historico : [];

  async function save() {
    if (!alerta) return;
    setSaving(true);
    try {
      await updateAlerta(alerta.id, {
        status,
        observacoes: obs || null,
        prazo: prazo || null,
      }, note || `Atualizado para ${status}`);
      toast.success("Alerta atualizado.");
      onChanged(); onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao salvar");
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={!!alerta} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {rule?.label ?? alerta.tipo}
            <Badge className={`text-[10px] ${SEVERITY_COLOR[(alerta.criticidade as Severity) ?? "medium"]}`}>
              {SEVERITY_LABEL[(alerta.criticidade as Severity) ?? "medium"]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm">
            <span className="text-muted-foreground">ART: </span>
            <span className="font-mono">{alerta.art?.numero ?? "—"}</span>
            {alerta.art?.uf && <span className="ml-2 text-muted-foreground">CREA-{alerta.art.uf}</span>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_revisao">Em revisão</SelectItem>
                  <SelectItem value="resolvido">Resolvido</SelectItem>
                  <SelectItem value="ignorado">Ignorado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prazo (SLA)</Label>
              <Input type="date" value={prazo} onChange={e => setPrazo(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea value={obs} onChange={e => setObs(e.target.value)} rows={3} />
          </div>

          <div>
            <Label>Anotação desta atualização</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Ex.: Cliente confirmou pagamento via PIX" />
          </div>

          {hist.length > 0 && (
            <div className="border border-border/60 rounded-md p-2 max-h-40 overflow-y-auto">
              <p className="text-xs font-semibold mb-1">Histórico</p>
              <ul className="space-y-1">
                {hist.slice().reverse().map((h: any, i: number) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    <span className="font-mono">{new Date(h.at).toLocaleString("pt-BR")}</span> — {h.note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
