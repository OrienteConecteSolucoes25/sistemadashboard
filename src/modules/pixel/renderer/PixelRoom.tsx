import { TILE_SIZE } from "../core/constants";
import type { RoomLite } from "../data/usePixelWorkspaceData";

interface Props {
  room: RoomLite;
  onClick?: (r: RoomLite) => void;
}

const sizeForCapacity = (cap: number) => {
  // 2x2 tiles para até 4, 3x3 até 8, 4x4 acima
  if (cap <= 4) return { w: 2, h: 2 };
  if (cap <= 8) return { w: 3, h: 3 };
  return { w: 4, h: 4 };
};

export const PixelRoom = ({ room, onClick }: Props) => {
  const { w, h } = sizeForCapacity(room.capacity);
  return (
    <button
      type="button"
      onClick={() => onClick?.(room)}
      className="absolute border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors rounded-md text-left"
      style={{
        left: room.position_x * TILE_SIZE,
        top: room.position_y * TILE_SIZE,
        width: w * TILE_SIZE,
        height: h * TILE_SIZE,
      }}
      title={room.name}
    >
      <span className="absolute top-1 left-1 text-[10px] font-mono uppercase text-primary bg-background/80 px-1 rounded">
        {room.name}
      </span>
    </button>
  );
};
