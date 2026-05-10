import React, { memo } from "react";
import { Briefcase } from "lucide-react";
import { TILE_SIZE } from "../core/constants";
import { deskKindFromKey } from "../core/pixelOfficeTheme";
import { PixelDeskSprite } from "./PixelDeskSprite";
import type { DeskLite } from "../data/usePixelWorkspaceData";

interface Props {
  desk: DeskLite;
  onClick?: (d: DeskLite) => void;
}

export const PixelDesk = memo(({ desk, onClick }: Props) => {
  const kind = deskKindFromKey(
    (desk as any).asset_key ?? null,
    desk.desk_type,
  );
  const isMeeting = kind === "meeting";
  const tilesW = isMeeting ? 4 : 2;
  const tilesH = isMeeting ? 3 : 1.5;
  const w = tilesW * TILE_SIZE;
  const h = tilesH * TILE_SIZE;

  const left = desk.position_x * TILE_SIZE;
  const top = desk.position_y * TILE_SIZE;
  const isWorking = desk.owner_current_action === "working";
  const isOccupied = desk.owner_is_sitting === true;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(desk);
      }}
      className="group focus:outline-none w-full h-full"
      style={{
        width: w,
        height: h,
      }}
      aria-label={`Mesa ${desk.desk_name ?? ""}`}
      title={desk.desk_name ?? "Mesa"}
    >
      <PixelDeskSprite kind={kind} width={w} height={h} />

      {isWorking && (
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground border-2 border-background"
          title="Trabalhando"
        >
          <Briefcase className="w-2.5 h-2.5" />
        </span>
      )}
      {isOccupied && !isWorking && (
        <span
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-background"
          title="Ocupada"
        />
      )}

      {desk.owner_display_name && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-medium px-1.5 py-0.5 rounded bg-background/85 border opacity-70 group-hover:opacity-100 pointer-events-none">
          {desk.owner_display_name}
        </div>
      )}
    </button>
  );
});
