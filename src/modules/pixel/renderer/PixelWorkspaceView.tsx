import { useMemo } from "react";
import {
  STAGE_HEIGHT_PX,
  STAGE_WIDTH_PX,
  STAGE_HEIGHT_TILES,
  STAGE_WIDTH_TILES,
  TILE_SIZE,
} from "../core/constants";
import { PixelAvatar } from "../renderer/PixelAvatar";
import { PixelDesk } from "../renderer/PixelDesk";
import { PixelRoom } from "../renderer/PixelRoom";
import type {
  PixelCharacter,
  DeskLite,
  RoomLite,
  WorkspaceLite,
} from "../data/usePixelWorkspaceData";

interface Props {
  workspace: WorkspaceLite;
  characters: PixelCharacter[];
  desks: DeskLite[];
  rooms: RoomLite[];
  onSelectCharacter: (c: PixelCharacter) => void;
  onSelectDesk: (d: DeskLite) => void;
}

/**
 * Camada visual ATUAL (CSS/divs absolutos).
 * Toda lógica de dados/permissão fica fora — esta camada só renderiza.
 * Para migrar para PixiJS/Phaser depois basta substituir esta view por uma
 * implementação que receba as mesmas props.
 */
export const PixelWorkspaceView = ({
  workspace,
  characters,
  desks,
  rooms,
  onSelectCharacter,
  onSelectDesk,
}: Props) => {
  const grid = useMemo(() => {
    // grid pixel-art em CSS
    return {
      backgroundImage:
        "linear-gradient(to right, hsl(var(--border) / 0.4) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.4) 1px, transparent 1px)",
      backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`,
    } as React.CSSProperties;
  }, []);

  return (
    <div className="overflow-auto rounded-lg border bg-card">
      <div
        className="relative"
        style={{
          width: STAGE_WIDTH_PX,
          height: STAGE_HEIGHT_PX,
          ...grid,
        }}
        aria-label={`Workspace ${workspace.name} (${STAGE_WIDTH_TILES}x${STAGE_HEIGHT_TILES})`}
      >
        {/* Salas (atrás) */}
        {rooms.map((r) => (
          <PixelRoom key={r.id} room={r} />
        ))}

        {/* Mesas */}
        {desks.map((d) => (
          <PixelDesk key={d.id} desk={d} onClick={onSelectDesk} />
        ))}

        {/* Personagens */}
        {characters
          .filter((c) => c.is_visible && !c.is_blocked)
          .map((c) => (
            <PixelAvatar key={c.user_id} character={c} onClick={onSelectCharacter} />
          ))}
      </div>
    </div>
  );
};
