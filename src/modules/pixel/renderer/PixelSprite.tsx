import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getSprite, type SpriteAsset } from "../core/sprites";

interface PixelSpriteProps {
  spriteKey: string | null | undefined;
  size?: number;
  className?: string;
  /** Override visual quando o sprite não existe no registry */
  fallback?: SpriteAsset | null;
  /** Efeito de brilho pulsante */
  glow?: boolean;
}

/**
 * Renderiza um sprite do Pixel Office.
 *
 * - Se a key existir no registry E o arquivo .webp carregar → mostra a imagem.
 * - Caso contrário → mostra um placeholder em CSS (cor + glyph), pixel-perfect.
 */
export const PixelSprite = ({ spriteKey, size = 64, className, fallback, glow }: PixelSpriteProps) => {
  const sprite = getSprite(spriteKey) ?? fallback ?? null;
  const [errored, setErrored] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (!sprite) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-sm bg-muted text-muted-foreground text-xs font-mono border-2 border-dashed border-muted-foreground/30",
          className,
        )}
        style={{ width: size, height: size }}
        aria-label="sprite ausente"
      >
        ?
      </div>
    );
  }

  const showImage = !errored;

  return (
    <div
      className={cn(
        "relative transition-all duration-300",
        glow && "animate-pulse",
        isHovered && "scale-105 z-10",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
        background: errored ? `linear-gradient(135deg, ${sprite.placeholderColor}, ${adjustBrightness(sprite.placeholderColor, -20)})` : "transparent",
      }}
      aria-label={sprite.label}
    >

      {showImage && (
        <img
          src={sprite.src}
          alt={sprite.label}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setErrored(true)}
          style={{ 
            imageRendering: "pixelated", 
            display: "block", 
            width: "100%", 
            height: "100%",
            filter: isHovered ? "brightness(1.1) drop-shadow(0 0 2px rgba(255,255,255,0.5))" : undefined
          }}
        />
      )}
      
      {!showImage && sprite.placeholderGlyph && (
        <div
          className="absolute inset-0 flex items-center justify-center font-mono font-bold text-white select-none"
          style={{ 
            fontSize: Math.max(12, Math.floor(size * 0.45)),
            textShadow: "1px 1px 0 rgba(0,0,0,0.5)"
          }}
        >
          {sprite.placeholderGlyph}
        </div>
      )}

      {/* Border Highlight */}
      <div className="absolute inset-0 border border-white/20 pointer-events-none rounded-sm" />
    </div>
  );
};

// Helper simples para ajustar brilho de HSL (usado nos sprites)
function adjustBrightness(hsl: string, amount: number): string {
  if (!hsl.startsWith("hsl")) return hsl;
  try {
    const parts = hsl.match(/\d+/g);
    if (!parts || parts.length < 3) return hsl;
    const h = parts[0];
    const s = parts[1];
    const l = Math.max(0, Math.min(100, parseInt(parts[2]) + amount));
    return `hsl(${h} ${s}% ${l}%)`;
  } catch (e) {
    return hsl;
  }
}

