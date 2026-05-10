import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bot, Send, X, Loader2, Sparkles, Plus, MessageSquare, ChevronLeft, LucideIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Msg = { id?: string; role: "user" | "assistant" | "tool"; content: string; tool_calls?: any; tool_results?: any };

interface Props {
  moduleKey: string;
  agentName: string;
  agentRole?: string;
  icon?: LucideIcon;
  welcomeMessage?: string;
  renderTrigger?: (open: () => void) => ReactNode;
  edgeFunctionName?: string;
}

export function ModuleAgentChat({ 
  moduleKey, 
  agentName, 
  agentRole,
  icon: Icon = Sparkles,
  welcomeMessage,
  renderTrigger,
  edgeFunctionName = "pixel-module-agent"
}: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "chat">("list");
  const [conversations, setConversations] = useState<any[]>([]);
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth() as any;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  async function loadConversations() {
    if (!user) return;
    const { data } = await supabase
      .from("pixel_agent_conversations")
      .select("*")
      .eq("user_id", user.id)
      .eq("module_key", moduleKey)
      .eq("is_deleted", false)
      .order("updated_at", { ascending: false })
      .limit(20);
    setConversations(data ?? []);
  }

  async function loadMessages(id: string) {
    const { data } = await supabase
      .from("pixel_agent_messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at");
    setMessages((data ?? []) as any);
  }

  useEffect(() => { if (open && view === "list") loadConversations(); }, [open, view, user, moduleKey]);

  async function newChat() {
    if (!user) return;
    const { data, error } = await supabase.from("pixel_agent_conversations").insert({
      user_id: user.id,
      module_key: moduleKey,
      title: `Conversa ${agentName} - ${new Date().toLocaleDateString("pt-BR")}`,
    }).select().single();
    
    if (error) { toast.error(error.message); return; }
    
    setConvId(data.id);
    const welcome = welcomeMessage || `Olá! Sou o especialista de **${agentName}**. Como posso te ajudar hoje?`;
    setMessages([{ role: "assistant", content: welcome }]);
    setView("chat");
  }

  async function openConv(c: any) {
    setConvId(c.id);
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

    await supabase.from("pixel_agent_messages").insert({
      conversation_id: convId, role: "user", content: text,
    });

    try {
      const { data, error } = await supabase.functions.invoke(edgeFunctionName, {
        body: {
          conversation_id: convId,
          module_key: moduleKey,
          message: text,
        },
      });
      if (error) throw error;
      
      const reply = (data as any).reply ?? "(sem resposta)";
      const tool_results = (data as any).tool_results;
      const assistantMsg: Msg = { role: "assistant", content: reply, tool_results };
      setMessages((p) => [...p, assistantMsg]);

      await supabase.from("pixel_agent_messages").insert({
        conversation_id: convId, role: "assistant",
        content: reply, tool_results: tool_results ?? null,
      });
      await supabase.from("pixel_agent_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
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
    return null; // O padrão é não mostrar nada se não tiver trigger, pois os NPCs são os gatilhos
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(400px,calc(100vw-2rem))] h-[min(580px,calc(100vh-6rem))] rounded-xl border bg-card shadow-2xl flex flex-col overflow-hidden">
      <div className="px-3 py-3 border-b flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center gap-3">
          {view === "chat" && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setView("list")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="relative">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Icon className="h-5 w-5" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" title="Online" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-display font-bold leading-none">{agentName}</span>
            <span className="text-[10px] text-muted-foreground font-mono mt-1 uppercase tracking-tight">{agentRole || "Agente Especialista"}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => setOpen(false)}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {view === "list" ? (
        <>
          <div className="p-3 border-b flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Conversas Recentes</span>
            <Button size="sm" onClick={newChat} className="h-8">
              <Plus className="h-3 w-3 mr-1" /> Novo Chat
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.length === 0 && (
                <div className="text-center text-xs text-muted-foreground p-10">
                  Inicie uma conversa com seu assistente de {agentName}.
                </div>
              )}
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openConv(c)}
                  className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <MessageSquare className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{c.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(c.updated_at).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </>
      ) : (
        <>
          <ScrollArea className="flex-1">
            <div ref={scrollRef} className="p-3 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div className={`max-w-[90%] rounded-2xl px-3 py-2.5 text-sm shadow-sm ${
                    m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none"
                  }`}>
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                        {m.tool_results && Array.isArray(m.tool_results) && m.tool_results.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {m.tool_results.map((tr: any, ti: number) => (
                              <div key={ti} className="text-[10px] bg-primary/5 border border-primary/10 rounded px-2 py-1 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-primary" /> {tr.summary}
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
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground animate-pulse pl-1">
                  <Bot className="h-3 w-3" /> {agentName} processando...
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-3 border-t bg-background">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                  placeholder="Escreva sua mensagem..."
                  className="min-h-[40px] max-h-[120px] resize-none"
                  disabled={busy}
                />
              </div>
              <Button size="icon" onClick={send} disabled={busy || !input.trim()} className="h-10 w-10 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
