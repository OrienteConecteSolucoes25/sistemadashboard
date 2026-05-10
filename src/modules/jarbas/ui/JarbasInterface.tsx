import { useState, useEffect, useCallback, useRef } from "react";
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
  History as HistoryIcon,
  Info,
  Maximize2,
  Minimize2,
  AlertTriangle,
  CheckCircle2,
  Settings,
  BrainCircuit,
  Database
} from "lucide-react";
import { useJarbasCore } from "../hooks/useJarbasCore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function JarbasInterface() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFieldMode, setIsFieldMode] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const { 
    context, 
    chatHistory, 
    isProcessing, 
    isListening, 
    isSpeaking, 
    isSupported, 
    handleMicClick,
    processInput 
  } = useJarbasCore();

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [chatHistory]);

  const toggleJarbas = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Opcional: boas vindas ao abrir
    }
  };

  const toggleFieldMode = () => setIsFieldMode(!isFieldMode);

  if (!isOpen) {
    return (
      <button 
        onClick={toggleJarbas}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-slate-950 border-2 border-primary/40 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:scale-110 transition-all group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent animate-pulse" />
        <BrainCircuit className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-500" />
      </button>
    );
  }

  const containerClasses = isFieldMode 
    ? "fixed inset-0 z-50 flex flex-col bg-slate-950 animate-in fade-in zoom-in duration-300"
    : "fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 w-full sm:w-[450px] h-full sm:h-[650px] flex flex-col bg-slate-950 border-l sm:border border-primary/20 sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300";

  return (
    <div className={containerClasses}>
      {/* Header Futurista */}
      <div className="p-4 bg-slate-900/80 backdrop-blur-md border-b border-primary/10 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Zap className="w-5 h-5 text-primary animate-pulse" />
            <div className="absolute inset-0 blur-sm bg-primary/40 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-widest text-slate-100 uppercase">Jarbas OCS</h2>
              <Badge variant="outline" className="text-[9px] border-primary/30 text-primary h-4 px-1">V2.0 ADVANCED</Badge>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
              <span className="text-[10px] text-green-500 font-mono">MOTOR_OPERACIONAL_ATIVO</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleFieldMode} title="Modo Campo" className="text-slate-400 hover:text-white">
            {isFieldMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleJarbas} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Grid de Informação em Tempo Real (Context Engine) */}
      <div className="px-4 py-2 bg-slate-900/50 border-b border-primary/5 grid grid-cols-4 gap-2 text-[9px] font-mono">
        <div className="flex flex-col items-center p-1 rounded bg-slate-800/30 border border-white/5">
          <Layers className="w-3 h-3 text-primary mb-1" />
          <span className="text-slate-500 truncate w-full text-center">{context.current_module}</span>
        </div>
        <div className="flex flex-col items-center p-1 rounded bg-slate-800/30 border border-white/5">
          <Activity className="w-3 h-3 text-amber-500 mb-1" />
          <span className="text-slate-500 truncate w-full text-center">ETAPA {context.current_step_index + 1}</span>
        </div>
        <div className="flex flex-col items-center p-1 rounded bg-slate-800/30 border border-white/5">
          <Database className="w-3 h-3 text-blue-500 mb-1" />
          <span className="text-slate-500 truncate w-full text-center">DB_SYNC: OK</span>
        </div>
        <div className="flex flex-col items-center p-1 rounded bg-slate-800/30 border border-white/5">
          <ShieldAlert className="w-3 h-3 text-red-500 mb-1" />
          <span className="text-slate-500 truncate w-full text-center">SAFETY: ON</span>
        </div>
      </div>

      {/* Área de Mensagens (ScrollArea) */}
      <ScrollArea className="flex-1 p-4 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-fixed" ref={scrollAreaRef}>
        <div className="space-y-4 pb-4">
          {chatHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-10 opacity-30">
              <Cpu className="w-12 h-12 mb-4 animate-pulse" />
              <p className="text-xs font-mono">AGUARDANDO COMANDO OPERACIONAL...</p>
            </div>
          )}
          {chatHistory.map((item, i) => (
            <div key={i} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] p-4 rounded-2xl border text-sm shadow-lg ${
                item.role === 'user' 
                  ? 'bg-primary/20 border-primary/30 text-slate-100 rounded-tr-none' 
                  : 'bg-slate-900/90 border-slate-700/50 text-slate-200 rounded-tl-none'
              } ${item.type === 'alert' ? 'border-amber-500/50 bg-amber-500/10' : ''} ${item.type === 'success' ? 'border-green-500/50 bg-green-500/10' : ''}`}>
                <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-1">
                  {item.role === 'jarbas' ? <Terminal className="w-3 h-3 text-primary" /> : <Mic className="w-3 h-3 text-slate-400" />}
                  <span className="text-[10px] opacity-50 font-mono">{new Date(item.timestamp).toLocaleTimeString()}</span>
                  {item.type === 'alert' && <Badge variant="destructive" className="ml-auto text-[8px] h-3 px-1">SEGURANÇA</Badge>}
                </div>
                <div className={isFieldMode ? "text-lg leading-relaxed" : "text-sm"}>
                  {item.text}
                </div>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start items-center gap-2 text-[10px] text-primary animate-pulse font-mono">
              <Zap className="w-3 h-3 animate-spin" /> PROCESSANDO_INTELIGENCIA...
            </div>
          )}
          {isSpeaking && (
            <div className="flex justify-start items-center gap-2 text-[10px] text-primary animate-pulse font-mono">
              <Volume2 className="w-3 h-3" /> TRANSMITINDO_AUDIO...
            </div>
          )}
          {isListening && (
            <div className="flex justify-end items-center gap-2 text-[10px] text-red-500 animate-pulse font-mono">
              SISTEMA_ESCUTA_ATIVO <Mic className="w-3 h-3" />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Control Panel / Modo Campo */}
      <div className={`p-6 bg-slate-950 border-t border-primary/10 flex flex-col items-center justify-center relative ${isFieldMode ? 'h-1/3' : ''}`}>
        <div className={`absolute inset-0 bg-primary/5 transition-opacity duration-500 ${isListening || isSpeaking ? 'opacity-100' : 'opacity-0'}`} />
        
        <button 
          onClick={handleMicClick}
          disabled={!isSupported || isProcessing}
          className={`relative z-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
            isFieldMode ? 'w-32 h-32' : 'w-24 h-24'
          } ${
            isListening 
              ? 'bg-red-500 border-red-400 shadow-[0_0_50px_rgba(239,68,68,0.7)] scale-110' 
              : isSpeaking
                ? 'bg-primary border-primary shadow-[0_0_50px_rgba(37,99,235,0.7)]'
                : 'bg-slate-900 border-primary/30 hover:border-primary/60 hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]'
          }`}
        >
          {isSpeaking ? (
            <VolumeX className={isFieldMode ? "w-12 h-12 text-white" : "w-10 h-10 text-white"} />
          ) : (
            <Mic className={`${isFieldMode ? "w-12 h-12" : "w-10 h-10"} text-white ${isListening ? 'animate-bounce' : ''}`} />
          )}
          
          {/* Visual Feedback Rings */}
          {(isListening || isSpeaking) && (
            <div className="absolute inset-[-12px] border-2 border-primary/30 rounded-full animate-ping pointer-events-none" />
          )}
        </button>

        <div className="mt-4 text-[10px] text-slate-500 font-mono tracking-[0.2em] z-10">
          {!isSupported ? 'HARWARE_AUDIO_ERROR' : isListening ? 'ESCUTANDO...' : isSpeaking ? 'FALANDO...' : 'TOQUE PARA COMANDAR'}
        </div>

        {isFieldMode && (
          <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-sm z-10">
            <Button variant="outline" className="h-16 bg-slate-900 border-slate-800 text-lg flex gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" /> SIM
            </Button>
            <Button variant="outline" className="h-16 bg-slate-900 border-slate-800 text-lg flex gap-2">
              <X className="w-6 h-6 text-red-500" /> NÃO
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
