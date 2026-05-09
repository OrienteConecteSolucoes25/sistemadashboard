import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bot, Send, X, Loader2, Sparkles, Plus, MessageSquare, ChevronLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBrandKit } from "../hooks/useActiveBrandKit";
import { useComunicacaoAccess } from "../hooks/useComunicacaoAccess";
import { BrandKitSelector } from "./BrandKitSelector";

type Msg = { id?: string; role: "user" | "assistant" | "tool"; content: string; tool_calls?: any; tool_results?: any };

export function DiretorAgentChat({ renderTrigger }: { renderTrigger?: (open: () => void) => ReactNode } = {}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "chat">("list");
  const [conversations, setConversations] = useState<any[]>([]);
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [scope, setScope] = useState<"externa" | "interna">("externa");
  const { user } = useAuth() as any;
  const { activeBrand, activeBrandId } = useActiveBrandKit();
  const { companyId } = useComunicacaoAccess();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  async function loadConversations() {
    if (!user) return;
    const { data } = await supabase
      .from("comm_director_conversations")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .order("updated_at", { ascending: false })
      .limit(30);
    setConversations(data ?? []);
  }

  async function loadMessages(id: string) {
    const { data } = await supabase
      .from("comm_director_messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at");
    setMessages((data ?? []) as any);
  }

  useEffect(() => { if (open && view === "list") loadConversations(); }, [open, view, user]);

  async function newChat() {
    if (!user || !companyId) return;
    const { data, error } = await supabase.from("comm_director_conversations").insert({
      user_id: user.id, company_id: companyId, brand_kit_id: activeBrandId,
      scope, allowed_modules: [], title: `Conversa ${new Date().toLocaleString("pt-BR")}`,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setConvId(data.id);
    setMessages([{
      role: "assistant",
      content: `Olá! Sou o **Diretor de Comunicação OCS**. Posso te ajudar a planejar e criar tudo no módulo de Comunicação:\n\n- 📅 Calendário editorial\n- ✍️ Posts, legendas, carrosséis, newsletter\n- 🎨 Design (grade Instagram)\n- 💡 Ideias e campanhas\n- 📢 Comunicados internos\n\nMe diga o que você quer fazer. ${activeBrand ? `Estou usando o brand kit **${activeBrand.nome}**.` : "⚠️ Selecione um cliente/marca no topo para começar."}`,
    }]);
    setView("chat");
  }

  async function openConv(c: any) {
    setConvId(c.id);
    setScope(c.scope);
    await loadMessages(c.id);
    setView("chat");
  }

  async function send() {
    const text = input.trim();
    if (!text || busy || !convId) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    setMessages((p) => [...p, userMsg]);
    setBusy(true);

    // persist user message
    await supabase.from("comm_director_messages").insert({
      conversation_id: convId, role: "user", content: text,
    });

    try {
      const { data, error } = await supabase.functions.invoke("comm-director-agent", {
        body: {
          conversation_id: convId,
          company_id: companyId,
          brand_kit_id: activeBrandId,
          scope,
          message: text,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const reply = (data as any).reply ?? "(sem resposta)";
      const tool_results = (data as any).tool_results;
      const assistantMsg: Msg = { role: "assistant", content: reply, tool_results };
      setMessages((p) => [...p, assistantMsg]);

      await supabase.from("comm_director_messages").insert({
        conversation_id: convId, role: "assistant",
        content: reply, tool_results: tool_results ?? null,
      });
      await supabase.from("comm_director_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? "Erro no agente");
      setMessages((p) => [...p, { role: "assistant", content: `❌ Erro: ${e.message ?? "tente novamente"}` }]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    if (renderTrigger) return <>{renderTrigger(() => setOpen(true))}</>;
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Diretor de Comunicação OCS"
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-xl flex items-center justify-center hover:scale-105 transition"
      >
        <Sparkles className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(440px,calc(100vw-2rem))] h-[min(620px,calc(100vh-6rem))] rounded-xl border bg-card shadow-2xl flex flex-col">
      <div className="px-3 py-2 border-b flex items-center justify-between bg-gradient-to-r from-primary/15 to-transparent">
        <div className="flex items-center gap-2">
          {view === "chat" && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setView("list")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-display font-semibold">Diretor de Comunicação OCS</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {view === "list" ? (
        <>
          <div className="p-3 border-b space-y-2">
            <div className="text-xs text-muted-foreground">
              {activeBrand ? <>Cliente ativo: <b className="text-foreground">{activeBrand.nome}</b></> : <span className="text-amber-600">⚠️ Selecione um cliente no topo do módulo.</span>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={scope} onValueChange={(v: any) => setScope(v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="externa">Comunicação externa</SelectItem>
                  <SelectItem value="interna">Comunicação interna</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={newChat} disabled={!companyId}>
                <Plus className="h-4 w-4 mr-1" /> Nova conversa
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.length === 0 && (
                <div className="text-center text-xs text-muted-foreground p-6">
                  Nenhuma conversa. Inicie uma nova!
                </div>
              )}
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openConv(c)}
                  className="w-full text-left p-2 rounded hover:bg-muted text-xs"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3 w-3 text-primary" />
                    <span className="truncate">{c.title}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground ml-5">
                    {c.scope} · {new Date(c.updated_at).toLocaleDateString("pt-BR")}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </>
      ) : (
        <>
          <ScrollArea className="flex-1">
            <div ref={scrollRef} className="p-3 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div className={`max-w-[88%] rounded-lg px-3 py-2 text-sm ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                        {m.tool_results && Array.isArray(m.tool_results) && m.tool_results.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {m.tool_results.map((tr: any, ti: number) => (
                              <div key={ti} className="text-[11px] bg-primary/10 border border-primary/20 rounded px-2 py-1">
                                ✅ {tr.tool}: {tr.summary}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : m.content}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Diretor pensando...
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="border-t p-2 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
              placeholder='Ex.: "monte calendário de 4 posts/semana"'
              disabled={busy}
            />
            <Button size="icon" onClick={send} disabled={busy || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
