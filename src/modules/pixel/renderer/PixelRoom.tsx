import { TILE_SIZE } from "../core/constants";
import { PixelRoomSprite } from "./PixelRoomSprite";
import { AvatarLayeredSprite } from "./AvatarLayeredSprite";
import { PixelModuleDashboard, type ModuleType } from "./PixelModuleDashboard";
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

const variantOf = (room: RoomLite): ModuleType | "common" => {
  const t = (room.room_type ?? "").toLowerCase();
  const k = (room.room_key ?? "").toLowerCase();
  if (t.includes("meeting") || k.includes("meeting")) return "finance"; // Financeiro cuida das reuniões importantes
  if (k.includes("engen") || k.includes("engineer")) return "engineering";
  if (k.includes("jurid") || k.includes("legal")) return "legal";
  if (k.includes("ti") || k.includes("tech") || k.includes("support")) return "ti";
  if (k.includes("rh") || k.includes("people") || k.includes("dp")) return "hr";
  return "common";
};

export const PixelRoom = ({ room, onClick, characters = [], meetings }: Props) => {
  const variant = variantOf(room);
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
        <PixelRoomSprite width={width} height={height} variant={variant} label={room.name} />
      </button>

      {/* Dashboard Flutuante do Módulo */}
      {variant !== "common" && (
        <PixelModuleDashboard type={variant as ModuleType} x={width - 20} y={-40} />
      )}

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
