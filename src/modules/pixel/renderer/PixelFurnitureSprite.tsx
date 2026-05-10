import { OFFICE_THEME } from "../core/pixelOfficeTheme";

export type FurnitureKind = "plant" | "coffee" | "board" | "sofa" | "chair" | "divider" | "pc" | "decor";

interface Props {
  kind: FurnitureKind;
  width: number;
  height: number;
}

export const PixelFurnitureSprite = ({ kind, width, height }: Props) => {
  switch (kind) {
    case "plant":
      return (
        <svg
          width={width}
          height={height}
          viewBox="0 0 28 36"
          shapeRendering="crispEdges"
          style={{ imageRendering: "pixelated" }}
        >
          <polygon points="6,28 22,28 20,36 8,36" fill={OFFICE_THEME.plantPot} />
          <rect x="6" y="26" width="16" height="3" fill="#3a1f0a" />
          <ellipse cx="14" cy="16" rx="10" ry="12" fill={OFFICE_THEME.plantLeaf} />
          <ellipse cx="9" cy="14" rx="6" ry="8" fill="#5fae7a" />
          <ellipse cx="19" cy="14" rx="6" ry="8" fill="#2e6b46" />
          <ellipse cx="14" cy="10" rx="5" ry="6" fill="#7fc59a" />
        </svg>
      );
    case "coffee":
      return (
        <svg
          width={width}
          height={height}
          viewBox="0 0 12 16"
          shapeRendering="crispEdges"
          style={{ imageRendering: "pixelated" }}
        >
          <rect x="2" y="10" width="8" height="6" fill="#3a3a45" />
          <rect x="3" y="11" width="6" height="4" fill="#1a1a1a" opacity="0.3" />
          <rect x="3" y="2" width="6" height="8" rx="2" fill="#5a8acb" />
          <rect x="4" y="3" width="1" height="6" fill="#fff" opacity="0.2" />
          <rect x="5" y="10" width="2" height="1" fill="#a0a0a0" />
        </svg>
      );
    case "board":
      return (
        <svg
          width={width}
          height={height}
          viewBox="0 0 80 28"
          shapeRendering="crispEdges"
          style={{ imageRendering: "pixelated" }}
        >
          <rect width="80" height="28" fill={OFFICE_THEME.boardFrame} />
          <rect x="2" y="2" width="76" height="24" fill={OFFICE_THEME.boardPaper} />
          <rect x="6" y="6" width="40" height="2" fill="#3a3a3a" />
          <rect x="6" y="11" width="60" height="2" fill="#3a3a3a" />
          <rect x="6" y="16" width="30" height="2" fill="#3a3a3a" />
          <rect x="6" y="21" width="50" height="2" fill="#a02a2a" />
        </svg>
      );
    case "sofa":
      return (
        <svg
          width={width}
          height={height}
          viewBox="0 0 32 20"
          shapeRendering="crispEdges"
          style={{ imageRendering: "pixelated" }}
        >
          <rect x="2" y="14" width="28" height="4" fill="rgba(0,0,0,0.2)" rx="2" />
          <rect x="2" y="6" width="28" height="10" rx="2" fill="#4a5568" />
          <rect x="2" y="2" width="28" height="6" rx="2" fill="#2d3748" />
          <rect x="4" y="8" width="24" height="6" fill="#718096" opacity="0.5" />
        </svg>
      );
    case "chair":
      return (
        <svg
          width={width}
          height={height}
          viewBox="0 0 16 20"
          shapeRendering="crispEdges"
          style={{ imageRendering: "pixelated" }}
        >
          <rect x="4" y="14" width="8" height="4" fill="#1a202c" />
          <rect x="2" y="6" width="12" height="8" rx="1" fill="#2d3748" />
          <rect x="2" y="2" width="12" height="6" rx="1" fill="#4a5568" />
        </svg>
      );
    case "divider":
      return (
        <div 
          style={{ 
            width: "100%", 
            height: "100%", 
            background: "rgba(255,255,255,0.1)",
            borderLeft: "2px solid rgba(255,255,255,0.2)",
            boxShadow: "2px 0 5px rgba(0,0,0,0.3)"
          }} 
        />
      );
    case "pc":
      return (
        <svg
          width={width}
          height={height}
          viewBox="0 0 16 16"
          shapeRendering="crispEdges"
          style={{ imageRendering: "pixelated" }}
        >
          <rect x="2" y="2" width="12" height="10" fill="#1a202c" />
          <rect x="3" y="3" width="10" height="8" fill="#3182ce" opacity="0.6" />
          <rect x="6" y="12" width="4" height="2" fill="#2d3748" />
        </svg>
      );
    default:
      return (
        <div className="w-full h-full border-2 border-dashed border-primary/30 flex items-center justify-center">
          <span className="text-[8px] opacity-50 uppercase">{kind}</span>
        </div>
      );
  }
};
