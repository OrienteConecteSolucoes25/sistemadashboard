import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Mail, Send, Search } from "lucide-react";
import { toast } from "sonner";

interface Item { descricao: string; quantidade: string; unidade: string; }

export function SolicitanteTab({ rows, onCreated }: { rows: any[]; onCreated: () => void }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [obra, setObra] = useState("");
  const [obs, setObs] = useState("");
  const [itens, setItens] = useState<Item[]>([{ descricao: "", quantidade: "1", unidade: "un" }]);
  const [busca, setBusca] = useState("");
  const [sites, setSites] = useState<any[]>([]);

  useEffect(() => { (async () => {
    const { data } = await supabase.from("eng_sites").select("id,nome,codigo").order("nome");
    setSites(data || []);
  })(); }, []);

  const addItem = () => setItens([...itens, { descricao: "", quantidade: "1", unidade: "un" }]);
  const removeItem = (i: number) => setItens(itens.filter((_, idx) => idx !== i));
  const updItem = (i: number, k: keyof Item, v: string) =>
    setItens(itens.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  const enviarSuprimentos = async () => {
    if (!nome) return toast.error("Informe o nome do solicitante");
    const validItens = itens.filter(i => i.descricao.trim());
    if (validItens.length === 0) return toast.error("Adicione ao menos 1 item");
    const numero = `SOL-${Date.now().toString().slice(-6)}`;
    const descricao = validItens.map(i => `• ${i.quantidade} ${i.unidade} - ${i.descricao}`).join("\n");
    const { error } = await supabase.from("eng_suprimentos").insert({
      numero, descricao: `${obra ? `[${obra}] ` : ""}${descricao}${obs ? `\n\nObs: ${obs}` : ""}`,
      solicitante: nome, status: "aberta", itens: validItens as any,
      data: { email_solicitante: email, obra } as any,
    });
    if (error) return toast.error(error.message);
    toast.success("Solicitação enviada para Suprimentos");
    setNome(""); setEmail(""); setObra(""); setObs("");
    setItens([{ descricao: "", quantidade: "1", unidade: "un" }]);
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
      ...validItens.map(i => `- ${i.quantidade} ${i.unidade} - ${i.descricao}`),
      obs && `\nObservações: ${obs}`,
    ].filter(Boolean).join("\n");
    const subject = encodeURIComponent(`Requisição de materiais${obra ? ` - ${obra}` : ""}`);
    const body = encodeURIComponent(corpo);
    window.location.href = `mailto:suprimentos@empresa.com?subject=${subject}&body=${body}`;
  };

  const minhasSolics = useMemo(() => {
    if (!busca.trim()) return rows.slice(0, 20);
    const q = busca.toLowerCase();
    return rows.filter(r => String(r.solicitante || "").toLowerCase().includes(q)).slice(0, 50);
  }, [rows, busca]);

  return (
    <div className="space-y-3">
      <Card className="card-elegant">
        <CardContent className="pt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div><Label className="text-xs">Nome do solicitante *</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" /></div>
            <div><Label className="text-xs">Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><Label className="text-xs">Obra / Site</Label>
              <Input list="sites-list" value={obra} onChange={e => setObra(e.target.value)} placeholder="Digite ou selecione…" />
              <datalist id="sites-list">
                {sites.map(s => <option key={s.id} value={s.nome || s.codigo} />)}
              </datalist>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Itens *</Label>
              <Button size="sm" variant="outline" onClick={addItem}><Plus className="h-3.5 w-3.5 mr-1" />Item</Button>
            </div>
            <div className="space-y-2">
              {itens.map((it, i) => (
                <div key={i} className="grid gap-2 md:grid-cols-12">
                  <Input className="md:col-span-7" placeholder="Descrição do item" value={it.descricao} onChange={e => updItem(i, "descricao", e.target.value)} />
                  <Input className="md:col-span-2" placeholder="Qtd" value={it.quantidade} onChange={e => updItem(i, "quantidade", e.target.value)} />
                  <Input className="md:col-span-2" placeholder="Un." value={it.unidade} onChange={e => updItem(i, "unidade", e.target.value)} />
                  <Button variant="ghost" size="icon" className="md:col-span-1" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>

          <div><Label className="text-xs">Observações</Label>
            <Textarea rows={2} value={obs} onChange={e => setObs(e.target.value)} /></div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={enviarOutlook}><Mail className="h-4 w-4 mr-1" />Enviar por Outlook</Button>
            <Button onClick={enviarSuprimentos}><Send className="h-4 w-4 mr-1" />Enviar para Suprimentos</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elegant">
        <CardContent className="pt-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8 h-9" placeholder="Buscar minhas solicitações por nome…" value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
            <Badge variant="secondary">{minhasSolics.length}</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 border-b">
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Nº</th><th className="px-3 py-2">Solicitante</th>
                  <th className="px-3 py-2">Status</th><th className="px-3 py-2">Criado</th>
                </tr>
              </thead>
              <tbody>
                {minhasSolics.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">Nenhuma solicitação.</td></tr>
                ) : minhasSolics.map(r => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">{r.numero || "—"}</td>
                    <td className="px-3 py-2">{r.solicitante || "—"}</td>
                    <td className="px-3 py-2"><Badge variant="outline">{r.status || "—"}</Badge></td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
