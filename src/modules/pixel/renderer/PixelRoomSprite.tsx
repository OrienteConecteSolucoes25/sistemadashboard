import { OFFICE_THEME } from "../core/pixelOfficeTheme";

interface Props {
  width: number;
  height: number;
  variant?: "meeting" | "engineering" | "legal" | "common" | "hr" | "finance" | "ti" | "reception" | "showroom" | "project_view" | "marketplace";
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
    case "showroom":
      return { carpet: "#1e1b4b", accent: "#818cf8" };
    case "project_view":
      return { carpet: "#0f172a", accent: "#38bdf8" };
    case "marketplace":
      return { carpet: "#1e1b4b", accent: "#a78bfa" };
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
        style={{ imageRendering: "pixelated", display: "block", background: "transparent" }}
      >
        {/* Tapete sutil — apenas tonalidade no chão, sem bordas marcantes */}
        <rect x="0" y="0" width={width} height={height} fill={c.carpet} opacity="0.18" rx="6" />
      </svg>
      {label && (
        <span
          className="absolute top-1 left-1 text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm pointer-events-none opacity-60"
          style={{ background: "rgba(0,0,0,0.35)", color: c.accent }}
        >
          {label}
        </span>
      )}
    </div>
  );
};
