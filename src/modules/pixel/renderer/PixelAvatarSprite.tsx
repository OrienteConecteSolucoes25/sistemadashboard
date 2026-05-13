import { ROLE_PALETTES, type PixelRole } from "../core/pixelOfficeTheme";

interface Props {
  role: PixelRole;
  size?: number;
  /** Reduz contraste/satura — usado quando o personagem está "away". */
  faded?: boolean;
  /** Tom de cinza — usado para "offline" (quando exibido). */
  grayscale?: boolean;
}

/**
 * Personagem pixel art em SVG inline.
 *
 * Grid lógico 16x24 (escalado para `size`). Mantém aparência pixelada via
 * shapeRendering=crispEdges + image-rendering: pixelated no wrapper.
 *
 * Composição:
 *  - cabelo / capacete (varia por papel)
 *  - cabeça
 *  - torso (camisa colorida do papel)
 *  - braços
 *  - pernas / calça
 *  - sapatos
 *  - acessório opcional (gravata / colete / crachá)
 */
export const PixelAvatarSprite = ({ role, size = 56, faded, grayscale }: Props) => {
  const p = ROLE_PALETTES[role];
  const filter = grayscale
    ? "grayscale(1) brightness(0.85)"
    : faded
    ? "saturate(0.6) brightness(0.85)"
    : undefined;

  // 16x24 (2:3) — width acompanha a altura para não criar quadrado vazio.
  const w = Math.round(size * (16 / 24));
  return (
    <svg
      viewBox="0 0 16 24"
      width={w}
      height={size}
      preserveAspectRatio="xMidYMax meet"
      shapeRendering="crispEdges"
      style={{ imageRendering: "pixelated", display: "block", background: "transparent", filter }}
      aria-hidden="true"
    >
      {/* Sombra no chão */}
      <ellipse cx="8" cy="23" rx="4" ry="0.8" fill="rgba(0,0,0,0.35)" />

      {/* Pernas / calça */}
      <rect x="5" y="16" width="3" height="5" fill={p.pants} />
      <rect x="8" y="16" width="3" height="5" fill={p.pants} />
      {/* Sapatos */}
      <rect x="4" y="21" width="4" height="1" fill={p.shoes} />
      <rect x="8" y="21" width="4" height="1" fill={p.shoes} />

      {/* Torso */}
      <rect x="4" y="10" width="8" height="6" fill={p.shirt} />
      {/* Sombra lateral do torso */}
      <rect x="11" y="10" width="1" height="6" fill={p.shirtShadow} />
      <rect x="4" y="15" width="8" height="1" fill={p.shirtShadow} />

      {/* Braços */}
      <rect x="3" y="10" width="1" height="5" fill={p.shirt} />
      <rect x="12" y="10" width="1" height="5" fill={p.shirt} />
      {/* Mãos */}
      <rect x="3" y="15" width="1" height="1" fill={p.skin} />
      <rect x="12" y="15" width="1" height="1" fill={p.skin} />

      {/* Acessório por papel — colete / gravata / crachá */}
      {role === "juridico" && (
        <>
          {/* Gravata */}
          <rect x="7" y="10" width="2" height="4" fill={p.accent} />
          <rect x="7" y="14" width="2" height="1" fill={p.shirtShadow} />
        </>
      )}
      {role === "engenharia" && (
        <>
          {/* Colete refletivo */}
          <rect x="4" y="10" width="1" height="6" fill={p.accent} />
          <rect x="11" y="10" width="1" height="6" fill={p.accent} />
          <rect x="4" y="13" width="8" height="1" fill={p.accent} />
        </>
      )}
      {role === "admin" && (
        <>
          {/* Crachá */}
          <rect x="10" y="11" width="2" height="2" fill={p.accent} />
        </>
      )}
      {role === "padrao" && (
        <>
          {/* Botão único */}
          <rect x="7" y="12" width="1" height="1" fill={p.accent} />
        </>
      )}

      {/* Pescoço */}
      <rect x="7" y="9" width="2" height="1" fill={p.skinShadow} />

      {/* Cabeça */}
      <rect x="5" y="4" width="6" height="6" fill={p.skin} />
      {/* Sombreado lateral cabeça */}
      <rect x="10" y="4" width="1" height="6" fill={p.skinShadow} />
      {/* Olhos */}
      <rect x="6" y="6" width="1" height="1" fill="#1a1a1a" />
      <rect x="9" y="6" width="1" height="1" fill="#1a1a1a" />
      {/* Boca */}
      <rect x="7" y="8" width="2" height="1" fill={p.skinShadow} />

      {/* Cabelo / capacete */}
      {role === "engenharia" ? (
        <>
          {/* Capacete laranja */}
          <rect x="4" y="3" width="8" height="2" fill={p.accent} />
          <rect x="5" y="2" width="6" height="1" fill={p.accent} />
          <rect x="4" y="5" width="8" height="1" fill="#000" opacity="0.15" />
        </>
      ) : (
        <>
          <rect x="5" y="3" width="6" height="2" fill={p.hair} />
          <rect x="4" y="4" width="1" height="2" fill={p.hair} />
          <rect x="11" y="4" width="1" height="2" fill={p.hair} />
        </>
      )}
    </svg>
  );
};
