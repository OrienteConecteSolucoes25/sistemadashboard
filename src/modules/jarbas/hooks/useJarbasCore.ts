import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useJarbasVoice } from "./useJarbasVoice";
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
  
  // Offline Persistence
  useEffect(() => {
    const savedHistory = localStorage.getItem('jarbas_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('jarbas_history', JSON.stringify(history.slice(-20)));
  }, [history]);

  const [context, setContext] = useState<JarbasContext>(() => {
    const savedContext = localStorage.getItem('jarbas_context');
    return savedContext ? JSON.parse(savedContext) : {
      current_module: "Geral",
      current_step_index: 0
    };
  });

  useEffect(() => {
    localStorage.setItem('jarbas_context', JSON.stringify(context));
  }, [context]);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Carregar contexto do banco
  const refreshContext = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('jarbas_operational_context')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data && !error) {
      setContext(data as JarbasContext);
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
        // Lógica para avançar workflow
        break;
      default:
        console.log("Ação não reconhecida:", action);
    }
  }, [navigate]);

  const processInput = async (input: string, isVoice: boolean = true) => {
    setIsProcessing(true);
    setHistory(prev => [...prev, { role: 'user', text: input, timestamp: new Date() }]);

    try {
      const { data, error } = await supabase.functions.invoke('jarbas-engine', {
        body: { transcript: input, context, history: history.slice(-5) }
      });

      if (error) throw error;

      const { text, action, type } = data;

      setHistory(prev => [...prev, { role: 'jarbas', text, type, timestamp: new Date() }]);
      
      if (isVoice) {
        speak(text);
      }

      if (action) {
        await executeAction(action);
      }

      await saveLog(input, text, isVoice);

    } catch (error) {
      console.error("Jarbas Error:", error);
      toast.error("Erro no processamento do Jarbas");
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    context,
    history,
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
    },
    toggleJarbas: () => {
      // Logic for opening/closing the UI if needed
    }
  };
}
