import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useGovCompany } from "../lib/useGovCompany";
import { classifyArtsBulk } from "../lib/govClassifier";

type Rule = {
  id: string; palavra: string; is_regex: boolean;
  setor_id: string | null; tag_id: string | null; escopo_id: string | null;
  peso: number; ativa: boolean;
};

export function ClassificacaoTab() {
  const { companyId } = useGovCompany();
  const [rules, setRules] = useState<Rule[]>([]);
  const [setores, setSetores] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [escopos, setEscopos] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [form, setForm] = useState<any>({ palavra: "", is_regex: false, peso: 1, ativa: true });
  const [running, setRunning] = useState(false);

  async function load() {
    if (!companyId) return;
    const sb: any = supabase;
    const [r, s, t, e] = await Promise.all([
      sb.from("crea_gov_classificacao_regras").select("*").eq("company_id", companyId).order("palavra"),
      sb.from("crea_gov_setores").select("id,nome").eq("company_id", companyId).eq("is_deleted", false),
      sb.from("crea_gov_tags").select("id,nome").eq("company_id", companyId).eq("is_deleted", false),
      sb.from("crea_gov_escopos").select("id,nome").eq("company_id", companyId).eq("is_deleted", false),
    ]);
    setRules(r.data ?? []); setSetores(s.data ?? []); setTags(t.data ?? []); setEscopos(e.data ?? []);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [companyId]);

  function openNew() { setEditing(null); setForm({ palavra: "", is_regex: false, peso: 1, ativa: true }); setOpen(true); }
  function openEdit(r: Rule) { setEditing(r); setForm(r); setOpen(true); }

  async function save() {
    if (!companyId) return;
    if (!form.palavra?.trim()) return toast.error("Informe a palavra/regex");
    const payload: any = {
      company_id: companyId,
      palavra: form.palavra,
      is_regex: !!form.is_regex,
      setor_id: form.setor_id || null,
      tag_id: form.tag_id || null,
      escopo_id: form.escopo_id || null,
      peso: Number(form.peso) || 1,
      ativa: !!form.ativa,
    };
    const sb: any = supabase;
    const { error } = editing
      ? await sb.from("crea_gov_classificacao_regras").update(payload).eq("id", editing.id)
      : await sb.from("crea_gov_classificacao_regras").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Regra salva"); setOpen(false); load();
  }

  async function remove(r: Rule) {
    if (!confirm(`Excluir regra "${r.palavra}"?`)) return;
    const { error } = await (supabase as any).from("crea_gov_classificacao_regras").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Removida"); load();
  }

  async function reprocessar() {
    if (!companyId) return;
    setRunning(true);
    try {
      const { data } = await (supabase as any).from("crea_gov_arts")
        .select("id").eq("company_id", companyId).eq("is_deleted", false).limit(2000);
      const ids = (data ?? []).map((x: any) => x.id);
      if (!ids.length) { toast.info("Sem ARTs para classificar"); return; }
      const r = await classifyArtsBulk(companyId, ids);
      toast.success(`Classificadas ${r.processed} ARTs · ${r.tags} marcações de tag`);
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
    finally { setRunning(false); }
  }

  const findName = (arr: any[], id: string | null) => id ? (arr.find(x => x.id === id)?.nome ?? "—") : "—";

  return (
    <Card className="card-elegant">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-lg">Regras de Classificação</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Palavras-chave / regex que mapeiam ARTs para setores, tags e escopos automaticamente.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reprocessar} disabled={running} className="gap-2">
            <Sparkles className="h-4 w-4" />{running ? "Processando…" : "Reprocessar ARTs"}
          </Button>
          <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" />Nova regra</Button>
        </div>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma regra cadastrada.</p> :
         <Table>
           <TableHeader><TableRow>
             <TableHead>Palavra/Regex</TableHead><TableHead>Tipo</TableHead>
             <TableHead>Setor</TableHead><TableHead>Tag</TableHead><TableHead>Escopo</TableHead>
             <TableHead>Peso</TableHead><TableHead>Ativa</TableHead>
             <TableHead className="text-right">Ações</TableHead>
           </TableRow></TableHeader>
           <TableBody>
             {rules.map(r => (
               <TableRow key={r.id}>
                 <TableCell className="font-mono text-xs">{r.palavra}</TableCell>
                 <TableCell>{r.is_regex ? "regex" : "texto"}</TableCell>
                 <TableCell>{findName(setores, r.setor_id)}</TableCell>
                 <TableCell>{findName(tags, r.tag_id)}</TableCell>
                 <TableCell>{findName(escopos, r.escopo_id)}</TableCell>
                 <TableCell>{r.peso}</TableCell>
                 <TableCell>{r.ativa ? "Sim" : "Não"}</TableCell>
                 <TableCell className="text-right">
                   <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                   <Button size="icon" variant="ghost" onClick={() => remove(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                 </TableCell>
               </TableRow>
             ))}
           </TableBody>
         </Table>}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Nova"} regra</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Palavra ou regex</Label>
              <Input value={form.palavra ?? ""} onChange={(e) => setForm((s: any) => ({ ...s, palavra: e.target.value }))} placeholder="ex.: spda  ou  /torre|antena/i" /></div>
            <div className="flex items-center gap-2">
              <Switch checked={!!form.is_regex} onCheckedChange={(v) => setForm((s: any) => ({ ...s, is_regex: v }))} />
              <Label>É regex</Label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>Setor</Label>
                <Select value={form.setor_id ?? ""} onValueChange={(v) => setForm((s: any) => ({ ...s, setor_id: v || null }))}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{setores.map(x => <SelectItem key={x.id} value={x.id}>{x.nome}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>Tag</Label>
                <Select value={form.tag_id ?? ""} onValueChange={(v) => setForm((s: any) => ({ ...s, tag_id: v || null }))}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{tags.map(x => <SelectItem key={x.id} value={x.id}>{x.nome}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>Escopo</Label>
                <Select value={form.escopo_id ?? ""} onValueChange={(v) => setForm((s: any) => ({ ...s, escopo_id: v || null }))}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{escopos.map(x => <SelectItem key={x.id} value={x.id}>{x.nome}</SelectItem>)}</SelectContent>
                </Select></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Peso</Label>
                <Input type="number" step="0.1" value={form.peso ?? 1} onChange={(e) => setForm((s: any) => ({ ...s, peso: e.target.value }))} /></div>
              <div className="flex items-end gap-2">
                <Switch checked={!!form.ativa} onCheckedChange={(v) => setForm((s: any) => ({ ...s, ativa: v }))} />
                <Label>Ativa</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
