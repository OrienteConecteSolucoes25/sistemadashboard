import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { useMateriais } from "../hooks/useMateriais";

interface Item {
  material_id?: string;
  descricao: string;
  categoria: string;
  conta_financeira?: string;
  quantidade: string;
  unidade: string;
}

export function SolicitanteTab({ rows: _rows, onCreated }: { rows: any[]; onCreated: () => void }) {
  const { items: catalogo } = useMateriais();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [obra, setObra] = useState("");
  const [obs, setObs] = useState("");
  const [itens, setItens] = useState<Item[]>([{ descricao: "", categoria: "", quantidade: "1", unidade: "un" }]);
  const [sites, setSites] = useState<any[]>([]);

  useEffect(() => { (async () => {
    const { data } = await supabase.from("eng_sites").select("id,nome,codigo").order("nome");
    setSites(data || []);
  })(); }, []);

  const addItem = () => setItens([...itens, { descricao: "", categoria: "", quantidade: "1", unidade: "un" }]);
  const removeItem = (i: number) => setItens(itens.filter((_, idx) => idx !== i));
  const updItem = (i: number, patch: Partial<Item>) =>
    setItens(itens.map((it, idx) => idx === i ? { ...it, ...patch } : it));

  const escolheMaterial = (i: number, materialId: string) => {
    const mat = catalogo.find(c => c.id === materialId);
    if (!mat) return;
    updItem(i, {
      material_id: mat.id,
      descricao: mat.descricao,
      categoria: mat.categoria,
      conta_financeira: mat.conta_financeira,
      unidade: mat.unidade || "un",
    });
  };

  const enviarSuprimentos = async () => {
    if (!nome) return toast.error("Informe o nome do solicitante");
    const validItens = itens.filter(i => i.descricao.trim());
    if (validItens.length === 0) return toast.error("Adicione ao menos 1 item");
    if (!obra.trim()) return toast.error("Informe a obra/site");

    // Verifica se já existe solicitação aberta para essa obra
    const { data: existentes } = await supabase
      .from("eng_suprimentos")
      .select("id, descricao, itens, data, status")
      .eq("status", "aberta")
      .order("created_at", { ascending: false });

    const jaTem = (existentes || []).find((r: any) => (r?.data?.obra || "").trim().toLowerCase() === obra.trim().toLowerCase());

    if (jaTem) {
      // Acrescenta itens
      const itensAtuais = Array.isArray(jaTem.itens) ? jaTem.itens : [];
      const novos = [...itensAtuais, ...validItens];
      const descricaoAdd = validItens.map(i => `• ${i.quantidade} ${i.unidade} - ${i.descricao}${i.categoria ? ` [${i.categoria}]` : ""}`).join("\n");
      const { error } = await supabase.from("eng_suprimentos").update({
        itens: novos as any,
        descricao: `${jaTem.descricao || ""}\n${descricaoAdd}`,
      } as any).eq("id", jaTem.id);
      if (error) return toast.error(error.message);
      toast.success(`Itens adicionados à solicitação existente da obra ${obra}`);
    } else {
      const numero = `SOL-${Date.now().toString().slice(-6)}`;
      const descricao = validItens.map(i => `• ${i.quantidade} ${i.unidade} - ${i.descricao}${i.categoria ? ` [${i.categoria}]` : ""}`).join("\n");
      const { error } = await supabase.from("eng_suprimentos").insert({
        numero, descricao: `[${obra}]\n${descricao}${obs ? `\n\nObs: ${obs}` : ""}`,
        solicitante: nome, status: "aberta", itens: validItens as any,
        data: { email_solicitante: email, obra } as any,
      });
      if (error) return toast.error(error.message);
      toast.success("Solicitação enviada para Suprimentos");
    }

    setItens([{ descricao: "", categoria: "", quantidade: "1", unidade: "un" }]);
    setObs("");
    onCreated();
  };

  const enviarOutlook = () => {
    const validItens = itens.filter(i => i.descricao.trim());
    const corpo = [
      `Solicitante: ${nome}`,
      email && `Email: ${email}`,
      obra && `Obra: ${obra}`,
      "",
      "Itens:",
      ...validItens.map(i => `- ${i.quantidade} ${i.unidade} - ${i.descricao}${i.categoria ? ` [${i.categoria}]` : ""}`),
      obs && `\nObservações: ${obs}`,
    ].filter(Boolean).join("\n");
    const subject = encodeURIComponent(`Requisição de materiais${obra ? ` - ${obra}` : ""}`);
    const body = encodeURIComponent(corpo);
    window.location.href = `mailto:suprimentos@empresa.com?subject=${subject}&body=${body}`;
  };

  // Agrupa itens por categoria (visual: mesma categoria = mesma SC/RC)
  const grupos = useMemo(() => {
    const m = new Map<string, Item[]>();
    itens.forEach(it => {
      const cat = it.categoria || "Sem categoria";
      if (!m.has(cat)) m.set(cat, []);
      m.get(cat)!.push(it);
    });
    return Array.from(m.entries());
  }, [itens]);

  return (
    <div className="space-y-3">
      <Card className="card-elegant">
        <CardContent className="pt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div><Label className="text-xs">Nome do solicitante *</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" /></div>
            <div><Label className="text-xs">Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><Label className="text-xs">Obra / Site *</Label>
              <Input list="sites-list" value={obra} onChange={e => setObra(e.target.value)} placeholder="Digite ou selecione…" />
              <datalist id="sites-list">
                {sites.map(s => <option key={s.id} value={s.nome || s.codigo} />)}
              </datalist>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Materiais a solicitar *</Label>
              <Button size="sm" variant="outline" onClick={addItem}><Plus className="h-3.5 w-3.5 mr-1" />Item</Button>
            </div>
            <div className="space-y-2">
              {itens.map((it, i) => (
                <div key={i} className="grid gap-2 md:grid-cols-12 items-end">
                  <div className="md:col-span-5">
                    <Label className="text-[10px] text-muted-foreground">Material (catálogo)</Label>
                    <Input
                      list={`mat-list-${i}`}
                      placeholder="Digite ou escolha do catálogo…"
                      value={it.descricao}
                      onChange={e => {
                        const v = e.target.value;
                        const mat = catalogo.find(c => c.descricao === v || c.codigo === v);
                        if (mat) escolheMaterial(i, mat.id);
                        else updItem(i, { descricao: v });
                      }}
                    />
                    <datalist id={`mat-list-${i}`}>
                      {catalogo.slice(0, 500).map(m => (
                        <option key={m.id} value={m.descricao}>{m.codigo ? `${m.codigo} — ` : ""}{m.categoria}</option>
                      ))}
                    </datalist>
                  </div>
                  <div className="md:col-span-3">
                    <Label className="text-[10px] text-muted-foreground">Categoria</Label>
                    <Input value={it.categoria} onChange={e => updItem(i, { categoria: e.target.value })} placeholder="Categoria" />
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-[10px] text-muted-foreground">Qtd</Label>
                    <Input value={it.quantidade} onChange={e => updItem(i, { quantidade: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-[10px] text-muted-foreground">Unid.</Label>
                    <Input value={it.unidade} onChange={e => updItem(i, { unidade: e.target.value })} />
                  </div>
                  <div className="md:col-span-1">
                    <Button variant="ghost" size="icon" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
            {grupos.length > 1 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-[10px] text-muted-foreground">Agrupamento por categoria (1 SC/RC por grupo):</span>
                {grupos.map(([cat, lst]) => (
                  <Badge key={cat} variant="outline" className="text-[10px]">{cat}: {lst.length}</Badge>
                ))}
              </div>
            )}
          </div>

          <div><Label className="text-xs">Observações</Label>
            <Textarea rows={2} value={obs} onChange={e => setObs(e.target.value)} /></div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={enviarOutlook}><Mail className="h-4 w-4 mr-1" />Enviar por Outlook</Button>
            <Button onClick={enviarSuprimentos}><Send className="h-4 w-4 mr-1" />Enviar para Suprimentos</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
