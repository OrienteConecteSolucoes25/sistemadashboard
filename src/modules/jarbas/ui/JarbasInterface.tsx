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
    history, 
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
  }, [history]);

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
