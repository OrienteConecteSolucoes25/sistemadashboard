import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, MapPin, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { EngPageHeader } from "./components/EngPageHeader";
import { DataActionsToolbar } from "@/components/DataActionsToolbar";
import { DeleteWithPasswordModal } from "@/components/DeleteWithPasswordModal";
import { ObraDetailSheet, type ObraRow } from "./components/ObraDetailSheet";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import type { FieldSchema } from "./crud/types";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const fmtMoney = (n: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n || 0));

const FIELDS: FieldSchema[] = [
  { key: "nome", label: "Nome", type: "text", required: true },
  { key: "endereco", label: "Endereço", type: "text" },
  { key: "cidade", label: "Cidade", type: "text", required: true },
  { key: "uf", label: "UF", type: "select", required: true, options: UFS },
  { key: "cep", label: "CEP", type: "text" },
  { key: "maps_url", label: "Maps URL", type: "text" },
  { key: "latitude", label: "Latitude", type: "number" },
  { key: "longitude", label: "Longitude", type: "number" },
  { key: "trigger_date", label: "Acionamento", type: "date" },
  { key: "delivery_date", label: "Entrega", type: "date" },
  { key: "total_value", label: "Valor", type: "number" },
];

export const ObrasPage = () => {
  const [items, setItems] = useState<ObraRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<ObraRow> | null>(null);
  const [selected, setSelected] = useState<ObraRow | null>(null);
  const [delOpen, setDelOpen] = useState<ObraRow | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("eng_sites")
      .select("id,nome,cidade,uf,endereco,cep,maps_url,trigger_date,delivery_date,total_value,latitude,longitude")
      .eq("is_deleted", false)
      .order("nome");
    if (error) toast.error(error.message);
    setItems((data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((s) =>
      `${s.nome} ${s.cidade ?? ""} ${s.uf ?? ""} ${s.cep ?? ""} ${s.endereco ?? ""}`.toLowerCase().includes(q));
  }, [items, search]);

  const startNew = () => { setEditing({}); setOpen(true); };
  const startEdit = (o: ObraRow) => { setEditing(o); setOpen(true); };

  const save = async () => {
    if (!editing?.nome?.trim()) return toast.error("Nome é obrigatório");
    if (!editing?.cidade?.trim()) return toast.error("Cidade é obrigatória");
    if (!editing?.uf) return toast.error("UF é obrigatória");

    // duplicidade case-insensitive
    const nameLower = editing.nome.trim().toLowerCase();
    const dup = items.find((i) => i.nome.toLowerCase() === nameLower && i.id !== editing.id);
    if (dup) return toast.error("Já existe uma obra com esse nome");

    const payload: any = {
      nome: editing.nome.trim(),
      endereco: editing.endereco ?? null,
      cidade: editing.cidade ?? null,
      uf: editing.uf ?? null,
      cep: editing.cep ?? null,
      maps_url: editing.maps_url ?? null,
      latitude: editing.latitude == null || editing.latitude === ("" as any) ? null : Number(editing.latitude),
      longitude: editing.longitude == null || editing.longitude === ("" as any) ? null : Number(editing.longitude),
      trigger_date: editing.trigger_date || null,
      delivery_date: editing.delivery_date || null,
      total_value: Number(editing.total_value || 0),
    };
    const { error } = editing.id
      ? await supabase.from("eng_sites").update(payload).eq("id", editing.id)
      : await supabase.from("eng_sites").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Obra salva");
    setOpen(false); setEditing(null);
    load();
  };

  return (
    <div className="space-y-4">
      <EngPageHeader title="Obras" description="Cadastro e visão integrada por obra" />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar nome, cidade, UF, CEP, endereço…" className="pl-9"
                 value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <DataActionsToolbar table="eng_sites" title="Obras" fields={FIELDS} rows={items} onImported={load} />
        <Button onClick={startNew}><Plus className="w-4 h-4 mr-1" /> Nova obra</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Acionamento</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Carregando…</TableCell></TableRow>}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Nenhuma obra.</TableCell></TableRow>
              )}
              {filtered.map((o) => (
                <TableRow key={o.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelected(o)}>
                  <TableCell className="font-medium">{o.nome}</TableCell>
                  <TableCell>{[o.cidade, o.uf].filter(Boolean).join(" / ")}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {o.endereco}
                    {o.maps_url && (
                      <a href={o.maps_url} target="_blank" rel="noreferrer"
                         onClick={(e) => e.stopPropagation()}
                         className="inline-flex items-center gap-1 ml-2 text-primary">
                        <MapPin className="w-3 h-3" /><ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </TableCell>
                  <TableCell>{o.trigger_date ?? "—"}</TableCell>
                  <TableCell>{o.delivery_date ?? "—"}</TableCell>
                  <TableCell className="text-right">{fmtMoney(o.total_value)}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" onClick={() => startEdit(o)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setDelOpen(o)}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal nova/editar obra */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar obra" : "Nova obra"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nome *</Label>
              <Input value={editing?.nome ?? ""} onChange={(e) => setEditing((s) => ({ ...s, nome: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label>Endereço</Label>
              <Input value={editing?.endereco ?? ""} onChange={(e) => setEditing((s) => ({ ...s, endereco: e.target.value }))} />
            </div>
            <div>
              <Label>Cidade *</Label>
              <Input value={editing?.cidade ?? ""} onChange={(e) => setEditing((s) => ({ ...s, cidade: e.target.value }))} />
            </div>
            <div>
              <Label>UF *</Label>
              <Select value={editing?.uf ?? ""} onValueChange={(v) => setEditing((s) => ({ ...s, uf: v }))}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>{UFS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>CEP</Label>
              <Input value={editing?.cep ?? ""} onChange={(e) => setEditing((s) => ({ ...s, cep: e.target.value }))} />
            </div>
            <div>
              <Label>Google Maps URL</Label>
              <Input value={editing?.maps_url ?? ""} onChange={(e) => setEditing((s) => ({ ...s, maps_url: e.target.value }))} />
            </div>
            <div>
              <Label>Latitude</Label>
              <Input type="number" step="any" value={editing?.latitude ?? ""} onChange={(e) => setEditing((s) => ({ ...s, latitude: e.target.value as any }))} />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input type="number" step="any" value={editing?.longitude ?? ""} onChange={(e) => setEditing((s) => ({ ...s, longitude: e.target.value as any }))} />
            </div>
            <div>
              <Label>Acionamento</Label>
              <Input type="date" value={editing?.trigger_date ?? ""} onChange={(e) => setEditing((s) => ({ ...s, trigger_date: e.target.value }))} />
            </div>
            <div>
              <Label>Entrega prevista</Label>
              <Input type="date" value={editing?.delivery_date ?? ""} onChange={(e) => setEditing((s) => ({ ...s, delivery_date: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label>Valor total</Label>
              <Input type="number" step="0.01" value={editing?.total_value ?? ""} onChange={(e) => setEditing((s) => ({ ...s, total_value: Number(e.target.value) }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detalhe lateral */}
      <ObraDetailSheet
        obra={selected}
        onClose={() => setSelected(null)}
        onEdit={(o) => { setSelected(null); startEdit(o); }}
        onChanged={load}
      />

      {/* Exclusão segura */}
      <DeleteWithPasswordModal
        open={!!delOpen}
        onOpenChange={(o) => !o && setDelOpen(null)}
        table="eng_sites"
        recordId={delOpen?.id ?? null}
        recordLabel={delOpen?.nome}
        moduleLabel="Obras"
        onDeleted={() => { setDelOpen(null); load(); }}
      />
    </div>
  );
};

export default ObrasPage;
