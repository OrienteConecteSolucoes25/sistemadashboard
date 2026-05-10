import { useEffect, useRef, useState } from "react";
import { Sparkles, LucideIcon, Bot } from "lucide-react";

export interface AgentNpcProps {
  name: string;
  moduleKey: string;
  icon?: LucideIcon;
  primaryColor?: string;
  secondaryColor?: string;
  startX?: number;
  onClick: () => void;
  sequence?: Array<{ pose: "walk-l" | "walk-r" | "sit"; x: number; dur: number }>;
}

/**
 * Componente genérico para NPCs de Agentes por Módulo.
 */
export function ModuleAgentNpc({
  name,
  moduleKey,
  icon: Icon = Sparkles,
  primaryColor = "#6366f1", // default primary
  secondaryColor = "#4f46e5",
  startX = 50,
  onClick,
  sequence,
}: AgentNpcProps) {
  const [hover, setHover] = useState(false);
  const [x, setX] = useState(startX);
  const [pose, setPose] = useState<"walk-l" | "walk-r" | "sit">("walk-r");
  const [bob, setBob] = useState(0);
  const timer = useRef<number | null>(null);

  const defaultSequence: Array<{ pose: "walk-l" | "walk-r" | "sit"; x: number; dur: number }> = [
    { pose: "walk-r", x: startX + 15, dur: 6000 },
    { pose: "walk-l", x: startX - 15, dur: 6000 },
    { pose: "sit",    x: startX,      dur: 8000 },
  ];

  const seq = sequence || defaultSequence;

  useEffect(() => {
    let i = 0;
    const tick = () => {
      const s = seq[i % seq.length];
      setPose(s.pose);
      setX(s.x);
      i++;
      timer.current = window.setTimeout(tick, s.dur);
    };
    tick();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [seq]);

  useEffect(() => {
    if (pose === "sit") { setBob(0); return; }
    const id = window.setInterval(() => setBob((b) => (b === 0 ? -2 : 0)), 220);
    return () => clearInterval(id);
  }, [pose]);

  const flip = pose === "walk-l" ? "scaleX(-1)" : "scaleX(1)";
  const sitting = pose === "sit";

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={`Falar com ${name}`}
      className="absolute z-30 flex flex-col items-center group cursor-pointer"
      style={{
        left: `${x}%`,
        bottom: sitting ? "1.25rem" : "0.5rem",
        transform: `translateX(-50%) translateY(${bob}px)`,
        transition: "left 5s linear, bottom 0.4s ease, transform 0.2s ease",
        imageRendering: "pixelated",
      }}
    >
      <div
        className={`mb-1 px-3 py-2 rounded-xl bg-slate-950/90 text-white border border-primary/30 text-[11px] font-display whitespace-nowrap shadow-[0_0_15px_rgba(37,99,235,0.4)] backdrop-blur-md transition-all ${
          hover ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-primary/20">
            <Icon className="h-3 w-3 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold leading-none">{name}</span>
            <span className="text-[9px] text-primary/80 font-mono mt-0.5">ESPECIALISTA ONLINE</span>
          </div>
        </div>
      </div>

      <div
        className="relative w-10 h-14 group-hover:scale-110 transition-transform"
        style={{ transform: flip }}
      >
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-black/30 rounded-full blur-[1px]" />
        {/* Cabelo/Topo */}
        <div className="absolute top-0 left-1 w-8 h-3 bg-[#1a1f26] rounded-t-sm" />
        {/* Rosto */}
        <div className="absolute top-2 left-1.5 w-7 h-5 bg-[#f5d2a8]" />
        {/* Olhos */}
        <div className="absolute top-3.5 left-3 w-1 h-1 bg-black" />
        <div className="absolute top-3.5 left-5 w-1 h-1 bg-black" />
        {/* Roupa */}
        <div className="absolute top-7 left-0.5 w-9 h-4" style={{ backgroundColor: primaryColor }} />
        <div className="absolute top-7 left-1/2 -translate-x-1/2 w-1.5 h-3" style={{ backgroundColor: secondaryColor }} />
        
        {sitting ? (
          <div className="absolute top-11 left-1.5 w-7 h-2 bg-[#1a1f26]" />
        ) : (
          <>
            <div className="absolute top-11 left-1.5 w-3 h-3 bg-[#1a1f26]" />
            <div className="absolute top-11 right-1.5 w-3 h-3 bg-[#1a1f26]" />
          </>
        )}
        {/* Badge flutuante avançada */}
        <div 
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full animate-pulse ring-2 ring-background flex items-center justify-center shadow-lg"
          style={{ backgroundColor: primaryColor }}
        >
          <Bot className="w-2.5 h-2.5 text-white" />
        </div>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary/20 rounded-full blur-[2px] animate-pulse" />
      </div>
    </button>
  );
}
