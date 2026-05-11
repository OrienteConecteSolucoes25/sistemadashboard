import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  RtPessoa, STATUS_RT, STATUS_RT_LABEL, MODELOS_CONTRATO, MODELO_LABEL,
  ANUIDADE, ANUIDADE_LABEL, maskCpf, UFS_BR,
} from "./lib/rtsTypes";
import { createRt, updateRt } from "./lib/rtsApi";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  companyId: string;
  initial?: RtPessoa | null;
  onSaved?: (r: RtPessoa) => void;
};

const empty = {
  nome: "", cpf: "", uf: "", status: "ativo",
  data_inicio: "", data_termino: "", termino_indefinido: false,
  modelo_contrato: "clt", visto: "", rnp: "", registro: "",
  observacao: "", anuidade: "nao_paga", anuidade_ano: "" as string | number,
  inclusao_ativa: true,
};

export default function NovoRtDialog({ open, onOpenChange, companyId, initial, onSaved }: Props) {
  const [form, setForm] = useState<any>(empty);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial ? {
        nome: initial.nome ?? "",
        cpf: initial.cpf ?? "",
        uf: initial.uf ?? "",
        status: initial.status ?? "ativo",
        data_inicio: initial.data_inicio ?? "",
        data_termino: initial.data_termino ?? "",
        termino_indefinido: !!initial.termino_indefinido,
        modelo_contrato: initial.modelo_contrato ?? "clt",
        visto: initial.visto ?? "",
        rnp: initial.rnp ?? "",
        registro: initial.registro ?? "",
        observacao: initial.observacao ?? "",
        anuidade: initial.anuidade ?? "nao_paga",
        anuidade_ano: initial.anuidade_ano ?? "",
        inclusao_ativa: initial.inclusao_ativa !== false,
      } : empty);
    }
  }, [open, initial]);

  const upd = (patch: any) => setForm((f: any) => ({ ...f, ...patch }));

  const submit = async () => {
    if (!String(form.nome ?? "").trim()) { toast.error("Nome é obrigatório"); return; }
    setBusy(true);
    try {
      const payload: any = {
        nome: form.nome.trim(),
        cpf: form.cpf ?? "",
        status: form.status ?? "ativo",
        data_inicio: form.data_inicio || null,
        data_termino: form.termino_indefinido ? null : (form.data_termino || null),
        termino_indefinido: !!form.termino_indefinido,
        modelo_contrato: form.modelo_contrato ?? "clt",
        visto: form.visto ?? "",
        rnp: form.rnp ?? "",
        registro: form.registro ?? "",
        observacao: form.observacao ?? "",
        anuidade: form.anuidade ?? "nao_paga",
        company_id: companyId,
      };
      const saved = initial ? await updateRt(initial.id, payload) : await createRt(payload);
      toast.success(initial ? "RT atualizado" : "RT criado");
      onSaved?.(saved);
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Falha ao salvar: " + (e?.message ?? e));
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar Responsável Técnico" : "Novo Responsável Técnico"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={(e) => upd({ nome: e.target.value })} />
          </div>
          <div>
            <Label>CPF</Label>
            <Input value={form.cpf} onChange={(e) => upd({ cpf: maskCpf(e.target.value) })} placeholder="000.000.000-00" />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => upd({ status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS_RT.map((s) => <SelectItem key={s} value={s}>{STATUS_RT_LABEL[s]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Data de início</Label>
            <Input type="date" value={form.data_inicio ?? ""} onChange={(e) => upd({ data_inicio: e.target.value })} />
          </div>
          <div>
            <Label>Data de término</Label>
            <Input type="date" value={form.data_termino ?? ""} disabled={form.termino_indefinido}
              onChange={(e) => upd({ data_termino: e.target.value })} />
            <div className="flex items-center gap-2 mt-1.5">
              <Switch checked={!!form.termino_indefinido}
                onCheckedChange={(v) => upd({ termino_indefinido: v, ...(v ? { data_termino: "" } : {}) })} />
              <span className="text-xs text-muted-foreground">Indefinido</span>
            </div>
          </div>
          <div>
            <Label>Modelo de contrato</Label>
            <Select value={form.modelo_contrato} onValueChange={(v) => upd({ modelo_contrato: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MODELOS_CONTRATO.map((m) => <SelectItem key={m} value={m}>{MODELO_LABEL[m]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Anuidade</Label>
            <Select value={form.anuidade} onValueChange={(v) => upd({ anuidade: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ANUIDADE.map((a) => <SelectItem key={a} value={a}>{ANUIDADE_LABEL[a]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Visto</Label>
            <Input value={form.visto} onChange={(e) => upd({ visto: e.target.value })} />
          </div>
          <div>
            <Label>RNP</Label>
            <Input value={form.rnp} onChange={(e) => upd({ rnp: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label>Registro</Label>
            <Input value={form.registro} onChange={(e) => upd({ registro: e.target.value })} placeholder="Ex.: BA-12345/D" />
          </div>
          <div className="col-span-2">
            <Label>Observação</Label>
            <Textarea rows={3} value={form.observacao} onChange={(e) => upd({ observacao: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
