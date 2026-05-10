import { TILE_SIZE } from "../core/constants";
import { PixelRoomSprite } from "./PixelRoomSprite";
import { AvatarLayeredSprite } from "./AvatarLayeredSprite";
import type { RoomLite, PixelCharacter } from "../data/usePixelWorkspaceData";

interface Props {
  room: RoomLite;
  onClick?: (r: RoomLite) => void;
  characters?: PixelCharacter[];
  meetings?: any;
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

export const PixelRoom = ({ room, onClick, characters = [], meetings }: Props) => {
  const { w, h } = sizeForCapacity(room.capacity);
  const width = w * TILE_SIZE;
  const height = h * TILE_SIZE;

  // Encontra reunião ativa nesta sala
  const activeMeeting = meetings?.meetings?.find((m: any) => m.room_id === room.id && m.status === "active");
  const participants = activeMeeting
    ? characters.filter(c => 
        activeMeeting.participants?.some((p: any) => p.user_id === c.user_id && p.status === "joined")
      )
    : [];

  return (
    <div
      className="w-full h-full"
      style={{
        width,
        height,
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(room);
        }}
        className="w-full h-full focus:outline-none"
        title={room.name}
      >
        <PixelRoomSprite width={width} height={height} variant={variantOf(room)} label={room.name} />
      </button>

      {/* Mini cena de reunião */}
      {participants.length > 0 && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-full h-full">
            {participants.map((p, i) => {
              // Posiciona em círculo ao redor do centro
              const angle = (i / participants.length) * Math.PI * 2;
              const radius = Math.min(width, height) / 4;
              const x = width / 2 + Math.cos(angle) * radius - 12;
              const y = height / 2 + Math.sin(angle) * radius - 16;
              return (
                <div key={p.user_id} className="absolute" style={{ left: x, top: y }}>
                  <AvatarLayeredSprite customization={p.customization} size={24} />
                </div>
              );
            })}
            <div className="absolute top-1 right-1 bg-red-500 text-white text-[8px] px-1 rounded-sm animate-pulse">
              EM REUNIÃO
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
