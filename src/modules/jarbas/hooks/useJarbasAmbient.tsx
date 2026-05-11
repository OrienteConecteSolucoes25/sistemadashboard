import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from "sonner";

type AmbientState = 'idle' | 'alert' | 'success' | 'processing' | 'critical';

interface JarbasAmbientContextType {
  state: AmbientState;
  setAmbientState: (state: AmbientState) => void;
  triggerReaction: (type: 'sound' | 'visual' | 'voice', payload?: any) => void;
}

const JarbasAmbientContext = createContext<JarbasAmbientContextType | undefined>(undefined);

export const JarbasAmbientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AmbientState>('idle');

  const setAmbientState = useCallback((newState: AmbientState) => {
    setState(newState);
    // Auto-return to idle after 5 seconds if not critical or idle
    if (newState !== 'idle' && newState !== 'critical') {
      setTimeout(() => setState('idle'), 5000);
    }
  }, []);

  const triggerReaction = useCallback((type: 'sound' | 'visual' | 'voice', payload?: any) => {
    console.log(`[JarbasAmbient] Reaction triggered: ${type}`, payload);
    
    // Logic for sound reactions
    if (type === 'sound') {
      const audio = new Audio(payload?.url || '/sounds/jarbas-ping.mp3');
      audio.volume = 0.2;
      audio.play().catch(e => console.log('Audio play blocked or missing file'));
    }

    // Logic for visual alerts
    if (type === 'visual' && payload?.message) {
      if (payload.severity === 'critical') {
        toast.error(payload.message, {
          description: "Jarbas detectou uma anomalia crítica.",
          duration: 10000,
        });
      } else {
        toast(payload.message, {
          icon: '🤖',
          description: "Jarbas está reagindo ao ambiente.",
        });
      }
    }
  }, []);

  return (
    <JarbasAmbientContext.Provider value={{ state, setAmbientState, triggerReaction }}>
      <div className={`transition-all duration-1000 min-h-screen ${
        state === 'alert' ? 'shadow-[inset_0_0_100px_rgba(234,179,8,0.1)]' :
        state === 'critical' ? 'shadow-[inset_0_0_150px_rgba(239,68,68,0.2)] animate-pulse' :
        state === 'success' ? 'shadow-[inset_0_0_100px_rgba(34,197,94,0.1)]' :
        ''
      }`}>
        {children}
      </div>
    </JarbasAmbientContext.Provider>
  );
};

export const useJarbasAmbient = () => {
  const context = useContext(JarbasAmbientContext);
  if (!context) throw new Error('useJarbasAmbient must be used within a JarbasAmbientProvider');
  return context;
};
