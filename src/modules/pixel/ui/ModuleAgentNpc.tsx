import { useEffect, useRef, useState } from "react";
import { Sparkles, LucideIcon, Bot } from "lucide-react";

export interface AgentNpcProps {
  name: string;
  moduleKey: string;
  icon?: LucideIcon;
  primaryColor?: string;
  secondaryColor?: string;
  startX?: number;
  startY?: number;
  onClick: () => void;
  sequence?: Array<{ pose: "walk-l" | "walk-r" | "sit"; x: number; y?: number; dur: number }>;
}

/**
 * NPC de agente — agora caminha por toda a área visível (X e Y),
 * trocando de pose e direção dinamicamente. A posição inicial deriva
 * de `startX` (0–100) e um Y aleatório no intervalo permitido.
 */
export function ModuleAgentNpc({
  name,
  moduleKey,
  icon: Icon = Sparkles,
  primaryColor = "#6366f1",
  secondaryColor = "#4f46e5",
  startX = 50,
  startY,
  onClick,
  sequence,
}: AgentNpcProps) {
  const [hover, setHover] = useState(false);
  const initialY = startY ?? 15 + Math.random() * 70; // 15% .. 85%
  const [x, setX] = useState(startX);
  const [y, setY] = useState(initialY);
  const [pose, setPose] = useState<"walk-l" | "walk-r" | "sit">("walk-r");
  const [bob, setBob] = useState(0);
  const timer = useRef<number | null>(null);

  // Gera uma rota aleatória cobrindo todo o stage caso nenhuma seja fornecida.
  const randomSeq = useRef<Array<{ pose: "walk-l" | "walk-r" | "sit"; x: number; y: number; dur: number }>>(
    Array.from({ length: 6 }).map(() => {
      const nx = 5 + Math.random() * 90;
      const ny = 10 + Math.random() * 80;
      const r = Math.random();
      const pose: "walk-l" | "walk-r" | "sit" = r < 0.15 ? "sit" : nx < x ? "walk-l" : "walk-r";
      return { pose, x: nx, y: ny, dur: 5500 + Math.random() * 4000 };
    })
  );

  const seq = sequence || randomSeq.current;

  useEffect(() => {
    let i = 0;
    const tick = () => {
      const s: any = seq[i % seq.length];
      setPose(s.pose);
      setX(s.x);
      if (typeof s.y === "number") setY(s.y);
      i++;
      // Renova a rota aleatória depois de completar um ciclo
      if (!sequence && i % seq.length === 0) {
        randomSeq.current = Array.from({ length: 6 }).map(() => {
          const nx = 5 + Math.random() * 90;
          const ny = 10 + Math.random() * 80;
          const r = Math.random();
          const pose: "walk-l" | "walk-r" | "sit" = r < 0.12 ? "sit" : Math.random() < 0.5 ? "walk-l" : "walk-r";
          return { pose, x: nx, y: ny, dur: 5500 + Math.random() * 4000 };
        });
      }
      timer.current = window.setTimeout(tick, s.dur);
    };
    tick();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [seq, sequence]);

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
        top: `${y}%`,
        transform: `translate(-50%, -50%) translateY(${bob}px)`,
        transition: "left 5s linear, top 5s linear, transform 0.2s ease",
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
        <div className="absolute top-0 left-1 w-8 h-3 bg-[#1a1f26] rounded-t-sm" />
        <div className="absolute top-2 left-1.5 w-7 h-5 bg-[#f5d2a8]" />
        <div className="absolute top-3.5 left-3 w-1 h-1 bg-black" />
        <div className="absolute top-3.5 left-5 w-1 h-1 bg-black" />
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

