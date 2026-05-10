import { OFFICE_THEME } from "../core/pixelOfficeTheme";
import { TILE_SIZE, STAGE_WIDTH_PX, STAGE_HEIGHT_PX } from "../core/constants";

/**
 * Decorações estáticas do escritório (plantas, quadro, divisórias).
 * Renderizadas via SVG inline absoluto. Sem interatividade —
 * `pointer-events: none` garante que cliques no chão continuem funcionando.
 */
export const PixelOfficeDecorations = () => {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {/* Parede superior pixel art */}
      <Wall />

      {/* Rótulos das Áreas */}
      <ZoneLabel label="Recepção" x={TILE_SIZE * 0.5} y={TILE_SIZE * 1.5} color={OFFICE_THEME.carpetReception} />
      <ZoneLabel label="Engenharia" x={TILE_SIZE * 7.5} y={TILE_SIZE * 1.5} color={OFFICE_THEME.carpetEngineer} />
      <ZoneLabel label="TI & Suporte" x={STAGE_WIDTH_PX - TILE_SIZE * 6.5} y={TILE_SIZE * 1.5} color={OFFICE_THEME.carpetIT} />
      <ZoneLabel label="Jurídico" x={TILE_SIZE * 6.5} y={STAGE_HEIGHT_PX - TILE_SIZE * 5.5} color={OFFICE_THEME.carpetLegal} />
      <ZoneLabel label="Espaço Café" x={TILE_SIZE * 0.5} y={STAGE_HEIGHT_PX - TILE_SIZE * 4.5} color={OFFICE_THEME.carpetCommon} />
      <ZoneLabel label="Sala de Reuniões" x={STAGE_WIDTH_PX - TILE_SIZE * 8.5} y={STAGE_HEIGHT_PX - TILE_SIZE * 7.5} color={OFFICE_THEME.carpetMeeting} />

      {/* Objetos Decorativos */}
      {/* Plantas */}
      <Plant style={{ left: TILE_SIZE * 5.5, top: TILE_SIZE * 1.2 }} />
      <Plant style={{ left: STAGE_WIDTH_PX - TILE_SIZE * 7.5, top: TILE_SIZE * 1.2 }} />
      <Plant style={{ left: TILE_SIZE * 0.4, top: STAGE_HEIGHT_PX - TILE_SIZE * 2.2 }} />
      <Plant style={{ left: STAGE_WIDTH_PX - TILE_SIZE * 1.6, top: STAGE_HEIGHT_PX - TILE_SIZE * 2.2 }} />
      
      {/* Bebedouro / Café */}
      <CoffeeMachine style={{ left: TILE_SIZE * 0.5, top: STAGE_HEIGHT_PX - TILE_SIZE * 1.5 }} />

      {/* Quadro/mural na parede */}
      <Board style={{ left: TILE_SIZE * 8, top: 4 }} />
      <Board style={{ left: STAGE_WIDTH_PX - TILE_SIZE * 4, top: 4 }} />

      {/* Divisórias Sutis */}
      <Divider x={TILE_SIZE * 6.5} y={TILE_SIZE} h={TILE_SIZE * 4} />
      <Divider x={STAGE_WIDTH_PX - TILE_SIZE * 7.5} y={TILE_SIZE} h={TILE_SIZE * 5} />
    </div>
  );
};

const ZoneLabel = ({ label, x, y, color }: { label: string; x: number; y: number; color: string }) => (
  <div
    className="absolute whitespace-nowrap text-[9px] font-bold uppercase tracking-tighter opacity-40"
    style={{ left: x, top: y, color }}
  >
    {label}
  </div>
);

const Divider = ({ x, y, h }: { x: number; y: number; h: number }) => (
  <div
    className="absolute"
    style={{
      left: x,
      top: y,
      width: 1,
      height: h,
      background: "rgba(255,255,255,0.08)",
      boxShadow: "1px 0 0 rgba(0,0,0,0.15)"
    }}
  />
);

const Wall = () => (
  <svg
    width={STAGE_WIDTH_PX}
    height={TILE_SIZE}
    shapeRendering="crispEdges"
    style={{ display: "block", imageRendering: "pixelated" }}
  >
    <rect width={STAGE_WIDTH_PX} height={TILE_SIZE} fill={OFFICE_THEME.wallSide} />
    <rect width={STAGE_WIDTH_PX} height={TILE_SIZE - 6} fill={OFFICE_THEME.wallTop} />
    <rect y={TILE_SIZE - 6} width={STAGE_WIDTH_PX} height={1} fill={OFFICE_THEME.wallTrim} opacity="0.5" />
    {/* Tijolos sutis */}
    {Array.from({ length: Math.ceil(STAGE_WIDTH_PX / 32) }).map((_, i) => (
      <rect key={i} x={i * 32} y={4} width={1} height={TILE_SIZE - 12} fill="rgba(0,0,0,0.25)" />
    ))}
  </svg>
);

const Plant = ({ style }: { style: React.CSSProperties }) => (
  <svg
    width={28}
    height={36}
    shapeRendering="crispEdges"
    className="absolute"
    style={{ ...style, imageRendering: "pixelated" }}
  >
    {/* Vaso */}
    <polygon points="6,28 22,28 20,36 8,36" fill={OFFICE_THEME.plantPot} />
    <rect x="6" y="26" width="16" height="3" fill="#3a1f0a" />
    {/* Folhas */}
    <ellipse cx="14" cy="16" rx="10" ry="12" fill={OFFICE_THEME.plantLeaf} />
    <ellipse cx="9" cy="14" rx="6" ry="8" fill="#5fae7a" />
    <ellipse cx="19" cy="14" rx="6" ry="8" fill="#2e6b46" />
    <ellipse cx="14" cy="10" rx="5" ry="6" fill="#7fc59a" />
  </svg>
);

const Board = ({ style }: { style: React.CSSProperties }) => (
  <svg
    width={80}
    height={28}
    shapeRendering="crispEdges"
    className="absolute"
    style={{ ...style, imageRendering: "pixelated" }}
  >
    <rect width="80" height="28" fill={OFFICE_THEME.boardFrame} />
    <rect x="2" y="2" width="76" height="24" fill={OFFICE_THEME.boardPaper} />
    <rect x="6" y="6" width="40" height="2" fill="#3a3a3a" />
    <rect x="6" y="11" width="60" height="2" fill="#3a3a3a" />
    <rect x="6" y="16" width="30" height="2" fill="#3a3a3a" />
    <rect x="6" y="21" width="50" height="2" fill="#a02a2a" />
  </svg>
);
