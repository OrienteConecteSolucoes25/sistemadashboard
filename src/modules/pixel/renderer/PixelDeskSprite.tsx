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

  // Mesa retangular pseudo-iso 32x32 lógico
  const top = "#a07a52";
  const topShade = "#7a5a3a";
  const leg = "#3a2a1a";
  return (
    <svg
      viewBox="0 0 32 16"
      width={width}
      height={height}
      shapeRendering="crispEdges"
      style={{ imageRendering: "pixelated", display: "block" }}
      aria-hidden="true"
    >
      {/* Sombra */}
      <ellipse cx="16" cy="14.5" rx="13" ry="1.2" fill="rgba(0,0,0,0.35)" />

      {/* Tampo */}
      <polygon points="2,8 6,4 30,4 26,8" fill={top} />
      <polygon points="2,8 26,8 26,11 2,11" fill={topShade} />
      <rect x="6" y="3" width="24" height="1" fill={top} opacity="0.6" />

      {/* Pernas */}
      <rect x="4" y="11" width="2" height="3" fill={leg} />
      <rect x="22" y="11" width="2" height="3" fill={leg} />

      {kind === "admin" && (
        <>
          {/* Monitor */}
          <rect x="9" y="1" width="10" height="6" fill="#1a1a1a" />
          <rect x="10" y="2" width="8" height="4" fill="#3a8acb" />
          <rect x="13" y="7" width="2" height="1" fill="#1a1a1a" />
          {/* Teclado */}
          <rect x="20" y="6" width="6" height="1" fill="#dadada" />
        </>
      )}
      {kind === "engenharia" && (
        <>
          {/* Notebook */}
          <rect x="7" y="2" width="9" height="5" fill="#1a1a1a" />
          <rect x="8" y="3" width="7" height="3" fill="#e87a1a" />
          <rect x="6" y="7" width="11" height="1" fill="#3a3a3a" />
          {/* Prancheta */}
          <rect x="19" y="3" width="6" height="5" fill="#f5e9c8" />
          <rect x="19" y="3" width="6" height="1" fill="#a87a3a" />
          <rect x="20" y="5" width="4" height="1" fill="#a89bd1" opacity="0.6" />
        </>
      )}
      {kind === "juridico" && (
        <>
          {/* Pilha de documentos */}
          <rect x="8" y="5" width="7" height="3" fill="#f5e9c8" />
          <rect x="9" y="3" width="6" height="3" fill="#fff8e0" />
          <rect x="9" y="4" width="6" height="1" fill="#c9a96a" opacity="0.5" />
          {/* Carimbo */}
          <rect x="19" y="5" width="4" height="3" fill="#a02a2a" />
          <rect x="20" y="3" width="2" height="2" fill="#1a1a1a" />
        </>
      )}
      {kind === "default" && (
        <>
          <rect x="10" y="3" width="9" height="5" fill="#1a1a1a" />
          <rect x="11" y="4" width="7" height="3" fill="#5a8acb" />
          <rect x="9" y="8" width="11" height="1" fill="#3a3a3a" />
        </>
      )}
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
