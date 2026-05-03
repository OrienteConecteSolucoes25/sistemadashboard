import { TILE_SIZE } from "../core/constants";
import { PixelRoomSprite } from "./PixelRoomSprite";
import type { RoomLite } from "../data/usePixelWorkspaceData";

interface Props {
  room: RoomLite;
  onClick?: (r: RoomLite) => void;
}

const sizeForCapacity = (cap: number) => {
  if (cap <= 4) return { w: 3, h: 3 };
  if (cap <= 8) return { w: 4, h: 4 };
  return { w: 5, h: 4 };
};

const variantOf = (room: RoomLite): "meeting" | "engineering" | "legal" | "common" => {
  const t = (room.room_type ?? "").toLowerCase();
  const k = (room.room_key ?? "").toLowerCase();
  if (t.includes("meeting") || k.includes("meeting")) return "meeting";
  if (k.includes("engen") || k.includes("engineer")) return "engineering";
  if (k.includes("jurid") || k.includes("legal")) return "legal";
  return "common";
};

export const PixelRoom = ({ room, onClick }: Props) => {
  const { w, h } = sizeForCapacity(room.capacity);
  const width = w * TILE_SIZE;
  const height = h * TILE_SIZE;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(room);
      }}
      className="absolute focus:outline-none"
      style={{
        left: room.position_x * TILE_SIZE,
        top: room.position_y * TILE_SIZE,
        width,
        height,
      }}
      title={room.name}
    >
      <PixelRoomSprite width={width} height={height} variant={variantOf(room)} label={room.name} />
    </button>
  );
};
