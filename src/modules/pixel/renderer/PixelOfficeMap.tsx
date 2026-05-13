import { TILE_SIZE, STAGE_WIDTH_PX, STAGE_HEIGHT_PX } from "../core/constants";
import { OFFICE_THEME } from "../core/pixelOfficeTheme";
import { OFFICE_ZONES, zonePx } from "../core/officeZones";
import { spriteEngine } from "../engine/spriteEngine";

/**
 * Piso do escritório (Leva 3): 9 zonas nomeadas + paredes laterais + iluminação.
 * Quando o renderer Pixi está ativo, devolve apenas o container alvo.
 */
export const PixelOfficeMap = () => {
  const isPixi = spriteEngine.getRenderer() === "pixi";
  if (isPixi) {
    return <div id="pixi-container" className="absolute inset-0" />;
  }

  return (
    <div
      className="absolute inset-0"
      style={{ width: STAGE_WIDTH_PX, height: STAGE_HEIGHT_PX, background: OFFICE_THEME.floorBase }}
      aria-hidden="true"
    >
      {/* Grade sutil */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, ${OFFICE_THEME.floorTileLine} 1px, transparent 1px),
            linear-gradient(to bottom, ${OFFICE_THEME.floorTileLine} 1px, transparent 1px)
          `,
          backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`,
        }}
      />

      <svg
        width={STAGE_WIDTH_PX}
        height={STAGE_HEIGHT_PX}
        viewBox={`0 0 ${STAGE_WIDTH_PX} ${STAGE_HEIGHT_PX}`}
        shapeRendering="crispEdges"
        className="absolute inset-0"
      >
        {/* Tapetes setoriais com checker bem sutil via pattern */}
        <defs>
          <pattern id="checker" width="16" height="16" patternUnits="userSpaceOnUse">
            <rect width="16" height="16" fill="rgba(255,255,255,0)" />
            <rect width="8" height="8" fill="rgba(255,255,255,0.025)" />
            <rect x="8" y="8" width="8" height="8" fill="rgba(255,255,255,0.025)" />
          </pattern>
          <radialGradient id="warmlight" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(255,220,170,0.10)" />
            <stop offset="100%" stopColor="rgba(255,220,170,0)" />
          </radialGradient>
        </defs>

        {OFFICE_ZONES.map((z) => {
          const { x, y, w, h } = zonePx(z);
          return (
            <g key={z.id}>
              <rect x={x} y={y} width={w} height={h} fill={z.color} fillOpacity={z.alpha} rx={4} />
              <rect x={x} y={y} width={w} height={h} fill="url(#checker)" rx={4} />
              <rect x={x} y={y} width={w} height={h} fill="url(#warmlight)" rx={4} />
              {/* Etiqueta discreta no canto superior esquerdo da zona */}
              <text
                x={x + 6}
                y={y + 12}
                fontSize="9"
                fontFamily="ui-monospace, monospace"
                fontWeight="700"
                letterSpacing="0.5"
                fill="rgba(255,255,255,0.55)"
                style={{ textTransform: "uppercase" }}
              >
                {z.label}
              </text>
            </g>
          );
        })}

        {/* Paredes laterais (faixas escuras) — pseudo-iso */}
        <rect x={0} y={0} width={4} height={STAGE_HEIGHT_PX} fill={OFFICE_THEME.wallSide} opacity="0.55" />
        <rect x={STAGE_WIDTH_PX - 4} y={0} width={4} height={STAGE_HEIGHT_PX} fill={OFFICE_THEME.wallSide} opacity="0.55" />
        <rect x={0} y={STAGE_HEIGHT_PX - 4} width={STAGE_WIDTH_PX} height={4} fill={OFFICE_THEME.wallSide} opacity="0.45" />
      </svg>

      {/* Vinheta */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.35) 100%)",
        }}
      />
    </div>
  );
};
