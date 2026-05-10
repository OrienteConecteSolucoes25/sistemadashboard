import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  state: 'idle' | 'listening' | 'speaking' | 'processing' | 'alert' | 'error' | 'security';
}

export const JarbasHolographicUI = ({ state }: Props) => {
  const getThemeColor = () => {
    switch (state) {
      case 'alert':
      case 'error': return '#ef4444';
      case 'listening': return '#22d3ee';
      case 'speaking': return '#3b82f6';
      case 'processing': return '#818cf8';
      case 'security': return '#10b981';
      default: return '#06b6d4';
    }
  };

  const color = getThemeColor();

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {/* Glow de fundo */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute inset-0 rounded-full blur-3xl"
        style={{ backgroundColor: color }}
      />

      {/* Anéis Orbitais */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border border-dashed rounded-full opacity-20"
        style={{ borderColor: color }}
      />
      
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute inset-4 border border-cyan-500/10 rounded-full"
      />

      {/* Núcleo Central Pulsante */}
      <div className="relative w-24 h-24">
        <motion.div
          animate={{
            scale: state === 'processing' ? [1, 1.1, 1] : [1, 1.05, 1],
            rotate: state === 'processing' ? 180 : 0
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* Hexágono ou Forma Central */}
          <div 
            className="w-16 h-16 border-2 rotate-45 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.2)]"
            style={{ borderColor: color, backgroundColor: `${color}10` }}
          >
            <div className="w-8 h-8 border border-white/20 animate-spin-slow rotate-45" />
          </div>
        </motion.div>

        {/* Partículas de Dados Flutuantes */}
        <AnimatePresence>
          {state === 'processing' && (
            <div className="absolute inset-0">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    scale: [0.5, 1.5, 0.5],
                    x: [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 40],
                    y: [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 40]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                  className="absolute w-1 h-1 bg-white rounded-full left-1/2 top-1/2"
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Escaneamento Horizontal */}
      <motion.div
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none"
      />
    </div>
  );
};

const AnimatePresence = motion.div;
