import { OFFICE_THEME } from "../core/pixelOfficeTheme";

interface Props {
  width: number;
  height: number;
  variant?: "meeting" | "engineering" | "legal" | "common" | "hr" | "finance" | "ti" | "reception" | "showroom" | "project_view";
  label?: string;
}

const variantColors = (v: Props["variant"]) => {
  switch (v) {
    case "meeting":
      return { carpet: OFFICE_THEME.carpetMeeting, accent: "#c9a8ff" };
    case "engineering":
      return { carpet: "#1f2937", accent: "#3b82f6" };
    case "legal":
      return { carpet: "#1e1b4b", accent: "#f59e0b" };
    case "hr":
      return { carpet: "#064e3b", accent: "#10b981" };
    case "finance":
      return { carpet: "#4c1d95", accent: "#a78bfa" };
    case "ti":
      return { carpet: "#164e63", accent: "#22d3ee" };
    case "reception":
      return { carpet: "#334155", accent: "#94a3b8" };
    default:
      return { carpet: OFFICE_THEME.carpetCommon, accent: "#a8d8cc" };
  }
};

/**
 * Sala — desenhada como tapete + bordas pixel art com etiqueta.
 * Não usa imagem, apenas SVG inline. Fica ATRÁS dos personagens.
 */
export const PixelRoomSprite = ({ width, height, variant = "common", label }: Props) => {
  const c = variantColors(variant);
  return (
    <div
      className="relative w-full h-full"
      style={{ width, height }}
      aria-hidden="true"
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        shapeRendering="crispEdges"
        style={{ imageRendering: "pixelated", display: "block" }}
      >
        {/* Tapete principal */}
        <rect x="2" y="2" width={width - 4} height={height - 4} fill={c.carpet} opacity="0.85" />
        {/* Padrão xadrez sutil */}
        {Array.from({ length: Math.floor((width - 4) / 8) }).map((_, i) =>
          Array.from({ length: Math.floor((height - 4) / 8) }).map((__, j) =>
            (i + j) % 2 === 0 ? (
              <rect
                key={`${i}-${j}`}
                x={2 + i * 8}
                y={2 + j * 8}
                width="8"
                height="8"
                fill="rgba(255,255,255,0.04)"
              />
            ) : null,
          ),
        )}
        {/* Borda dupla */}
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="none"
          stroke={c.accent}
          strokeWidth="2"
          strokeDasharray="6 4"
          opacity="0.6"
        />
        <rect
          x="2"
          y="2"
          width={width - 4}
          height={height - 4}
          fill="none"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth="1"
        />
      </svg>
      {label && (
        <span
          className="absolute top-1 left-1 text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm pointer-events-none"
          style={{ background: "rgba(0,0,0,0.55)", color: c.accent }}
        >
          {label}
        </span>
      )}
    </div>
  );
};
