import { TILE_SIZE, STAGE_WIDTH_PX, STAGE_HEIGHT_PX } from "../core/constants";
import { OFFICE_THEME } from "../core/pixelOfficeTheme";
import { spriteEngine } from "../engine/spriteEngine";

/**
 * Piso do escritório — gradiente pseudo-iso + grade sutil de tiles.
 * Renderiza embaixo de tudo. Sem interação.
 */
export const PixelOfficeMap = () => {
  return (
    <div
      className="absolute inset-0"
      style={{ width: STAGE_WIDTH_PX, height: STAGE_HEIGHT_PX, background: OFFICE_THEME.floorBase }}
      aria-hidden="true"
    >
      {/* Grade sutil de tiles */}
      <div 
        className="absolute inset-0" 
        style={{
          backgroundImage: `
            linear-gradient(to right, ${OFFICE_THEME.floorTileLine} 1px, transparent 1px),
            linear-gradient(to bottom, ${OFFICE_THEME.floorTileLine} 1px, transparent 1px)
          `,
          backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`
        }} 
      />

      {/* Zonas visuais usando SVG para precisão pixelada */}
      <svg width={STAGE_WIDTH_PX} height={STAGE_HEIGHT_PX} viewBox={`0 0 ${STAGE_WIDTH_PX} ${STAGE_HEIGHT_PX}`} shapeRendering="crispEdges">
        {/* Recepção (Canto Superior Esquerdo) */}
        <rect x="0" y={TILE_SIZE} width={TILE_SIZE * 6} height={TILE_SIZE * 5} fill={OFFICE_THEME.carpetReception} fillOpacity="0.3" />
        
        {/* Área Comunitária / Café (Canto Inferior Esquerdo) */}
        <rect x="0" y={STAGE_HEIGHT_PX - TILE_SIZE * 5} width={TILE_SIZE * 5} height={TILE_SIZE * 5} fill={OFFICE_THEME.carpetCommon} fillOpacity="0.2" />
        
        {/* Área de Engenharia (Centro Superior) */}
        <rect x={TILE_SIZE * 7} y={TILE_SIZE} width={TILE_SIZE * 8} height={TILE_SIZE * 4} fill={OFFICE_THEME.carpetEngineer} fillOpacity="0.15" />
        
        {/* Área Jurídica (Centro Inferior) */}
        <rect x={TILE_SIZE * 6} y={STAGE_HEIGHT_PX - TILE_SIZE * 6} width={TILE_SIZE * 7} height={TILE_SIZE * 5} fill={OFFICE_THEME.carpetLegal} fillOpacity="0.15" />

        {/* Área TI (Direita Superior) */}
        <rect x={STAGE_WIDTH_PX - TILE_SIZE * 7} y={TILE_SIZE} width={TILE_SIZE * 7} height={TILE_SIZE * 5} fill={OFFICE_THEME.carpetIT} fillOpacity="0.15" />

        {/* Sala de Reunião (Direita Inferior - área demarcada) */}
        <rect x={STAGE_WIDTH_PX - TILE_SIZE * 9} y={STAGE_HEIGHT_PX - TILE_SIZE * 8} width={TILE_SIZE * 9} height={TILE_SIZE * 8} fill={OFFICE_THEME.carpetMeeting} fillOpacity="0.1" />
      </svg>

      {/* Vinheta para profundidade */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.3) 100%)",
        }}
      />
    </div>
  );
};
