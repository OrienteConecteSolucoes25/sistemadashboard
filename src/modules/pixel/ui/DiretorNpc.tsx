import { useState } from "react";
import { Sparkles } from "lucide-react";

/**
 * Personagem pixel-art "Diretor OCS" estático que fica no canto do mapa
 * e abre o chat ao ser clicado. Usa apenas CSS — sem dependências externas.
 */
export function DiretorNpc({ onClick }: { onClick: () => void }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label="Falar com o Diretor de Comunicação OCS"
      className="absolute bottom-4 right-4 z-30 flex flex-col items-center group"
      style={{ imageRendering: "pixelated" }}
    >
      {/* Balão de fala */}
      <div
        className={`mb-1 px-2 py-1 rounded-md bg-card border text-[10px] font-display whitespace-nowrap shadow-md transition-all ${
          hover ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
        }`}
      >
        <Sparkles className="inline h-3 w-3 text-primary mr-1" />
        Diretor OCS — clique para conversar
      </div>

      {/* Sprite pixel art (40×56) */}
      <div className="relative w-10 h-14 group-hover:scale-110 transition-transform">
        {/* sombra */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-black/30 rounded-full blur-[1px]" />
        {/* cabelo */}
        <div className="absolute top-0 left-1 w-8 h-3 bg-[#2a1a0f] rounded-t-sm" />
        {/* rosto */}
        <div className="absolute top-2 left-1.5 w-7 h-5 bg-[#f5d2a8]" />
        {/* olhos */}
        <div className="absolute top-3.5 left-3 w-1 h-1 bg-black" />
        <div className="absolute top-3.5 left-5 w-1 h-1 bg-black" />
        {/* sorriso */}
        <div className="absolute top-5 left-3.5 w-3 h-0.5 bg-black/70 rounded" />
        {/* corpo / camisa teal (Oriente) */}
        <div className="absolute top-7 left-0.5 w-9 h-4 bg-primary" />
        {/* gravata */}
        <div className="absolute top-7 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-primary-foreground/80" />
        {/* calça */}
        <div className="absolute top-11 left-1.5 w-7 h-3 bg-[#1a1f26]" />
        {/* indicador animado */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse ring-2 ring-background" />
      </div>
    </button>
  );
}
