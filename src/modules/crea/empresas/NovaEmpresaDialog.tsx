import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Empresa, UFS_BR, maskCnpj, maskCep } from "./lib/empresasTypes";
import { createEmpresa, updateEmpresa } from "./lib/empresasApi";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  companyId: string;
  initial?: Empresa | null;
  onSaved?: (row: Empresa) => void;
};

const empty = {
  nome_fantasia: "", razao_social: "", endereco_completo: "",
  cidade: "", uf: "BA", cep: "", cnpj: "",
};

export default function NovaEmpresaDialog({ open, onOpenChange, companyId, initial, onSaved }: Props) {
  const [form, setForm] = useState<any>(empty);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial ? {
        nome_fantasia: initial.nome_fantasia ?? "",
        razao_social: initial.razao_social ?? "",
        endereco_completo: initial.endereco_completo ?? "",
        cidade: initial.cidade ?? "",
        uf: initial.uf ?? "BA",
        cep: maskCep(initial.cep) || (initial.cep ?? ""),
        cnpj: maskCnpj(initial.cnpj) || (initial.cnpj ?? ""),
      } : empty);
    }
  }, [open, initial]);

  const upd = (patch: any) => setForm((f: any) => ({ ...f, ...patch }));

  const submit = async () => {
    if (!String(form.nome_fantasia ?? "").trim()) {
      toast.error("Nome fantasia é obrigatório"); return;
    }
    setBusy(true);
    try {
      const payload = {
        nome_fantasia: form.nome_fantasia.trim(),
        razao_social: form.razao_social?.trim() || null,
        endereco_completo: form.endereco_completo?.trim() || null,
        cidade: form.cidade?.trim() || null,
        uf: form.uf?.trim()?.toUpperCase()?.slice(0, 2) || null,
        cep: String(form.cep ?? "").replace(/\D/g, "") || null,
        cnpj: String(form.cnpj ?? "").replace(/\D/g, "") || null,
        company_id: companyId,
      };
      const saved = initial
        ? await updateEmpresa(initial.id, payload)
        : await createEmpresa(payload);
      toast.success(initial ? "Empresa atualizada" : "Empresa criada");
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
          <DialogTitle>{initial ? "Editar empresa" : "Nova empresa"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Nome fantasia *</Label>
            <Input value={form.nome_fantasia} onChange={(e) => upd({ nome_fantasia: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label>Nome / Razão Social</Label>
            <Input value={form.razao_social} onChange={(e) => upd({ razao_social: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label>Endereço completo</Label>
            <Input value={form.endereco_completo} onChange={(e) => upd({ endereco_completo: e.target.value })} />
          </div>
          <div>
            <Label>Cidade</Label>
            <Input value={form.cidade} onChange={(e) => upd({ cidade: e.target.value })} />
          </div>
          <div>
            <Label>UF</Label>
            <Select value={form.uf || ""} onValueChange={(v) => upd({ uf: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{UFS_BR.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>CEP</Label>
            <Input value={form.cep} onChange={(e) => upd({ cep: maskCep(e.target.value) })} placeholder="00000-000" />
          </div>
          <div>
            <Label>CNPJ</Label>
            <Input value={form.cnpj} onChange={(e) => upd({ cnpj: maskCnpj(e.target.value) })} placeholder="00.000.000/0000-00" />
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
