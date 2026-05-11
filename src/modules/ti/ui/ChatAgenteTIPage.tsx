import React from "react";
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  Lightbulb, 
  FileText, 
  Ticket,
  ChevronRight,
  ShieldAlert,
  Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useJarbasVoice } from "../../jarbas/hooks/useJarbasVoice";

export default function ChatAgenteTIPage() {
  const [messages, setMessages] = React.useState<any[]>([
    { 
      id: 1, 
      role: 'agent', 
      text: "Olá! Sou o Agente de TI Inteligente do ERP OCS. Em que posso ajudar hoje?",
      suggestions: ["Problema de Acesso", "Sistema Lento", "Dúvida sobre Módulo", "Abrir Chamado"]
    }
  ]);
  const [input, setInput] = React.useState("");
  const { speak } = useJarbasVoice();
  const [isOpeningTicket, setIsOpeningTicket] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleOpenTicket = async () => {
    setIsOpeningTicket(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from('ti_tickets').insert({
        company_id: (await supabase.from('profiles').select('company_id').eq('id', userData.user.id).single()).data?.company_id,
        user_id: userData.user.id,
        title: "Chamado Crítico via Agente IA",
        description: "Chamado aberto automaticamente após diagnóstico do Agente de TI Inteligente sobre falha de permissão no módulo financeiro.",
        category: "permissoes",
        priority: "critica",
        status: "aberto"
      });

      if (error) throw error;
      
      toast.success("CHAMADO CRÍTICO ABERTO COM SUCESSO!");
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'agent',
        text: "Chamado #00452 aberto com sucesso. Nossa equipe técnica já foi notificada e o SLA de resolução é de 4 horas."
      }]);
    } catch (e: any) {
      toast.error("Erro ao abrir chamado: " + e.message);
    } finally {
      setIsOpeningTicket(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Resposta simulada da IA (Agente de TI)
    setTimeout(() => {
      const agentMsg = {
        id: Date.now() + 1,
        role: 'agent',
        text: "Entendi o problema. Analisei os logs do sistema e identifiquei uma possível falha de permissão no módulo financeiro. Deseja que eu abra um chamado crítico para o suporte técnico?",
        action: { label: "Abrir Chamado Crítico", type: "ticket" },
        articles: [
          { title: "Como resetar permissões de acesso", link: "#" },
          { title: "Manual do Módulo Financeiro OCS", link: "#" }
        ]
      };
      setMessages(prev => [...prev, agentMsg]);
      speak(agentMsg.text);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-[#F1F5F9]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              AGENTE DE TI INTELIGENTE <Sparkles className="w-3 h-3 text-amber-500" />
            </h2>
            <p className="text-[10px] text-green-600 font-bold uppercase tracking-tighter">SISTEMA OPERACIONAL // ONLINE</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="text-[9px] uppercase font-black border-slate-300">SLA: 100%</Badge>
           <Badge variant="outline" className="text-[9px] uppercase font-black border-slate-300">ID: OCS-TI-001</Badge>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Context & Assets */}
        <div className="hidden lg:flex w-80 bg-white border-r border-slate-200 flex-col p-4 gap-6">
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <ShieldAlert className="w-3 h-3" /> Diagnóstico do Sistema
            </h3>
            <div className="space-y-2">
               <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                 <p className="text-[10px] font-bold text-green-700 uppercase">Módulos</p>
                 <p className="text-xs font-bold text-slate-700">Tudo funcionando normalmente.</p>
               </div>
               <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                 <p className="text-[10px] font-bold text-amber-700 uppercase">Acesso Atual</p>
                 <p className="text-xs font-bold text-slate-700">Conexão via IP Seguro: São Paulo</p>
               </div>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Search className="w-3 h-3" /> Base de Conhecimento
            </h3>
            <div className="space-y-2">
               {["Configurar E-mail", "Lentidão no Chrome", "Erros de Integração"].map((item, i) => (
                 <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer group border border-transparent hover:border-slate-100">
                    <span className="text-xs font-medium text-slate-600 group-hover:text-blue-600">{item}</span>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 flex flex-col relative">
          <ScrollArea className="flex-1 p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-6 pb-20">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                  <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-slate-300' : 'bg-blue-600'}`}>
                      {m.role === 'user' ? <User className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4 text-white" />}
                    </div>
                    <div className="space-y-3">
                      <div className={`p-4 rounded-2xl shadow-sm text-sm font-medium leading-relaxed ${
                        m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                      }`}>
                        {m.text}
                      </div>

                      {/* Agente Extras */}
                      {m.role === 'agent' && (
                        <div className="space-y-2">
                          {m.suggestions && (
                            <div className="flex flex-wrap gap-2">
                              {m.suggestions.map((s: string) => (
                                <Button key={s} variant="outline" size="sm" className="h-7 text-[10px] font-bold rounded-full bg-white hover:bg-blue-50 hover:text-blue-600 border-slate-200">
                                  {s}
                                </Button>
                              ))}
                            </div>
                          )}
                          
                          {m.action && (
                            <Button 
                              onClick={m.action.type === 'ticket' ? handleOpenTicket : undefined}
                              disabled={isOpeningTicket}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-xs font-black uppercase tracking-wider gap-2"
                            >
                              <Ticket className="w-3 h-3" /> {isOpeningTicket ? "PROCESSANDO..." : m.action.label}
                            </Button>
                          )}

                          {m.articles && (
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Lightbulb className="w-3 h-3" /> Sugestões da IA
                              </p>
                              <div className="space-y-1">
                                {m.articles.map((art: any, i: number) => (
                                  <a key={i} href={art.link} className="flex items-center gap-2 text-[11px] font-bold text-blue-600 hover:underline">
                                    <FileText className="w-3 h-3" /> {art.title}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-200">
            <div className="max-w-2xl mx-auto relative">
              <Input 
                placeholder="Descreva o problema ou faça uma pergunta..." 
                className="pr-12 h-12 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-blue-500 font-medium"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button 
                onClick={handleSend}
                size="icon" 
                className="absolute right-1 top-1 bottom-1 bg-blue-600 hover:bg-blue-700 rounded-lg h-10 w-10"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-center text-[9px] text-slate-400 uppercase font-black tracking-widest mt-2">
              ERP OCS // O Agente de TI está processando dados em tempo real
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
