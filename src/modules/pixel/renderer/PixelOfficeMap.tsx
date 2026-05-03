import { TILE_SIZE, STAGE_WIDTH_PX, STAGE_HEIGHT_PX } from "../core/constants";
import { OFFICE_THEME } from "../core/pixelOfficeTheme";

/**
 * Piso do escritório — gradiente pseudo-iso + grade sutil de tiles.
 * Renderiza embaixo de tudo. Sem interação.
 */
export const PixelOfficeMap = () => {
  const tileGrid: React.CSSProperties = {
    backgroundImage: `
      linear-gradient(135deg, ${OFFICE_THEME.floorBase} 0%, ${OFFICE_THEME.floorAlt} 100%),
      linear-gradient(to right, ${OFFICE_THEME.floorTileLine} 1px, transparent 1px),
      linear-gradient(to bottom, ${OFFICE_THEME.floorTileLine} 1px, transparent 1px)
    `,
    backgroundSize: `100% 100%, ${TILE_SIZE}px ${TILE_SIZE}px, ${TILE_SIZE}px ${TILE_SIZE}px`,
    backgroundBlendMode: "normal, overlay, overlay",
  };

  return (
    <div
      className="absolute inset-0"
      style={{ width: STAGE_WIDTH_PX, height: STAGE_HEIGHT_PX, ...tileGrid }}
      aria-hidden="true"
    >
      {/* Vinheta para profundidade */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.45) 100%)",
        }}
      />
    </div>
  );
};
