import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useJarbasAmbient } from "../hooks/useJarbasAmbient";
import { Zap, AlertTriangle, CheckCircle2, Cpu } from "lucide-react";

export const JarbasAmbientVisuals = () => {
  const { state } = useJarbasAmbient();

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {/* Critical Red Scanline */}
        {state === 'critical' && (
          <motion.div
            initial={{ top: "-10%" }}
            animate={{ top: "110%" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-2 bg-red-500/40 blur-md shadow-[0_0_20px_rgba(239,68,68,0.8)]"
          />
        )}

        {/* HUD Elements for Active State */}
        {state !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-10 right-10 flex flex-col items-end gap-2"
          >
            <div className={`flex items-center gap-3 px-4 py-2 rounded-sm border ${
              state === 'critical' ? 'bg-red-950/40 border-red-500 text-red-500' :
              state === 'alert' ? 'bg-yellow-950/40 border-yellow-500 text-yellow-500' :
              'bg-cyan-950/40 border-cyan-500 text-cyan-500'
            } backdrop-blur-md`}>
              <Cpu className={`w-4 h-4 ${state === 'processing' ? 'animate-spin' : 'animate-pulse'}`} />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase italic">
                Jarbas System: {state}
              </span>
            </div>
          </motion.div>
        )}

        {/* Ambient Corner Accents */}
        <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-cyan-500/10" />
        <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-cyan-500/10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-cyan-500/10" />
        <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-cyan-500/10" />
      </AnimatePresence>

      {/* Persistent Scanline Grid */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(0,242,255,1)_1px,transparent_1px)] bg-[size:100%_4px]" />
    </div>
  );
};
