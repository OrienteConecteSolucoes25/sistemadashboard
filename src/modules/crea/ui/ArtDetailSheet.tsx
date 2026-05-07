import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileSignature, Save, Calendar, Paperclip, Info } from "lucide-react";
import CreaAttachmentsField from "./CreaAttachmentsField";

const sb: any = supabase;
const STATUS_ART = ["nao_iniciada","em_emissao","emitida","paga","registrada","baixada","cancelada"];

interface Props {
  artId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved?: () => void;
}

export default function ArtDetailSheet({ artId, open, onOpenChange, onSaved }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !artId) return;
    setLoading(true);
    sb.from("crea_arts").select("*").eq("id", artId).maybeSingle().then(({ data, error }: any) => {
      if (error) toast.error(error.message); else setData(data);
      setLoading(false);
    });
  }, [open, artId]);

  const upd = (patch: any) => setData((d: any) => ({ ...d, ...patch }));

  const save = async () => {
    if (!data?.id) return;
    setBusy(true);
    const { id, created_at, updated_at, is_deleted, ...payload } = data;
    const { error } = await sb.from("crea_arts").update(payload).eq("id", id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("ART atualizada");
    onSaved?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-primary" />
            ART {data?.numero ?? ""}
            {data?.status && <Badge variant="outline">{data.status}</Badge>}
          </SheetTitle>
          <SheetDescription>Detalhes, datas e anexos.</SheetDescription>
        </SheetHeader>
        {loading && <p className="text-sm text-muted-foreground py-6">Carregando…</p>}
        {data && (
          <Tabs defaultValue="info" className="mt-4">
            <TabsList>
              <TabsTrigger value="info"><Info className="w-3.5 h-3.5 mr-1" />Dados</TabsTrigger>
              <TabsTrigger value="datas"><Calendar className="w-3.5 h-3.5 mr-1" />Datas</TabsTrigger>
              <TabsTrigger value="anexos"><Paperclip className="w-3.5 h-3.5 mr-1" />Anexos</TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="grid gap-3 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Número</Label><Input value={data.numero ?? ""} onChange={(e) => upd({ numero: e.target.value })} /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={data.status ?? "nao_iniciada"} onValueChange={(v) => upd({ status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS_ART.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>UF</Label><Input value={data.uf ?? ""} onChange={(e) => upd({ uf: e.target.value })} /></div>
                <div><Label>Valor (R$)</Label><Input type="number" value={data.valor ?? ""} onChange={(e) => upd({ valor: e.target.value === "" ? null : Number(e.target.value) })} /></div>
                <div className="col-span-2"><Label>Contratante</Label><Input value={data.contratante ?? ""} onChange={(e) => upd({ contratante: e.target.value })} /></div>
                <div className="col-span-2"><Label>Contratado</Label><Input value={data.contratado ?? ""} onChange={(e) => upd({ contratado: e.target.value })} /></div>
                <div className="col-span-2"><Label>Escopo</Label><Textarea rows={3} value={data.escopo ?? ""} onChange={(e) => upd({ escopo: e.target.value })} /></div>
                <div className="col-span-2"><Label>Observações</Label><Textarea rows={2} value={data.observacoes ?? ""} onChange={(e) => upd({ observacoes: e.target.value })} /></div>
              </div>
            </TabsContent>
            <TabsContent value="datas" className="grid grid-cols-2 gap-3 pt-3">
              {[
                ["data_rascunho","Rascunho"],["data_envio_validacao","Envio p/ Validação"],
                ["data_validada","Validada"],["data_emissao","Emissão"],
                ["data_pagamento","Pagamento"],["data_baixa","Baixa"],
              ].map(([k, l]) => (
                <div key={k}><Label>{l}</Label><Input type="date" value={data[k] ?? ""} onChange={(e) => upd({ [k]: e.target.value || null })} /></div>
              ))}
            </TabsContent>
            <TabsContent value="anexos" className="pt-3">
              <CreaAttachmentsField table="crea_arts" recordId={data.id} value={data.anexo_url} onChange={(paths) => upd({ anexo_url: paths.join(",") })} />
            </TabsContent>
          </Tabs>
        )}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={save} disabled={busy || !data}><Save className="w-4 h-4 mr-1" />{busy ? "Salvando…" : "Salvar"}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
