import { useEffect, useState, useRef, memo } from "react";
import { TILE_SIZE, STATUS_LABEL, type PixelStatus } from "../core/constants";
import { spriteEngine } from "../engine/spriteEngine";
import { roleFromSpriteKey, ROLE_PALETTES } from "../core/pixelOfficeTheme";
import { AvatarLayeredSprite } from "./AvatarLayeredSprite";
import { PixelStatusBadge } from "./PixelStatusBadge";
import type { PixelCharacter } from "../data/usePixelWorkspaceData";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { Smile } from "lucide-react";

interface Props {
  character: PixelCharacter;
  posX?: number;
  posY?: number;
  onClick?: (c: PixelCharacter) => void;
  recentMessage?: string | null;
  isTyping?: boolean;
}

const AVATAR_SIZE = 72; // altura do sprite — largura acompanha 2:3 (≈48px)
const AVATAR_WIDTH = Math.round(AVATAR_SIZE * (16 / 24));

export const PixelAvatar = memo(({ character, posX, posY, onClick, recentMessage, isTyping, hideName }: Props & { hideName?: boolean }) => {
  const status = (character.status as PixelStatus) ?? "offline";
  const x = posX ?? character.position_x;
  const y = posY ?? character.position_y;
  
  // Track direction
  const [direction, setDirection] = useState<"left" | "right">("right");
  const prevX = useRef(x);

  useEffect(() => {
    if (x > prevX.current) setDirection("right");
    else if (x < prevX.current) setDirection("left");
    prevX.current = x;
  }, [x]);

  const isWalking = character.current_action === "walking";

  // Centraliza o sprite no tile clicado usando spriteEngine
  const left = spriteEngine.tileToPixel(x) + TILE_SIZE / 2 - AVATAR_WIDTH / 2;
  const top = spriteEngine.tileToPixel(y) + TILE_SIZE - AVATAR_SIZE; // pés no chão do tile
  const zIndex = spriteEngine.calculateZIndex(y, 100);
  const role = roleFromSpriteKey(character.avatar_sprite_key);
  const palette = ROLE_PALETTES[role];

  const faded = status === "away";
  const grayscale = !character.is_online || status === "offline";

  return (
    <div 
      className="absolute" 
      style={{ 
        left, 
        top,
        zIndex,
        transition: "left 600ms cubic-bezier(0.4, 0, 0.2, 1), top 600ms cubic-bezier(0.4, 0, 0.2, 1)",
        willChange: "transform, left, top",
        transform: "translateZ(0)", // GPU acceleration
      }}
    >
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(character);
            }}
            className="group focus:outline-none bg-transparent border-0 p-0"
            style={{
              width: AVATAR_WIDTH,
              height: AVATAR_SIZE,
              transition: "transform 600ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            aria-label={`Personagem ${character.display_name ?? ""}`}
          >
            <div className="relative w-full h-full">
              <AvatarLayeredSprite customization={character.customization} size={AVATAR_SIZE} faded={faded} grayscale={grayscale} direction={direction} isWalking={isWalking} />

              <AnimatePresence>
                {recentMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-2 py-1 rounded-lg shadow-xl text-[10px] font-medium border whitespace-nowrap z-50 max-w-[120px] truncate"
                  >
                    {recentMessage}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b border-r rotate-45" />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {isTyping && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-0.5 bg-black/50 px-1.5 py-1 rounded-full border border-white/20">
                  <div className="w-1 h-1 bg-white rounded-full animate-bounce" />
                  <div className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}

              {/* Quick Emojis - Mocked for now */}
              <div className="absolute -right-8 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {['👍', '🔥', '☕'].map(emoji => (
                  <button 
                    key={emoji}
                    className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-xs shadow hover:scale-110 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Logic for sending quick emoji
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Indicador de status discreto */}
              <span className="absolute -top-1 -right-1">
                <PixelStatusBadge status={character.is_online ? status : "offline"} />
              </span>
            </div>

            {/* Etiqueta de nome — condicional por proximidade */}
            {!hideName && (
              <div
                className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold px-2 py-0.5 rounded-full pointer-events-none shadow-sm transition-opacity duration-300 flex items-center gap-1"
                style={{
                  background: character.avatar_sprite_key?.includes("visitant") ? "rgba(59, 130, 246, 0.9)" : "rgba(15, 12, 25, 0.8)",
                  color: "#fff",
                  border: character.avatar_sprite_key?.includes("visitant") ? `1px solid #60a5fa` : `1px solid ${palette.badge}`,
                }}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${character.is_online ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
                {character.display_name ?? "—"}
                {character.avatar_sprite_key?.includes("visitant") && (
                  <span className="ml-1 text-[7px] bg-white/20 px-1 rounded uppercase">Visitante</span>
                )}
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="font-bold">{character.display_name}</div>
          <div className="opacity-80">{STATUS_LABEL[character.is_online ? status : "offline"]}</div>
          {character.is_online ? (
            <div className="text-[10px] text-green-500 font-mono mt-1">● ONLINE</div>
          ) : (
            <div className="text-[10px] text-muted-foreground font-mono mt-1">OFFLINE</div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
    </div>
  );
});
