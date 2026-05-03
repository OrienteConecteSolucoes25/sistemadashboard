import { TILE_SIZE, STATUS_LABEL, type PixelStatus } from "../core/constants";
import { roleFromSpriteKey, ROLE_PALETTES } from "../core/pixelOfficeTheme";
import { PixelAvatarSprite } from "./PixelAvatarSprite";
import { PixelStatusBadge } from "./PixelStatusBadge";
import type { PixelCharacter } from "../data/usePixelWorkspaceData";

interface Props {
  character: PixelCharacter;
  posX?: number;
  posY?: number;
  onClick?: (c: PixelCharacter) => void;
}

const AVATAR_SIZE = 56;

export const PixelAvatar = ({ character, posX, posY, onClick }: Props) => {
  const status = (character.status as PixelStatus) ?? "offline";
  const x = posX ?? character.position_x;
  const y = posY ?? character.position_y;
  // Centraliza o sprite no tile clicado
  const left = x * TILE_SIZE + TILE_SIZE / 2 - AVATAR_SIZE / 2;
  const top = y * TILE_SIZE + TILE_SIZE - AVATAR_SIZE; // pés no chão do tile
  const role = roleFromSpriteKey(character.avatar_sprite_key);
  const palette = ROLE_PALETTES[role];

  const faded = status === "away";
  const grayscale = status === "offline";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(character);
      }}
      className="absolute group focus:outline-none rounded-md"
      style={{
        left,
        top,
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        transition: "transform 600ms cubic-bezier(0.4, 0, 0.2, 1), left 600ms cubic-bezier(0.4, 0, 0.2, 1), top 600ms cubic-bezier(0.4, 0, 0.2, 1)",
        willChange: "left, top",
      }}
      aria-label={`Personagem ${character.display_name ?? ""}`}
    >
      <div className="relative w-full h-full">
        <PixelAvatarSprite role={role} size={AVATAR_SIZE} faded={faded} grayscale={grayscale} />

        {/* Indicador de status discreto */}
        <span className="absolute -top-1 -right-1">
          <PixelStatusBadge status={status} />
        </span>
      </div>

      {/* Etiqueta de nome — sempre visível e elegante */}
      <div
        className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold px-2 py-0.5 rounded-full pointer-events-none shadow-sm"
        style={{
          background: "rgba(15, 12, 25, 0.8)",
          color: "#fff",
          border: `1px solid ${palette.badge}`,
        }}
      >
        {character.display_name ?? "—"}
      </div>

      {/* Tooltip detalhado no hover */}
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] px-2 py-0.5 rounded-md bg-background/95 border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {STATUS_LABEL[status]}
      </div>
    </button>
  );
};
