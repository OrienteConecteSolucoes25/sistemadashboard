import { OFFICE_THEME } from "../core/pixelOfficeTheme";
import { TILE_SIZE, STAGE_WIDTH_PX, STAGE_HEIGHT_PX } from "../core/constants";
import { OFFICE_ZONES, zonePx } from "../core/officeZones";

/**
 * Decorações ambientais do escritório (Leva 3) — plantas, sofá, mesa
 * de reuniões, monitores TI, balcão recepção, máquina de café.
 * Sem interatividade: pointer-events: none.
 */
export const PixelOfficeDecorations = () => {
  const z = (id: string) => OFFICE_ZONES.find((x) => x.id === id)!;
  const recepcao = zonePx(z("recepcao"));
  const cafe = zonePx(z("cafe"));
  const reunioes = zonePx(z("reunioes"));
  const ti = zonePx(z("ti"));
  const diretoria = zonePx(z("diretoria"));
  const agentes = zonePx(z("agentes"));

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {/* Plantas em pontos estratégicos */}
      <Plant style={{ left: recepcao.x + recepcao.w - 30, top: recepcao.y + 6 }} />
      <Plant style={{ left: cafe.x + 6, top: cafe.y + 6 }} />
      <Plant style={{ left: ti.x + ti.w - 30, top: ti.y + 6 }} />
      <Plant style={{ left: diretoria.x + 4, top: diretoria.y + diretoria.h - 38 }} />
      <Plant style={{ left: agentes.x + agentes.w - 30, top: agentes.y + agentes.h - 38 }} />

      {/* Recepção: balcão */}
      <ReceptionDesk style={{ left: recepcao.x + 8, top: recepcao.y + recepcao.h - 28 }} />

      {/* Café: máquina + sofá */}
      <CoffeeMachine style={{ left: cafe.x + cafe.w - 30, top: cafe.y + cafe.h - 40 }} />
      <Couch style={{ left: cafe.x + 8, top: cafe.y + cafe.h - 26 }} />

      {/* TI: rack de monitores */}
      <ServerRack style={{ left: ti.x + 10, top: ti.y + ti.h - 44 }} />

      {/* Sala de reuniões: mesa central com cadeiras */}
      <MeetingTable
        style={{
          left: reunioes.x + reunioes.w / 2 - 56,
          top: reunioes.y + reunioes.h / 2 - 32,
        }}
      />

      {/* Sala dos agentes: pódio com terminal */}
      <AgentTerminal style={{ left: agentes.x + agentes.w / 2 - 16, top: agentes.y + agentes.h / 2 - 18 }} />

      {/* Quadros decorativos no topo */}
      <Board style={{ left: TILE_SIZE * 8, top: 6 }} />
      <Board style={{ left: STAGE_WIDTH_PX - TILE_SIZE * 5, top: 6 }} />
    </div>
  );
};

const Plant = ({ style }: { style: React.CSSProperties }) => (
  <svg width={28} height={36} shapeRendering="crispEdges" className="absolute" style={{ ...style, imageRendering: "pixelated" }}>
    <polygon points="6,28 22,28 20,36 8,36" fill={OFFICE_THEME.plantPot} />
    <rect x="6" y="26" width="16" height="3" fill="#3a1f0a" />
    <ellipse cx="14" cy="16" rx="10" ry="12" fill={OFFICE_THEME.plantLeaf} />
    <ellipse cx="9" cy="14" rx="6" ry="8" fill="#5fae7a" />
    <ellipse cx="19" cy="14" rx="6" ry="8" fill="#2e6b46" />
    <ellipse cx="14" cy="10" rx="5" ry="6" fill="#7fc59a" />
  </svg>
);

const Board = ({ style }: { style: React.CSSProperties }) => (
  <svg width={80} height={22} shapeRendering="crispEdges" className="absolute" style={{ ...style, imageRendering: "pixelated", opacity: 0.85 }}>
    <rect width="80" height="22" fill={OFFICE_THEME.boardFrame} />
    <rect x="2" y="2" width="76" height="18" fill={OFFICE_THEME.boardPaper} />
    <rect x="6" y="5" width="40" height="2" fill="#3a3a3a" />
    <rect x="6" y="10" width="60" height="2" fill="#3a3a3a" />
    <rect x="6" y="15" width="50" height="2" fill="#a02a2a" />
  </svg>
);

const CoffeeMachine = ({ style }: { style: React.CSSProperties }) => (
  <svg width={26} height={36} viewBox="0 0 13 18" shapeRendering="crispEdges" className="absolute" style={{ ...style, imageRendering: "pixelated" }}>
    <rect x="2" y="11" width="9" height="7" fill="#3a3a45" />
    <rect x="3" y="2" width="7" height="9" rx="1" fill="#5a8acb" />
    <rect x="4" y="3" width="1" height="7" fill="#fff" opacity="0.25" />
    <rect x="5" y="11" width="3" height="2" fill="#a0a0a0" />
  </svg>
);

const Couch = ({ style }: { style: React.CSSProperties }) => (
  <svg width={64} height={26} shapeRendering="crispEdges" className="absolute" style={{ ...style, imageRendering: "pixelated" }}>
    <rect x="2" y="8" width="60" height="14" rx="3" fill="#5a4a8a" />
    <rect x="2" y="6" width="60" height="6" rx="2" fill="#7a6aa8" />
    <rect x="0" y="14" width="6" height="10" rx="1" fill="#3b3060" />
    <rect x="58" y="14" width="6" height="10" rx="1" fill="#3b3060" />
  </svg>
);

const ServerRack = ({ style }: { style: React.CSSProperties }) => (
  <svg width={48} height={44} shapeRendering="crispEdges" className="absolute" style={{ ...style, imageRendering: "pixelated" }}>
    <rect x="0" y="0" width="48" height="44" fill="#1a1f26" />
    <rect x="2" y="2" width="44" height="6" fill="#0f1116" />
    <rect x="4" y="4" width="3" height="2" fill="#3bd16f" />
    <rect x="9" y="4" width="3" height="2" fill="#2bbdc0" />
    <rect x="2" y="10" width="44" height="6" fill="#0f1116" />
    <rect x="4" y="12" width="3" height="2" fill="#ffd166" />
    <rect x="2" y="18" width="44" height="6" fill="#0f1116" />
    <rect x="4" y="20" width="3" height="2" fill="#3bd16f" />
    <rect x="2" y="26" width="44" height="6" fill="#0f1116" />
    <rect x="2" y="34" width="44" height="8" fill="#0f1116" />
    <rect x="6" y="36" width="36" height="4" fill="#2bbdc0" opacity="0.4" />
  </svg>
);

const ReceptionDesk = ({ style }: { style: React.CSSProperties }) => (
  <svg width={120} height={28} shapeRendering="crispEdges" className="absolute" style={{ ...style, imageRendering: "pixelated" }}>
    <rect x="0" y="6" width="120" height="18" fill="#5a3f2a" />
    <rect x="0" y="6" width="120" height="3" fill="#7a5a3a" />
    <rect x="4" y="0" width="60" height="8" fill="#2bbdc0" opacity="0.6" rx="1" />
    <text x="34" y="6" fontSize="6" fontFamily="monospace" fill="#fff" textAnchor="middle">OCS</text>
  </svg>
);

const MeetingTable = ({ style }: { style: React.CSSProperties }) => (
  <svg width={112} height={64} shapeRendering="crispEdges" className="absolute" style={{ ...style, imageRendering: "pixelated" }}>
    {/* Mesa oval */}
    <ellipse cx="56" cy="32" rx="50" ry="22" fill="#3a2a18" />
    <ellipse cx="56" cy="30" rx="48" ry="20" fill="#5a3f2a" />
    <ellipse cx="56" cy="28" rx="46" ry="18" fill="#6b4a32" />
    {/* 6 cadeiras */}
    {[
      { cx: 14, cy: 32 }, { cx: 98, cy: 32 },
      { cx: 32, cy: 4 }, { cx: 56, cy: 2 }, { cx: 80, cy: 4 },
      { cx: 56, cy: 60 },
    ].map((c, i) => (
      <g key={i}>
        <rect x={c.cx - 5} y={c.cy - 4} width="10" height="8" rx="2" fill="#1f2a3a" />
        <rect x={c.cx - 4} y={c.cy - 3} width="8" height="6" rx="1" fill="#3a4a6b" />
      </g>
    ))}
    {/* Laptops */}
    <rect x="44" y="22" width="8" height="6" fill="#1a1a1a" />
    <rect x="60" y="22" width="8" height="6" fill="#1a1a1a" />
  </svg>
);

const AgentTerminal = ({ style }: { style: React.CSSProperties }) => (
  <svg width={32} height={36} shapeRendering="crispEdges" className="absolute" style={{ ...style, imageRendering: "pixelated" }}>
    <rect x="4" y="22" width="24" height="12" fill="#2a2436" />
    <rect x="0" y="6" width="32" height="18" rx="2" fill="#1a1f26" />
    <rect x="3" y="9" width="26" height="12" fill="#0a0e14" />
    <rect x="5" y="11" width="6" height="2" fill="#2bbdc0" />
    <rect x="5" y="14" width="14" height="2" fill="#2bbdc0" opacity="0.6" />
    <rect x="5" y="17" width="10" height="2" fill="#2bbdc0" opacity="0.4" />
  </svg>
);
