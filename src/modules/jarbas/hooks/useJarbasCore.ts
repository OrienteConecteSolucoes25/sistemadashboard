import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useJarbasVoice } from "./useJarbasVoice";
import { jarbasAutomation } from "../core/jarbasAutomation";
import { toast } from "sonner";

export interface JarbasContext {
  id?: string;
  current_module: string;
  active_os_id?: string;
  active_activity?: string;
  current_step_index: number;
  checklist_id?: string;
  last_location?: any;
}

export function useJarbasCore() {
  const location = useLocation();
  const navigate = useNavigate();
  const { speak, listen, isListening, isSpeaking, stopSpeaking, isSupported } = useJarbasVoice();
  
  const [chatHistory, setChatHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('jarbas_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [context, setContext] = useState<JarbasContext>(() => {
    const saved = localStorage.getItem('jarbas_context');
    return saved ? JSON.parse(saved) : {
      current_module: "Geral",
      current_step_index: 0
    };
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('jarbas_history', JSON.stringify(chatHistory.slice(-20)));
  }, [chatHistory]);

  useEffect(() => {
    localStorage.setItem('jarbas_context', JSON.stringify(context));
  }, [context]);

  // Mapeamento automático de módulos por rota
  useEffect(() => {
    const path = location.pathname;
    let moduleName = "Geral";
    if (path.includes("/financeiro")) moduleName = "Financeiro";
    else if (path.includes("/engenharia")) moduleName = "Engenharia";
    else if (path.includes("/marketplace")) moduleName = "Marketplace";
    else if (path.includes("/ti")) moduleName = "TI";
    else if (path.includes("/rhdp")) moduleName = "RH & DP";
    else if (path.includes("/solucoes-verso")) moduleName = "Soluções-Verso";

    setContext(prev => ({ ...prev, current_module: moduleName }));
  }, [location]);

  // Carregar contexto do banco (Sincronização)
  const refreshContext = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('jarbas_operational_context')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setContext(prev => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.warn("Offline: Não foi possível sincronizar contexto do banco.");
    }
  }, []);

  useEffect(() => {
    refreshContext();
  }, [refreshContext]);

  const saveLog = async (command: string, response: string, wasVoice: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('jarbas_logs').insert({
      user_id: user.id,
      command,
      response,
      was_voice: wasVoice
    });
  };

  const executeAction = useCallback(async (action: any) => {
    if (!action) return;

    switch (action.type) {
      case "navigate":
        navigate(action.path);
        break;
      case "require_confirmation":
        toast.info(`Aguardando confirmação: ${action.field}`);
        break;
      case "update_step":
        setContext(prev => ({ ...prev, current_step_index: prev.current_step_index + 1 }));
        break;
      default:
        console.log("Ação não reconhecida:", action);
    }
  }, [navigate]);

  const handleAutomation = useCallback(async (automationData: any) => {
    const { type, params, requiresConfirmation } = automationData;
    const automation = await jarbasAutomation.planAutomation(type, params, requiresConfirmation);
    
    if (automation.requiresConfirmation) {
      setChatHistory(prev => [...prev, { 
        role: 'jarbas', 
        text: `Entendido. Preciso que confirme a ação: ${type.replace('_', ' ')}. Posso prosseguir?`, 
        type: 'alert',
        automationId: automation.id,
        timestamp: new Date() 
      }]);
    } else {
      toast.success("Ação automatizada iniciada pelo Jarbas.");
    }
  }, []);

  const confirmAutomation = useCallback(async (id: string) => {
    const success = await jarbasAutomation.confirmAutomation(id);
    if (success) {
      toast.success("Ação confirmada e executada.");
      setChatHistory(prev => [...prev, { 
        role: 'jarbas', 
        text: "Ação executada com sucesso.", 
        type: 'success', 
        timestamp: new Date() 
      }]);
    } else {
      toast.error("Falha ao executar ação.");
    }
  }, []);

  const processInput = async (input: string, isVoice: boolean = true) => {
    setIsProcessing(true);
    setChatHistory(prev => [...prev, { role: 'user', text: input, timestamp: new Date() }]);

    try {
      const { data, error } = await supabase.functions.invoke('jarbas-engine', {
        body: { transcript: input, context, history: chatHistory.slice(-5) }
      });

      if (error) throw error;

      const { text, action, type } = data;

      setChatHistory(prev => [...prev, { role: 'jarbas', text, type, timestamp: new Date() }]);
      
      if (isVoice) {
        speak(text);
      }

      if (action) {
        await executeAction(action);
      }

      await saveLog(input, text, isVoice);

    } catch (error) {
      console.error("Jarbas Error:", error);
      toast.error("Erro no processamento do Jarbas. Operando em modo de contingência.");
      
      // Resposta básica offline/de erro
      const errorMsg = "Desculpe, estou com dificuldade de conexão com o motor central. Mas registrei sua solicitação localmente.";
      setChatHistory(prev => [...prev, { role: 'jarbas', text: errorMsg, type: 'info', timestamp: new Date() }]);
      if (isVoice) speak(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    context,
    chatHistory,
    isProcessing,
    isListening,
    isSpeaking,
    isSupported,
    processInput,
    handleMicClick: async () => {
      if (isSpeaking) {
        stopSpeaking();
        return;
      }
      try {
        const transcript = await listen();
        if (transcript) processInput(transcript, true);
      } catch (e) {
        toast.error("Erro ao acessar microfone");
      }
    }
  };
}
