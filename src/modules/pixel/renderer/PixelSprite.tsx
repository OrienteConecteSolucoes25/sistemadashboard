import { useState } from "react";
import { cn } from "@/lib/utils";
import { getSprite, type SpriteAsset } from "../core/sprites";

interface PixelSpriteProps {
  spriteKey: string | null | undefined;
  size?: number;
  className?: string;
  /** Override visual quando o sprite não existe no registry */
  fallback?: SpriteAsset | null;
}

/**
 * Renderiza um sprite do Pixel Office.
 *
 * - Se a key existir no registry E o arquivo .webp carregar → mostra a imagem.
 * - Caso contrário → mostra um placeholder em CSS (cor + glyph), pixel-perfect.
 *
 * Sem dependência externa, sem base64, sem GIF, sem rede paga.
 */
export const PixelSprite = ({ spriteKey, size = 64, className, fallback }: PixelSpriteProps) => {
  const sprite = getSprite(spriteKey) ?? fallback ?? null;
  const [errored, setErrored] = useState(false);

  if (!sprite) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-sm bg-muted text-muted-foreground text-xs font-mono",
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
      className={cn("relative overflow-hidden rounded-sm", className)}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
        background: sprite.placeholderColor,
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
          style={{ imageRendering: "pixelated", display: "block", width: "100%", height: "100%" }}
        />
      )}
      {!showImage && sprite.placeholderGlyph && (
        <div
          className="absolute inset-0 flex items-center justify-center font-mono font-bold text-white/90 select-none"
          style={{ fontSize: Math.max(12, Math.floor(size * 0.45)) }}
        >
          {sprite.placeholderGlyph}
        </div>
      )}
    </div>
  );
};
