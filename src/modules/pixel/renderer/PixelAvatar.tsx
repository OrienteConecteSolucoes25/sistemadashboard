import { PixelSprite } from "./PixelSprite";
import { TILE_SIZE, STATUS_COLOR, STATUS_LABEL, type PixelStatus } from "../core/constants";
import type { PixelCharacter } from "../data/usePixelWorkspaceData";

interface Props {
  character: PixelCharacter;
  /** Posição efetiva (sobrescrita por movimento local, se houver). */
  posX?: number;
  posY?: number;
  onClick?: (c: PixelCharacter) => void;
}

export const PixelAvatar = ({ character, posX, posY, onClick }: Props) => {
  const status = (character.status as PixelStatus) ?? "offline";
  const x = posX ?? character.position_x;
  const y = posY ?? character.position_y;
  const left = x * TILE_SIZE;
  const top = y * TILE_SIZE;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(character);
      }}
      className="absolute group focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
      style={{
        left,
        top,
        width: TILE_SIZE * 2,
        height: TILE_SIZE * 2,
        transition: "left 600ms ease-in-out, top 600ms ease-in-out",
        willChange: "left, top",
      }}
      aria-label={`Personagem ${character.display_name ?? ""}`}
    >
      {/* Sprite */}
      <div className="w-full h-full">
        <PixelSprite spriteKey={character.avatar_sprite_key} size={TILE_SIZE * 2} />
      </div>

      {/* Status dot */}
      <span
        className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background"
        style={{ background: STATUS_COLOR[status] }}
        title={STATUS_LABEL[status]}
      />

      {/* Name + status (hover) */}
      <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium px-1.5 py-0.5 rounded bg-background/90 border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {character.display_name ?? "—"}
        <span className="ml-1 text-muted-foreground">· {STATUS_LABEL[status]}</span>
      </div>
    </button>
  );
};
