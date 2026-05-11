import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ArtObra, STATUS_OBRA, STATUS_LABEL, TIPOS_OBRA, TIPOS_OBRA_LABEL, UFS_BR } from "./lib/artObrasTypes";
import { createObra, updateObra } from "./lib/artObrasApi";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  companyId: string;
  initial?: ArtObra | null;
  onSaved?: (row: ArtObra) => void;
};

const empty = {
  obra: "", tipo_obra: "civil", cidade: "", uf: "BA", escopo: "", cliente: "",
  coordenador: "", status: "pendente", observacao: "", responsavel: "",
};

export default function NovaObraDialog({ open, onOpenChange, companyId, initial, onSaved }: Props) {
  const [form, setForm] = useState<any>(empty);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial ? {
        obra: initial.obra ?? "",
        tipo_obra: initial.tipo_obra ?? "civil",
        cidade: initial.cidade ?? "",
        uf: initial.uf ?? "BA",
        escopo: initial.escopo ?? "",
        cliente: initial.cliente ?? "",
        coordenador: initial.coordenador ?? "",
        status: initial.status ?? "pendente",
        observacao: initial.observacao ?? "",
        responsavel: initial.responsavel ?? "",
      } : empty);
    }
  }, [open, initial]);

  const upd = (patch: any) => setForm((f: any) => ({ ...f, ...patch }));

  const submit = async () => {
    const required: Array<[string, string]> = [
      ["obra", "Obra"], ["cidade", "Cidade"], ["uf", "UF"], ["tipo_obra", "Tipo de obra"],
      ["escopo", "Escopo"], ["cliente", "Cliente"], ["coordenador", "Coordenador"],
      ["status", "Status"], ["observacao", "Observação"],
    ];
    for (const [k, label] of required) {
      if (!String(form[k] ?? "").trim()) { toast.error(`${label} é obrigatório`); return; }
    }
    setBusy(true);
    try {
      const payload = {
        ...form,
        responsavel: form.responsavel?.trim() ? form.responsavel.trim() : null,
        company_id: companyId,
      };
      const saved = initial
        ? await updateObra(initial.id, payload)
        : await createObra(payload);
      toast.success(initial ? "Obra atualizada" : "Obra criada");
      onSaved?.(saved);
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Falha ao salvar: " + (e?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar obra" : "Nova obra"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Obra *</Label>
            <Input value={form.obra} onChange={(e) => upd({ obra: e.target.value })} placeholder="Ex.: TCALVCS0001" />
          </div>
          <div>
            <Label>Cidade *</Label>
            <Input value={form.cidade} onChange={(e) => upd({ cidade: e.target.value })} />
          </div>
          <div>
            <Label>UF *</Label>
            <Select value={form.uf} onValueChange={(v) => upd({ uf: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{UFS_BR.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo de obra *</Label>
            <Select value={form.tipo_obra} onValueChange={(v) => upd({ tipo_obra: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TIPOS_OBRA.map((t) => <SelectItem key={t} value={t}>{TIPOS_OBRA_LABEL[t]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status *</Label>
            <Select value={form.status} onValueChange={(v) => upd({ status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS_OBRA.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Escopo *</Label>
            <Input value={form.escopo} onChange={(e) => upd({ escopo: e.target.value })} placeholder="Ex.: Reforço, Shelter, Manutenção corretiva..." />
          </div>
          <div>
            <Label>Cliente *</Label>
            <Input value={form.cliente} onChange={(e) => upd({ cliente: e.target.value })} placeholder="Ex.: Neoenergia, TBSA..." />
          </div>
          <div>
            <Label>Coordenador *</Label>
            <Input value={form.coordenador} onChange={(e) => upd({ coordenador: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label>Observação *</Label>
            <Textarea rows={2} value={form.observacao} onChange={(e) => upd({ observacao: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label>Responsável <span className="text-xs text-muted-foreground">(opcional)</span></Label>
            <Input value={form.responsavel} onChange={(e) => upd({ responsavel: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
