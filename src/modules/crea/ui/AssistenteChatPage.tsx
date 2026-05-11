import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bot, Send, Loader2, Info } from "lucide-react";

const sb: any = supabase;
const UFS = ["__all","AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO","BR"];

interface Msg { role: "user"|"assistant"; content: string; sources?: any[] }

export default function AssistentePage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [uf, setUf] = useState("__all");
  const [history, setHistory] = useState<any[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  const loadHistory = async () => {
    const { data } = await sb.from("crea_ai_questions").select("id,pergunta,resposta,uf,created_at").order("created_at",{ascending:false}).limit(20);
    setHistory(data ?? []);
  };
  useEffect(() => { loadHistory(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setBusy(true);
    try {
      const { data, error } = await sb.functions.invoke("crea-ai-assist", {
        body: { question: q, uf: uf === "__all" ? null : uf, history: messages.slice(-6) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages([...next, { role: "assistant", content: data.answer, sources: data.sources ?? [] }]);
      loadHistory();
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao consultar IA");
      setMessages([...next, { role: "assistant", content: "_Falha ao gerar resposta._" }]);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Bot className="w-6 h-6 text-primary" /> Assistente IA CREA</h1>
        <p className="text-sm text-muted-foreground">Responde apenas com base nas fontes cadastradas em <strong>Normas e Regras</strong>. Não inventa regra de CREA.</p>
      </div>

      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription className="text-xs">
          Filtre por UF para restringir as fontes consultadas. Cadastre normas e checklists em <strong>Conhecimento → Normas e Regras</strong> para enriquecer as respostas.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card className="flex flex-col h-[60vh]">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Chat</CardTitle>
              <Select value={uf} onValueChange={setUf}>
                <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>{UFS.map(u => <SelectItem key={u} value={u}>{u === "__all" ? "Todas UFs" : u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-3 p-4">
            {messages.length === 0 && <p className="text-sm text-muted-foreground text-center mt-8">Faça uma pergunta sobre normas, ARTs, CATs, prazos, baixas...</p>}
            {messages.map((m, i) => (
              <div key={i} className={`max-w-[85%] ${m.role === "user" ? "ml-auto" : ""}`}>
                <div className={`rounded-lg p-3 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {m.content}
                </div>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-muted-foreground">Fontes citadas:</div>
                    {m.sources.map((s: any, j: number) => (
                      <a key={j} href={s.link ?? "#"} target="_blank" rel="noreferrer"
                         className="block text-xs text-primary hover:underline">
                        • {s.titulo} {s.uf && <Badge variant="outline" className="ml-1">{s.uf}</Badge>}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Pensando...</div>}
            <div ref={endRef} />
          </CardContent>
          <div className="border-t p-3 flex gap-2">
            <Input placeholder="Pergunte algo..." value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} disabled={busy} />
            <Button onClick={send} disabled={busy || !input.trim()}><Send className="w-4 h-4" /></Button>
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Histórico recente</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
            {history.length === 0 ? <p className="text-xs text-muted-foreground">Sem perguntas anteriores.</p>
              : history.map((h) => (
                <div key={h.id} className="text-xs border-b pb-2 cursor-pointer hover:bg-muted/40 p-1 rounded"
                     onClick={() => setMessages([{role:"user",content:h.pergunta},{role:"assistant",content:h.resposta ?? ""}])}>
                  <div className="font-medium line-clamp-2">{h.pergunta}</div>
                  <div className="text-muted-foreground">{new Date(h.created_at).toLocaleString("pt-BR")} {h.uf && `· ${h.uf}`}</div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
