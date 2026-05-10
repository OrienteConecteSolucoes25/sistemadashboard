import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  isAlert?: boolean;
}

export const JarbasVoiceVisualizer = ({ isListening, isSpeaking, isProcessing, isAlert }: Props) => {
  const bars = Array.from({ length: 20 });
  const color = isAlert ? 'bg-red-500' : isListening ? 'bg-cyan-400' : isSpeaking ? 'bg-blue-500' : 'bg-cyan-500/30';

  return (
    <div className="flex items-center justify-center gap-[2px] h-12 w-full">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          initial={{ height: 2 }}
          animate={{
            height: isListening || isSpeaking || isProcessing 
              ? [4, Math.random() * 40 + 8, 4] 
              : 4,
            opacity: isListening || isSpeaking || isProcessing ? 1 : 0.3
          }}
          transition={{
            repeat: Infinity,
            duration: 0.5 + Math.random() * 0.5,
            ease: "easeInOut"
          }}
          className={`w-1 rounded-full ${color} shadow-[0_0_10px_rgba(0,242,255,0.3)]`}
        />
      ))}
    </div>
  );
};
