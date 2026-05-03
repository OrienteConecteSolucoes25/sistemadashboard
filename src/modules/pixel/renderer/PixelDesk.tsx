import { Briefcase } from "lucide-react";
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
  const spriteKey = desk.desk_type === "meeting" ? "meeting_table" : "desk_admin";
  const isWorking = desk.owner_current_action === "working";
  const isOccupied = desk.owner_is_sitting === true;

  return (
    <button
      type="button"
      onClick={() => onClick?.(desk)}
      className="absolute group focus:outline-none focus:ring-2 focus:ring-primary rounded-sm"
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

      {/* Ícone de "trabalhando" */}
      {isWorking && (
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground border-2 border-background"
          title="Trabalhando"
        >
          <Briefcase className="w-2.5 h-2.5" />
        </span>
      )}

      {/* Indicador ocupado (sentado mas não trabalhando) */}
      {isOccupied && !isWorking && (
        <span
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-background"
          title="Ocupada"
        />
      )}

      {/* Nome do dono */}
      {desk.owner_display_name && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium px-1.5 py-0.5 rounded bg-background/90 border opacity-80 group-hover:opacity-100 pointer-events-none">
          {desk.owner_display_name}
        </div>
      )}
    </button>
  );
};
