import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type JarbasMode = 'resumido' | 'detalhado' | 'iniciante' | 'avancado';

export function useJarbasVoice() {
  const [isListening, setIsIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

  // Inicializa reconhecimento de voz (Browser Native API)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'pt-BR';
    }
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!synthRef.current) return;
    
    // Cancela qualquer fala anterior
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 0.9; // Tom um pouco mais encorpado/futurista

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };

    synthRef.current.speak(utterance);
  }, []);

  const listen = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!recognitionRef.current) {
        reject('Reconhecimento de voz não suportado neste navegador.');
        return;
      }

      recognitionRef.current.onstart = () => setIsIsListening(true);
      recognitionRef.current.onend = () => setIsIsListening(false);
      recognitionRef.current.onerror = (event: any) => reject(event.error);
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      recognitionRef.current.start();
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    speak,
    listen,
    stopSpeaking,
    isListening,
    isSpeaking,
    isSupported: !!recognitionRef.current
  };
}
