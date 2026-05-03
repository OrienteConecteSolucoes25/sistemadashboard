import { PixelSprite } from "./PixelSprite";
import { TILE_SIZE } from "../core/constants";
import type { DeskLite } from "../data/usePixelWorkspaceData";

interface Props {
  desk: DeskLite;
  onClick?: (d: DeskLite) => void;
}

export const PixelDesk = ({ desk, onClick }: Props) => {
  const left = desk.position_x * TILE_SIZE;
  const top = desk.position_y * TILE_SIZE;
  const spriteKey =
    desk.desk_type === "meeting" ? "meeting_table" : "desk_admin";

  return (
    <button
      type="button"
      onClick={() => onClick?.(desk)}
      className="absolute focus:outline-none focus:ring-2 focus:ring-primary rounded-sm"
      style={{
        left,
        top,
        width: TILE_SIZE * 2,
        height: TILE_SIZE,
        transform: desk.rotation ? `rotate(${desk.rotation}deg)` : undefined,
      }}
      aria-label={`Mesa ${desk.desk_name ?? ""}`}
      title={desk.desk_name ?? "Mesa"}
    >
      <PixelSprite spriteKey={spriteKey} size={TILE_SIZE * 2} className="!h-8" />
    </button>
  );
};
