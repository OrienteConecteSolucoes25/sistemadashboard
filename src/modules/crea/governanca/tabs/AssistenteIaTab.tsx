import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, Loader2, Send, Sparkles, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string; tools?: { name: string; ok: boolean }[] };

const SUGESTOES = [
  "Quais os KPIs gerais deste ano?",
  "Top 5 RTs por quantidade de ARTs",
  "Top 10 empresas por ARTs",
  "Distribuição por setor",
  "Liste as ARTs vencidas",
  "Quais conciliações estão divergentes?",
];

export function AssistenteIaTab() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(next); setInput(""); setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("crea-gov-ai", {
        body: {
          question: q,
          history: next.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMsgs([...next, { role: "assistant", content: data.answer ?? "(sem resposta)", tools: data.tools ?? [] }]);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao consultar IA");
      setMsgs([...next, { role: "assistant", content: `⚠️ ${e?.message ?? "Erro"}` }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="card-elegant lg:col-span-2 flex flex-col h-[70vh]">
        <CardHeader className="border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" /> Assistente de Governança
            <Badge variant="outline" className="text-xs">gemini-2.5-flash</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {msgs.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary opacity-50" />
              Pergunte sobre KPIs, RTs, empresas, vencidas, divergências…
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && <Bot className="h-5 w-5 mt-1 text-primary shrink-0" />}
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                {m.content}
                {m.tools && m.tools.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.tools.map((t, j) => (
                      <Badge key={j} variant="secondary" className="text-[10px]">
                        {t.ok ? "✓" : "✗"} {t.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {m.role === "user" && <User className="h-5 w-5 mt-1 text-muted-foreground shrink-0" />}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 items-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> consultando dados…
            </div>
          )}
          <div ref={endRef} />
        </CardContent>
        <div className="border-t p-3 flex gap-2">
          <Input
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") ask(input); }}
            placeholder="Pergunte ao assistente…" disabled={loading}
          />
          <Button onClick={() => ask(input)} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <Card className="card-elegant">
        <CardHeader><CardTitle className="text-base">Sugestões</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {SUGESTOES.map(s => (
            <Button key={s} variant="outline" size="sm" className="w-full justify-start text-left h-auto py-2"
              onClick={() => ask(s)} disabled={loading}>
              {s}
            </Button>
          ))}
          <p className="text-xs text-muted-foreground pt-2">
            O assistente usa tool-calling com dados reais da sua empresa: KPIs, rankings, vencidas e divergências. Não executa SQL livre.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
