import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Save, Plus, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import {
  loadWaTemplates, saveWaTemplate, deleteWaTemplate,
  DEFAULT_WA_TEMPLATES, sendWhatsapp, renderTemplate,
  type WaTemplate,
} from "../../lib/automations/whatsapp";

export function WhatsappTemplatesManager() {
  const [items, setItems] = useState<WaTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const list = await loadWaTemplates();
      setItems(list.length ? list : DEFAULT_WA_TEMPLATES);
    } catch (e: any) {
      toast.error("Erro carregando templates: " + (e?.message ?? e));
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function update(idx: number, patch: Partial<WaTemplate>) {
    setItems((prev) => prev.map((t, i) => i === idx ? { ...t, ...patch } : t));
  }

  async function save(t: WaTemplate) {
    try { await saveWaTemplate(t); toast.success("Template salvo."); load(); }
    catch (e: any) { toast.error("Falha: " + (e?.message ?? e)); }
  }

  async function remove(t: WaTemplate) {
    if (!t.id) { setItems((p) => p.filter((x) => x.key !== t.key)); return; }
    try { await deleteWaTemplate(t.id); toast.success("Removido."); load(); }
    catch (e: any) { toast.error("Falha: " + (e?.message ?? e)); }
  }

  function addNew() {
    setItems((p) => [...p, { key: `tpl_${Date.now()}`, label: "Novo template", phone: "", message: "Olá {NOME}", modulo: null }]);
  }

  async function preview(t: WaTemplate) {
    const msg = renderTemplate(t.message, { NOME: "Fulano", SITE: "ABC123", PROTOCOLO: "P-001", NUMERO: "SC-100", FORNECEDOR: "ACME" });
    await sendWhatsapp({ phone: t.phone ?? "", message: msg, origem: "wa_template", modulo: t.modulo ?? null });
  }

  if (loading) return <div className="text-sm text-muted-foreground">Carregando…</div>;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold">Templates WhatsApp</h3>
        <Button size="sm" onClick={addNew}><Plus className="h-4 w-4 mr-1" /> Novo</Button>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {items.map((t, idx) => (
          <Card key={t.id ?? t.key + idx}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageCircle className="h-4 w-4" /> {t.label || t.key}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <Label className="text-xs">Key</Label>
                  <Input value={t.key} onChange={(e) => update(idx, { key: e.target.value })} />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Label</Label>
                  <Input value={t.label} onChange={(e) => update(idx, { label: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Telefone padrão</Label>
                <Input value={t.phone ?? ""} onChange={(e) => update(idx, { phone: e.target.value })} placeholder="5511..." />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Mensagem (vars: {"{NOME} {SITE} {PROTOCOLO} {NUMERO}"})</Label>
                <Textarea rows={4} value={t.message} onChange={(e) => update(idx, { message: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => save(t)}><Save className="h-4 w-4 mr-1" /> Salvar</Button>
                <Button size="sm" variant="outline" onClick={() => preview(t)}>Testar</Button>
                <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={() => remove(t)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
