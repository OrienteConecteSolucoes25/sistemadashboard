import { useState, useEffect, useCallback } from "react";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  Terminal, 
  Zap, 
  ShieldAlert, 
  ClipboardCheck,
  Cpu,
  Layers,
  Activity,
  History,
  Info
} from "lucide-react";
import { useJarbasVoice } from "../hooks/useJarbasVoice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Interaction {
  role: 'jarbas' | 'user';
  text: string;
  type?: 'info' | 'alert' | 'success';
  timestamp: Date;
}

export function JarbasInterface() {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<Interaction[]>([]);
  const { speak, listen, isListening, isSpeaking, stopSpeaking, isSupported } = useJarbasVoice();
  const scrollRef = useCallback((node: HTMLDivElement | null) => {
    if (node) node.scrollTop = node.scrollHeight;
  }, []);

  const addInteraction = (role: 'jarbas' | 'user', text: string, type?: 'info' | 'alert' | 'success') => {
    setHistory(prev => [...prev, { role, text, type, timestamp: new Date() }]);
  };

  const processCommand = async (command: string) => {
    addInteraction('user', command);
    const cmd = command.toLowerCase();

    // Mock operacional para demonstração
    if (cmd.includes('instalação') || cmd.includes('eletrica') || cmd.includes('obras')) {
      const response = "Entendido. Verificando Ordem de Serviço na Torre Salvador Norte. Identifiquei 5 etapas. Antes de começar: Você está utilizando capacete, luvas isolantes e cinturão de segurança?";
      addInteraction('jarbas', response, 'alert');
      speak(response);
    } else if (cmd.includes('sim') || cmd.includes('confirmo') || cmd.includes('estou')) {
      const response = "Equipamentos validados. Registrei sua confirmação. Próximo passo: Valide o desligamento da rede elétrica no disjuntor principal e reporte quando concluído.";
      addInteraction('jarbas', response, 'success');
      speak(response);
    } else if (cmd.includes('concluido') || cmd.includes('feito') || cmd.includes('próximo')) {
      const response = "Rede elétrica desligada. Próximo passo: Registre uma foto do ponto de entrada antes da conexão física dos cabos.";
      addInteraction('jarbas', response, 'info');
      speak(response);
    } else {
      const response = "Comando recebido. Estou analisando os documentos operacionais do módulo para te orientar. Pode repetir a atividade?";
      addInteraction('jarbas', response);
      speak(response);
    }
  };

  const handleMicClick = async () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    try {
      const transcript = await listen();
      if (transcript) processCommand(transcript);
    } catch (error) {
      toast.error("Falha ao ouvir: " + error);
    }
  };

  const toggleJarbas = () => {
    if (!isOpen) {
      const welcome = "Jarbas OCS ativo. Sistema operacional inteligente online. Como posso orientar sua atividade de campo hoje?";
      addInteraction('jarbas', welcome);
      speak(welcome);
    } else {
      stopSpeaking();
    }
    setIsOpen(!isOpen);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={toggleJarbas}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-slate-950 border-2 border-primary/40 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:scale-105 transition-transform group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent animate-pulse" />
        <Cpu className="w-8 h-8 text-primary group-hover:rotate-90 transition-transform duration-500" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 w-full sm:w-[400px] h-full sm:h-[600px] flex flex-col bg-slate-950 border-l sm:border border-primary/20 sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
      {/* Header Futurista */}
      <div className="p-4 bg-slate-900/50 border-b border-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Zap className="w-5 h-5 text-primary animate-pulse" />
            <div className="absolute inset-0 blur-sm bg-primary/40 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wider text-slate-100 uppercase">Jarbas OCS</h2>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
              <span className="text-[10px] text-green-500 font-mono">OP_CORE_ONLINE</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleJarbas} className="text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Área de Logs/Mensagens */}
      <ScrollArea className="flex-1 p-4 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-fixed" ref={scrollRef}>
        <div className="space-y-4">
          {history.map((item, i) => (
            <div key={i} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-xl border text-sm transition-all ${
                item.role === 'user' 
                  ? 'bg-primary/10 border-primary/20 text-primary-foreground rounded-tr-none' 
                  : 'bg-slate-900/80 border-slate-700/50 text-slate-200 rounded-tl-none'
              } ${item.type === 'alert' ? 'border-amber-500/50 bg-amber-500/5' : ''} ${item.type === 'success' ? 'border-green-500/50 bg-green-500/5' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  {item.role === 'jarbas' ? <Terminal className="w-3 h-3 text-primary" /> : <Mic className="w-3 h-3 text-slate-400" />}
                  <span className="text-[10px] opacity-50 font-mono">{item.timestamp.toLocaleTimeString()}</span>
                </div>
                {item.text}
              </div>
            </div>
          ))}
          {isSpeaking && (
            <div className="flex justify-start items-center gap-2 text-[10px] text-primary animate-pulse font-mono">
              <Volume2 className="w-3 h-3" /> TRANSMITINDO_AUDIO...
            </div>
          )}
          {isListening && (
            <div className="flex justify-end items-center gap-2 text-[10px] text-red-500 animate-pulse font-mono">
              CAPTURANDO_VOZ... <Mic className="w-3 h-3" />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-slate-900 border-t border-primary/10 grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center justify-center p-2 rounded bg-slate-800/50 border border-white/5">
           <Layers className="w-3 h-3 text-slate-400 mb-1" />
           <span className="text-[8px] text-slate-500">MÓDULO: CAMPO</span>
        </div>
        <div className="flex flex-col items-center justify-center p-2 rounded bg-slate-800/50 border border-white/5">
           <Activity className="w-3 h-3 text-slate-400 mb-1" />
           <span className="text-[8px] text-slate-500">STATUS: GUIADO</span>
        </div>
        <div className="flex flex-col items-center justify-center p-2 rounded bg-slate-800/50 border border-white/5">
           <History className="w-3 h-3 text-slate-400 mb-1" />
           <span className="text-[8px] text-slate-500">LOGS: ATIVOS</span>
        </div>
      </div>

      {/* Control Panel */}
      <div className="p-6 bg-slate-950 flex items-center justify-center relative">
        {/* Glow effect */}
        <div className={`absolute inset-0 bg-primary/5 transition-opacity duration-500 ${isListening || isSpeaking ? 'opacity-100' : 'opacity-0'}`} />
        
        <button 
          onClick={handleMicClick}
          disabled={!isSupported}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
            isListening 
              ? 'bg-red-500 border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.6)] scale-110' 
              : isSpeaking
                ? 'bg-primary border-primary shadow-[0_0_30px_rgba(37,99,235,0.6)]'
                : 'bg-slate-900 border-primary/30 hover:border-primary/60'
          }`}
        >
          {isSpeaking ? <VolumeX className="w-8 h-8 text-white animate-pulse" /> : <Mic className={`w-8 h-8 text-white ${isListening ? 'animate-bounce' : ''}`} />}
          
          {/* Visual Feedback Rings */}
          {(isListening || isSpeaking) && (
            <div className="absolute inset-[-8px] border border-primary/20 rounded-full animate-ping pointer-events-none" />
          )}
        </button>

        <div className="absolute bottom-2 text-[8px] text-slate-600 font-mono tracking-widest">
          {!isSupported ? 'VOICE_HARDWARE_NOT_FOUND' : 'PRESS_FOR_COMMAND'}
        </div>
      </div>
    </div>
  );
}
