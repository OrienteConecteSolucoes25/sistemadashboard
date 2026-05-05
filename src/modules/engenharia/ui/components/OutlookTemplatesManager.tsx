import { useEffect, useState } from "react";
import { Plus, Save, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  loadOutlookTemplates, saveOutlookTemplate, deleteOutlookTemplate,
  composeOutlook, renderTemplate, DEFAULT_TEMPLATES,
  type OutlookTemplate,
} from "../../lib/automations/outlook";

const empty = (): OutlookTemplate => ({
  key: "", label: "", to: [], cc: [], assunto: "", corpo: "", modulo: null,
});

export function OutlookTemplatesManager() {
  const [items, setItems] = useState<OutlookTemplate[]>([]);
  const [editing, setEditing] = useState<OutlookTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try { setItems(await loadOutlookTemplates()); }
    catch (e: any) { toast.error("Falha ao carregar templates: " + e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, []);

  async function handleSave() {
    if (!editing) return;
    if (!editing.key || !editing.label) { toast.error("Preencha chave e nome."); return; }
    try {
      await saveOutlookTemplate(editing);
      toast.success("Template salvo.");
      setEditing(null);
      await refresh();
    } catch (e: any) { toast.error("Falha ao salvar: " + e.message); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este template?")) return;
    try { await deleteOutlookTemplate(id); await refresh(); toast.success("Excluído."); }
    catch (e: any) { toast.error("Falha: " + e.message); }
  }

  async function seedDefaults() {
    try {
      for (const t of DEFAULT_TEMPLATES) {
        if (!items.some((x) => x.key === t.key)) await saveOutlookTemplate(t);
      }
      toast.success("Templates padrão importados.");
      await refresh();
    } catch (e: any) { toast.error("Falha: " + e.message); }
  }

  async function preview(t: OutlookTemplate) {
    const vars = { NUMERO: "0001", SITE: "ALPHA-01", CATEGORIA: "Material", OBS: "—", ASSUNTO: "Exemplo", DESCRICAO: "Conteúdo de exemplo", PROTOCOLO: "PROT-123", CONCESSIONARIA: "Concess.", DATA: new Date().toLocaleDateString("pt-BR") };
    await composeOutlook({
      to: t.to, cc: t.cc, bcc: t.bcc,
      assunto: renderTemplate(t.assunto, vars),
      corpo: renderTemplate(t.corpo, vars),
      origem: "template_preview", modulo: t.modulo,
    }, "mailto");
  }

  return (
    <Card className="card-elegant">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Templates Outlook</CardTitle>
        <div className="flex gap-2">
          {items.length === 0 && <Button size="sm" variant="outline" onClick={seedDefaults}>Importar padrões</Button>}
          <Button size="sm" onClick={() => setEditing(empty())}><Plus className="h-4 w-4 mr-1" />Novo</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <div className="text-sm text-muted-foreground">Carregando...</div>}
        {!loading && items.length === 0 && !editing && (
          <div className="text-sm text-muted-foreground">Nenhum template cadastrado. Importe os padrões ou crie um novo.</div>
        )}

        {items.map((t) => (
          <div key={t.id} className="rounded-md border p-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium flex items-center gap-2">
                {t.label} <Badge variant="outline" className="text-xs">{t.key}</Badge>
                {t.modulo && <Badge variant="secondary" className="text-xs">{t.modulo}</Badge>}
              </div>
              <div className="text-xs text-muted-foreground truncate">{t.assunto}</div>
              <div className="text-xs text-muted-foreground">Para: {t.to.join(", ") || "—"} {t.cc?.length ? ` • Cc: ${t.cc.join(", ")}` : ""}</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="icon" variant="ghost" onClick={() => preview(t)} title="Pré-visualizar"><Send className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => setEditing(t)} title="Editar"><Save className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => t.id && handleDelete(t.id)} title="Excluir"><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}

        {editing && (
          <div className="rounded-md border-2 border-primary/40 p-3 space-y-2 bg-muted/30">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Chave</Label><Input value={editing.key} onChange={(e) => setEditing({ ...editing, key: e.target.value })} /></div>
              <div><Label>Nome</Label><Input value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Para (vírgula)</Label><Input value={editing.to.join(", ")} onChange={(e) => setEditing({ ...editing, to: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} /></div>
              <div><Label>Cc</Label><Input value={editing.cc.join(", ")} onChange={(e) => setEditing({ ...editing, cc: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} /></div>
            </div>
            <div><Label>Módulo</Label><Input value={editing.modulo ?? ""} onChange={(e) => setEditing({ ...editing, modulo: e.target.value || null })} /></div>
            <div><Label>Assunto (suporta {"{VARS}"})</Label><Input value={editing.assunto} onChange={(e) => setEditing({ ...editing, assunto: e.target.value })} /></div>
            <div><Label>Corpo</Label><Textarea rows={6} value={editing.corpo} onChange={(e) => setEditing({ ...editing, corpo: e.target.value })} /></div>
            <div className="text-xs text-muted-foreground">Variáveis comuns: {"{NUMERO} {SITE} {CATEGORIA} {OBS} {ASSUNTO} {DESCRICAO} {PROTOCOLO} {CONCESSIONARIA} {DATA}"}</div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-1" />Salvar</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
