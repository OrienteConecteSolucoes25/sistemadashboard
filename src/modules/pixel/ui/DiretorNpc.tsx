import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

/**
 * Diretor OCS — NPC pixel-art que **anda** pela base do mapa e periodicamente
 * **senta** na mesa dele (canto inferior direito). Clique abre o chat.
 */
export function DiretorNpc({ onClick }: { onClick: () => void }) {
  const [hover, setHover] = useState(false);
  // x em % da largura do container; pose: walk-l, walk-r, sit
  const [x, setX] = useState(70);
  const [pose, setPose] = useState<"walk-l" | "walk-r" | "sit">("walk-r");
  const [bob, setBob] = useState(0);
  const timer = useRef<number | null>(null);

  // Roteiro de movimentação
  useEffect(() => {
    const seq: Array<{ pose: "walk-l" | "walk-r" | "sit"; x: number; dur: number }> = [
      { pose: "walk-r", x: 88, dur: 5000 },  // anda até a mesa
      { pose: "sit",    x: 92, dur: 9000 },  // senta na cadeira
      { pose: "walk-l", x: 55, dur: 6000 },  // dá uma volta
      { pose: "walk-r", x: 75, dur: 5000 },
      { pose: "sit",    x: 92, dur: 7000 },
      { pose: "walk-l", x: 40, dur: 7000 },
      { pose: "walk-r", x: 70, dur: 5000 },
    ];
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
  }, []);

  // Animação de "bob" (pulinho) durante caminhada
  useEffect(() => {
    if (pose === "sit") { setBob(0); return; }
    const id = window.setInterval(() => setBob((b) => (b === 0 ? -2 : 0)), 220);
    return () => clearInterval(id);
  }, [pose]);

  const flip = pose === "walk-l" ? "scaleX(-1)" : "scaleX(1)";
  const sitting = pose === "sit";

  return (
    <>
      {/* Mesa + cadeira do Diretor (canto inferior direito) */}
      <div
        className="absolute z-20 pointer-events-none"
        style={{ right: "1.5%", bottom: "0.5rem", imageRendering: "pixelated" }}
      >
        {/* cadeira */}
        <div className="relative w-6 h-8 inline-block align-bottom mr-0.5">
          <div className="absolute bottom-0 left-0 w-6 h-2 bg-[#1a1f26]" />
          <div className="absolute bottom-2 left-1 w-4 h-1 bg-[#2a2f36]" />
          <div className="absolute bottom-3 left-1.5 w-3 h-5 bg-[#1a1f26] rounded-t-sm" />
        </div>
        {/* mesa */}
        <div className="relative w-14 h-8 inline-block align-bottom">
          <div className="absolute bottom-0 left-0 w-14 h-1 bg-[#3a2410]" />
          <div className="absolute bottom-1 left-1 w-1.5 h-6 bg-[#3a2410]" />
          <div className="absolute bottom-1 right-1 w-1.5 h-6 bg-[#3a2410]" />
          <div className="absolute bottom-7 left-0 w-14 h-1.5 bg-[#5a3520]" />
          {/* monitorzinho */}
          <div className="absolute bottom-8 left-3 w-4 h-3 bg-[#0f172a] border border-[#2a2f36]" />
          <div className="absolute bottom-9 left-3.5 w-3 h-2 bg-primary/70" />
          {/* xícara */}
          <div className="absolute bottom-8 right-2 w-1.5 h-2 bg-primary rounded-b-sm" />
        </div>
      </div>

      {/* Diretor (NPC clicável) */}
      <button
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label="Falar com o Diretor de Comunicação OCS"
        className="absolute z-30 flex flex-col items-center group cursor-pointer"
        style={{
          left: `${x}%`,
          bottom: sitting ? "1.25rem" : "0.5rem",
          transform: `translateX(-50%) translateY(${bob}px)`,
          transition: "left 4.5s linear, bottom 0.4s ease, transform 0.2s ease",
          imageRendering: "pixelated",
        }}
      >
        {/* Balão */}
        <div
          className={`mb-1 px-2 py-1 rounded-md bg-card border text-[10px] font-display whitespace-nowrap shadow-md transition-all ${
            hover ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
          }`}
        >
          <Sparkles className="inline h-3 w-3 text-primary mr-1" />
          Diretor OCS — clique para conversar
        </div>

        {/* Sprite (espelhado conforme direção) */}
        <div
          className="relative w-10 h-14 group-hover:scale-110 transition-transform"
          style={{ transform: flip }}
        >
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-black/30 rounded-full blur-[1px]" />
          <div className="absolute top-0 left-1 w-8 h-3 bg-[#2a1a0f] rounded-t-sm" />
          <div className="absolute top-2 left-1.5 w-7 h-5 bg-[#f5d2a8]" />
          <div className="absolute top-3.5 left-3 w-1 h-1 bg-black" />
          <div className="absolute top-3.5 left-5 w-1 h-1 bg-black" />
          <div className="absolute top-5 left-3.5 w-3 h-0.5 bg-black/70 rounded" />
          <div className="absolute top-7 left-0.5 w-9 h-4 bg-primary" />
          <div className="absolute top-7 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-primary-foreground/80" />
          {/* Pernas: sentado fica encolhido */}
          {sitting ? (
            <div className="absolute top-11 left-1.5 w-7 h-2 bg-[#1a1f26]" />
          ) : (
            <>
              <div className="absolute top-11 left-1.5 w-3 h-3 bg-[#1a1f26]" />
              <div className="absolute top-11 right-1.5 w-3 h-3 bg-[#1a1f26]" />
            </>
          )}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse ring-2 ring-background" />
        </div>
      </button>
    </>
  );
}
