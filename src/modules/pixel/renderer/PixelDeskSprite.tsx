import { OFFICE_THEME, type DeskKind } from "../core/pixelOfficeTheme";

interface Props {
  kind: DeskKind;
  width: number;
  height: number;
}

/**
 * Mesa de escritório em pseudo-isométrico (SVG inline).
 *
 * - admin: monitor + teclado
 * - engenharia: notebook + prancheta
 * - juridico: documentos empilhados
 * - meeting: mesa redonda grande com cadeiras (renderiza maior)
 * - default: mesa neutra com notebook
 */
export const PixelDeskSprite = ({ kind, width, height }: Props) => {
  if (kind === "meeting") return <MeetingTable width={width} height={height} />;

  // Mesa retangular pseudo-iso 32x16 lógico
  const wood = "#8b5e3c";
  const woodLight = "#a07a52";
  const woodDark = "#5d3a1a";
  const shadow = "rgba(0,0,0,0.3)";

  return (
    <svg
      viewBox="0 0 32 24"
      width={width}
      height={height}
      shapeRendering="crispEdges"
      className="transition-all duration-500 hover:scale-105"
      style={{ imageRendering: "pixelated", display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <filter id="objectShadow">
          <feDropShadow dx="0.5" dy="0.5" stdDeviation="0.2" floodOpacity="0.4" />
        </filter>
        <linearGradient id="woodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: woodLight, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: wood, stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Sombra no chão */}
      <rect x="2" y="18" width="28" height="4" fill={shadow} rx="2" />

      {/* Pernas da mesa */}
      <rect x="4" y="14" width="2" height="6" fill={woodDark} />
      <rect x="26" y="14" width="2" height="6" fill={woodDark} />
      <rect x="4" y="12" width="24" height="2" fill={woodDark} />

      {/* Tampo da mesa (Isometric feel) */}
      <polygon points="2,12 6,4 30,4 26,12" fill="url(#woodGrad)" />
      <rect x="2" y="12" width="24" height="2" fill={wood} />
      <rect x="26" y="4" width="4" height="8" fill={woodDark} opacity="0.3" />

      {/* Objetos específicos conforme o tipo */}
      <g filter="url(#objectShadow)">
        {kind === "admin" && (
          <>
            {/* Dual Monitor Setup */}
            <rect x="8" y="2" width="8" height="6" fill="#1a1a1a" />
            <rect x="9" y="3" width="6" height="4" fill="#3a8acb" />
            <rect x="17" y="3" width="8" height="6" fill="#1a1a1a" />
            <rect x="18" y="4" width="6" height="4" fill="#3a8acb" />
            {/* Teclado iluminado */}
            <rect x="10" y="10" width="10" height="1" fill="#444" />
            <rect x="11" y="10" width="1" height="1" fill="#a855f7" className="animate-pulse" />
          </>
        )}

        {kind === "engenharia" && (
          <>
            {/* Planta Técnica / Rolo */}
            <rect x="18" y="6" width="10" height="3" rx="1" fill="#f5e9c8" />
            <rect x="18" y="6" width="2" height="3" fill="#d97706" />
            {/* Notebook Robusto */}
            <rect x="7" y="4" width="9" height="7" fill="#2a2a2a" />
            <rect x="8" y="5" width="7" height="5" fill="#f59e0b" opacity="0.8" />
            <rect x="6" y="11" width="11" height="1" fill="#111" />
          </>
        )}

        {kind === "juridico" && (
          <>
            {/* Arquivos empilhados */}
            <rect x="8" y="4" width="8" height="6" fill="#fff" />
            <rect x="9" y="2" width="8" height="6" fill="#f5f5f5" />
            <rect x="9" y="3" width="8" height="1" fill="#3b82f6" opacity="0.3" />
            {/* Balança da justiça pequena */}
            <rect x="22" y="4" width="1" height="6" fill="#b45309" />
            <rect x="20" y="5" width="5" height="1" fill="#b45309" />
          </>
        )}

        {kind === "default" && (
          <>
            {/* Notebook slim */}
            <rect x="11" y="5" width="10" height="6" fill="#333" />
            <rect x="12" y="6" width="8" height="4" fill="#60a5fa" />
            {/* Caneca de Café */}
            <rect x="24" y="8" width="3" height="3" fill="#fff" />
            <rect x="25" y="9" width="1" height="1" fill="#451a03" />
          </>
        )}
      </g>
    </svg>
  );
};

const MeetingTable = ({ width, height }: { width: number; height: number }) => {
  const top = "#a07a52";
  const topShade = "#6b4a2e";
  const chair = "#5a3a8a";
  return (
    <svg
      viewBox="0 0 64 40"
      width={width}
      height={height}
      shapeRendering="crispEdges"
      style={{ imageRendering: "pixelated", display: "block" }}
      aria-hidden="true"
    >
      <ellipse cx="32" cy="36" rx="28" ry="3" fill="rgba(0,0,0,0.35)" />
      {/* Cadeiras topo */}
      <rect x="14" y="6" width="6" height="4" fill={chair} />
      <rect x="29" y="4" width="6" height="4" fill={chair} />
      <rect x="44" y="6" width="6" height="4" fill={chair} />
      {/* Cadeiras base */}
      <rect x="14" y="30" width="6" height="4" fill={chair} />
      <rect x="29" y="32" width="6" height="4" fill={chair} />
      <rect x="44" y="30" width="6" height="4" fill={chair} />
      {/* Mesa oval */}
      <ellipse cx="32" cy="20" rx="22" ry="9" fill={top} />
      <ellipse cx="32" cy="22" rx="22" ry="9" fill={topShade} opacity="0.5" />
      <ellipse cx="32" cy="18" rx="20" ry="7" fill={top} opacity="0.7" />
      {/* Itens em cima */}
      <rect x="22" y="17" width="4" height="3" fill="#1a1a1a" />
      <rect x="38" y="17" width="4" height="3" fill="#1a1a1a" />
      <rect x="30" y="19" width="4" height="2" fill="#f5e9c8" />
    </svg>
  );
};
