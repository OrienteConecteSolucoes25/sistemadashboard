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
  /** Posições efetivas (com overrides locais de movimento). */
  getPosition: (userId: string, fallback: { x: number; y: number }) => { x: number; y: number };
  onSelectCharacter: (c: PixelCharacter) => void;
  onSelectDesk: (d: DeskLite) => void;
  /** Clique em ponto livre (em coordenadas de tile). */
  onStageClick: (tileX: number, tileY: number) => void;
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
  getPosition,
  onSelectCharacter,
  onSelectDesk,
  onStageClick,
}: Props) => {
  const grid = useMemo(() => {
    return {
      backgroundImage:
        "linear-gradient(to right, hsl(var(--border) / 0.4) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.4) 1px, transparent 1px)",
      backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`,
    } as React.CSSProperties;
  }, []);

  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const tileX = Math.floor(px / TILE_SIZE);
    const tileY = Math.floor(py / TILE_SIZE);
    onStageClick(tileX, tileY);
  };

  return (
    <div className="overflow-auto rounded-lg border bg-card">
      <div
        className="relative cursor-pointer"
        style={{
          width: STAGE_WIDTH_PX,
          height: STAGE_HEIGHT_PX,
          ...grid,
        }}
        aria-label={`Workspace ${workspace.name} (${STAGE_WIDTH_TILES}x${STAGE_HEIGHT_TILES})`}
        onClick={handleStageClick}
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
          .map((c) => {
            const pos = getPosition(c.user_id, { x: c.position_x, y: c.position_y });
            return (
              <PixelAvatar
                key={c.user_id}
                character={c}
                posX={pos.x}
                posY={pos.y}
                onClick={onSelectCharacter}
              />
            );
          })}
      </div>
    </div>
  );
};
