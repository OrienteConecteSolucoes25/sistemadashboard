import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CalendarDays, Save, Trash2, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { ArtObra, STATUS_LABEL, TIPOS_OBRA_LABEL } from "./lib/artObrasTypes";
import { updateObra, softDeleteObra } from "./lib/artObrasApi";
import NovaObraDialog from "./NovaObraDialog";

type Props = {
  obra: ArtObra | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onChanged?: () => void;
};

const DATE_FIELDS: Array<{ key: keyof ArtObra; label: string }> = [
  { key: "data_criacao_art", label: "Data de criação da ART" },
  { key: "data_validacao", label: "Data de validação" },
  { key: "data_envio_pagamento", label: "Data de envio para pagamento" },
  { key: "data_pasta", label: "Data de colocada na pasta" },
];

export default function ObraArtSheet({ obra, open, onOpenChange, onChanged }: Props) {
  const [datas, setDatas] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [delReason, setDelReason] = useState("");
  const [delBusy, setDelBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (obra) {
      setDatas({
        data_criacao_art: obra.data_criacao_art,
        data_validacao: obra.data_validacao,
        data_envio_pagamento: obra.data_envio_pagamento,
        data_pasta: obra.data_pasta,
      });
    }
  }, [obra]);

  if (!obra) return null;

  const setDate = (k: string, v: string) => setDatas((d) => ({ ...d, [k]: v || null }));

  const saveDates = async () => {
    setSaving(true);
    try {
      await updateObra(obra.id, datas);
      toast.success("Datas salvas");
      onChanged?.();
    } catch (e: any) { toast.error("Falha: " + (e?.message ?? e)); }
    finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (delReason.trim().length < 3) { toast.error("Informe o motivo (mín. 3 caracteres)"); return; }
    setDelBusy(true);
    const r = await softDeleteObra(obra.id, delReason.trim());
    setDelBusy(false);
    if (!r.ok) { toast.error(`Falha: ${r.error ?? "erro"}`); return; }
    toast.success("Obra excluída");
    setDelOpen(false); setDelReason("");
    onChanged?.();
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="w-4 h-4 text-primary" />
              {obra.obra}
              <Badge variant="outline" className="text-xs">{TIPOS_OBRA_LABEL[obra.tipo_obra] ?? obra.tipo_obra}</Badge>
            </SheetTitle>
            <SheetDescription className="text-xs">
              {obra.cidade}/{obra.uf} · {obra.cliente} · Coord.: {obra.coordenador}
              {obra.responsavel ? ` · Resp.: ${obra.responsavel}` : ""}
              {" · "}<Badge variant="outline" className="text-[10px]">{STATUS_LABEL[obra.status] ?? obra.status}</Badge>
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold">Datas do ciclo</h3>
            <p className="text-xs text-muted-foreground">Edite ou limpe as datas conforme o andamento da ART.</p>
            <div className="grid grid-cols-1 gap-3">
              {DATE_FIELDS.map((f) => (
                <div key={f.key as string} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">{f.label}</Label>
                    <Input
                      type="date"
                      value={(datas[f.key as string] as string | null) ?? ""}
                      onChange={(e) => setDate(f.key as string, e.target.value)}
                    />
                  </div>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => setDate(f.key as string, "")}
                    disabled={!datas[f.key as string]}
                  >
                    Limpar
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> Editar dados
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="destructive" size="sm" onClick={() => setDelOpen(true)}>
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
              </Button>
              <Button size="sm" onClick={saveDates} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Salvar datas
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <NovaObraDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        companyId={obra.company_id}
        initial={obra}
        onSaved={() => { onChanged?.(); }}
      />

      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir obra "{obra.obra}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Exclusão lógica registrada na auditoria do CREA. Informe o motivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea value={delReason} onChange={(e) => setDelReason(e.target.value)} rows={3}
            placeholder="Ex.: registro duplicado / criada por engano" />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={delBusy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); doDelete(); }}
              disabled={delBusy}
            >{delBusy ? "Excluindo…" : "Confirmar"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
