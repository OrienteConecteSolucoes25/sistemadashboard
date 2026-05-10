import {
  type AvatarCustomization,
  getColorValue,
  hairColorOptions,
  lipstickOptions,
  earringOptions,
  outfitColorOptions,
  bottomOptions,
  shoesOptions,
  skinToneOptions,
} from "../core/avatarOptions";

interface Props {
  customization: AvatarCustomization;
  size?: number;
  faded?: boolean;
  grayscale?: boolean;
  direction?: "left" | "right";
  isWalking?: boolean;
}

/**
 * Avatar pixel art renderizado em camadas SVG inline.
 *
 * Grid 16x24. Ordem (bottom→top):
 *  1. sombra
 *  2. pernas (bottom_key)
 *  3. sapatos
 *  4. torso/braços (outfit_color)
 *  5. detalhe outfit (gravata/colete/crachá)
 *  6. pescoço + cabeça (skin)
 *  7. olhos / boca / batom
 *  8. brinco
 *  9. cabelo (hair_key + hair_color) — escondido se hat_key contiver "helmet"
 * 10. chapéu/capacete (hat_key)
 * 11. óculos
 * 12. ferramenta (na mão)
 */
export const AvatarLayeredSprite = ({ customization, size = 56, faded, grayscale, direction = "right", isWalking }: Props) => {
  const c = customization;
  const skin = getColorValue(skinToneOptions, c.avatar_skin_tone, "#e0b18a");
  const skinShadow = shadeColor(skin, -18);
  const hairColor = getColorValue(hairColorOptions, c.avatar_hair_color, "#4a2c1a");
  const outfitColor = getColorValue(outfitColorOptions, c.avatar_outfit_color, "#3b8c7a");
  const outfitShadow = shadeColor(outfitColor, -22);
  const bottomColor = getColorValue(bottomOptions, c.avatar_bottom_key, "#1f1830");
  const isSkirt = (c.avatar_bottom_key ?? "").startsWith("skirt");
  const shoesColor = getColorValue(shoesOptions, c.avatar_shoes_key, "#0f0a18");
  const lipstickColor = getColorValue(lipstickOptions, c.avatar_lipstick_key, "");
  const earringColor = getColorValue(earringOptions, c.avatar_earring_key, "");
  const hatKey = c.avatar_hat_key ?? "hat_none";
  const hairKey = c.avatar_hair_key ?? "hair_short";
  const glassesKey = c.avatar_glasses_key ?? "glasses_none";
  const outfitKey = c.avatar_outfit_key ?? "outfit_casual";
  const toolKey = c.avatar_tool_key ?? "tool_none";

  const hatHidesHair =
    hatKey.startsWith("helmet") || hatKey === "hat_admin"; // chapéus que cobrem cabelo

  const filter = grayscale
    ? "grayscale(1) brightness(0.85)"
    : faded
    ? "saturate(0.6) brightness(0.85)"
    : undefined;

  const flip = direction === "left" ? "scaleX(-1)" : "scaleX(1)";

  return (
    <svg
      viewBox="0 0 16 24"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      style={{ imageRendering: "pixelated", display: "block", filter, transform: flip }}
      aria-hidden="true"
    >
      {/* sombra no chão */}
      <ellipse cx="8" cy="23" rx="4" ry="0.8" fill="rgba(0,0,0,0.35)" />

      {/* pernas / saia */}
      {isSkirt ? (
        <polygon points="4,16 12,16 13,21 3,21" fill={bottomColor} />
      ) : (
        <>
          <rect x={isWalking ? "4" : "5"} y="16" width="3" height="5" fill={bottomColor} />
          <rect x={isWalking ? "9" : "8"} y="16" width="3" height="5" fill={bottomColor} />
        </>
      )}
      {/* sapatos */}
      <rect x="4" y="21" width="4" height="1" fill={shoesColor} />
      <rect x="8" y="21" width="4" height="1" fill={shoesColor} />

      {/* torso */}
      <rect x="4" y="10" width="8" height="6" fill={outfitColor} />
      <rect x="11" y="10" width="1" height="6" fill={outfitShadow} />
      <rect x="4" y="15" width="8" height="1" fill={outfitShadow} />

      {/* braços */}
      <rect x="3" y="10" width="1" height="5" fill={outfitColor} />
      <rect x="12" y="10" width="1" height="5" fill={outfitColor} />
      {/* mãos */}
      <rect x="3" y="15" width="1" height="1" fill={skin} />
      <rect x="12" y="15" width="1" height="1" fill={skin} />

      {/* detalhes do outfit */}
      {outfitKey === "outfit_juridico" && (
        <>
          <rect x="7" y="10" width="2" height="4" fill="#c9a96a" />
          <rect x="7" y="14" width="2" height="1" fill={outfitShadow} />
        </>
      )}
      {outfitKey === "outfit_engenharia" && (
        <>
          <rect x="4" y="10" width="1" height="6" fill="#ffe066" />
          <rect x="11" y="10" width="1" height="6" fill="#ffe066" />
          <rect x="4" y="13" width="8" height="1" fill="#ffe066" />
        </>
      )}
      {outfitKey === "outfit_admin" && (
        <rect x="10" y="11" width="2" height="2" fill="#ffd166" />
      )}
      {outfitKey === "outfit_social" && (
        <>
          <rect x="7" y="10" width="2" height="3" fill="#1a1a1a" />
        </>
      )}
      {outfitKey === "outfit_operacional" && (
        <rect x="5" y="11" width="6" height="1" fill={outfitShadow} />
      )}
      {outfitKey === "outfit_casual" && (
        <rect x="7" y="12" width="1" height="1" fill={outfitShadow} />
      )}

      {/* pescoço */}
      <rect x="7" y="9" width="2" height="1" fill={skinShadow} />

      {/* cabeça */}
      <rect x="5" y="4" width="6" height="6" fill={skin} />
      <rect x="10" y="4" width="1" height="6" fill={skinShadow} />

      {/* olhos */}
      <rect x="6" y="6" width="1" height="1" fill="#1a1a1a" />
      <rect x="9" y="6" width="1" height="1" fill="#1a1a1a" />
      {/* boca / batom */}
      {lipstickColor ? (
        <rect x="7" y="8" width="2" height="1" fill={lipstickColor} />
      ) : (
        <rect x="7" y="8" width="2" height="1" fill={skinShadow} />
      )}

      {/* brinco */}
      {earringColor && (
        <>
          <rect x="4" y="7" width="1" height="1" fill={earringColor} />
          <rect x="11" y="7" width="1" height="1" fill={earringColor} />
        </>
      )}

      {/* cabelo */}
      {!hatHidesHair && hairKey !== "hair_none" && (
        <HairLayer hairKey={hairKey} color={hairColor} />
      )}

      {/* chapéu / capacete */}
      <HatLayer hatKey={hatKey} />

      {/* óculos */}
      <GlassesLayer glassesKey={glassesKey} />

      {/* ferramenta na mão */}
      <ToolLayer toolKey={toolKey} />
    </svg>
  );
};

// ----------------------------- Layers -----------------------------
const HairLayer = ({ hairKey, color }: { hairKey: string; color: string }) => {
  switch (hairKey) {
    case "hair_short":
      return (
        <>
          <rect x="5" y="3" width="6" height="2" fill={color} />
          <rect x="4" y="4" width="1" height="2" fill={color} />
          <rect x="11" y="4" width="1" height="2" fill={color} />
        </>
      );
    case "hair_medium":
      return (
        <>
          <rect x="5" y="3" width="6" height="2" fill={color} />
          <rect x="4" y="4" width="1" height="4" fill={color} />
          <rect x="11" y="4" width="1" height="4" fill={color} />
        </>
      );
    case "hair_long":
      return (
        <>
          <rect x="5" y="3" width="6" height="2" fill={color} />
          <rect x="4" y="4" width="1" height="7" fill={color} />
          <rect x="11" y="4" width="1" height="7" fill={color} />
        </>
      );
    case "hair_curly":
      return (
        <>
          <rect x="4" y="3" width="8" height="1" fill={color} />
          <rect x="3" y="4" width="2" height="2" fill={color} />
          <rect x="11" y="4" width="2" height="2" fill={color} />
          <rect x="5" y="2" width="6" height="1" fill={color} />
        </>
      );
    case "hair_bun":
      return (
        <>
          <rect x="5" y="3" width="6" height="2" fill={color} />
          <rect x="7" y="1" width="2" height="2" fill={color} />
          <rect x="4" y="4" width="1" height="2" fill={color} />
          <rect x="11" y="4" width="1" height="2" fill={color} />
        </>
      );
    default:
      return null;
  }
};

const HatLayer = ({ hatKey }: { hatKey: string }) => {
  const helmet = (color: string) => (
    <>
      <rect x="4" y="3" width="8" height="2" fill={color} />
      <rect x="5" y="2" width="6" height="1" fill={color} />
      <rect x="4" y="5" width="8" height="1" fill="#000" opacity="0.18" />
    </>
  );
  switch (hatKey) {
    case "helmet_white":
      return helmet("#f0f0f0");
    case "helmet_yellow":
      return helmet("#ffd23a");
    case "helmet_blue":
      return helmet("#2a6ad8");
    case "helmet_engineering":
      return helmet("#e87a1a");
    case "hat_admin":
      return (
        <>
          <rect x="4" y="3" width="8" height="1" fill="#1a1a1a" />
          <rect x="5" y="1" width="6" height="2" fill="#1a1a1a" />
          <rect x="5" y="2" width="6" height="1" fill="#6b3fa0" />
        </>
      );
    default:
      return null;
  }
};

const GlassesLayer = ({ glassesKey }: { glassesKey: string }) => {
  if (glassesKey === "glasses_none") return null;
  const color =
    glassesKey === "glasses_safety"
      ? "#ffe066"
      : glassesKey === "glasses_round"
      ? "#3a3a3a"
      : "#1a1a1a";
  if (glassesKey === "glasses_round") {
    return (
      <>
        <rect x="6" y="6" width="1" height="1" fill={color} />
        <rect x="9" y="6" width="1" height="1" fill={color} />
        <rect x="5" y="6" width="1" height="1" fill={color} />
        <rect x="10" y="6" width="1" height="1" fill={color} />
        <rect x="7" y="6" width="2" height="1" fill={color} opacity="0.5" />
      </>
    );
  }
  return (
    <>
      <rect x="5" y="6" width="3" height="1" fill={color} />
      <rect x="8" y="6" width="3" height="1" fill={color} />
      {glassesKey === "glasses_safety" && (
        <rect x="5" y="5" width="6" height="1" fill={color} opacity="0.5" />
      )}
    </>
  );
};

const ToolLayer = ({ toolKey }: { toolKey: string }) => {
  // Posicionado na mão direita (x=12,y=15)
  switch (toolKey) {
    case "tool_notebook":
      return <rect x="11" y="14" width="3" height="2" fill="#3a3a45" />;
    case "tool_clipboard":
      return (
        <>
          <rect x="12" y="14" width="2" height="3" fill="#c9a96a" />
          <rect x="12" y="14" width="2" height="1" fill="#5a4a2a" />
        </>
      );
    case "tool_folder":
      return <rect x="12" y="14" width="2" height="3" fill="#e87a1a" />;
    case "tool_radio":
      return (
        <>
          <rect x="12" y="14" width="1" height="2" fill="#1a1a1a" />
          <rect x="12" y="13" width="1" height="1" fill="#1a1a1a" />
        </>
      );
    case "tool_badge":
      return <rect x="10" y="11" width="2" height="2" fill="#ffd166" />;
    case "tool_wrench":
      return (
        <>
          <rect x="12" y="14" width="1" height="3" fill="#a0a0a0" />
          <rect x="12" y="13" width="2" height="1" fill="#a0a0a0" />
        </>
      );
    default:
      return null;
  }
};

// ------------------------- Util ----------------------------
function shadeColor(hex: string, percent: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const num = parseInt(h, 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.max(0, Math.min(255, (num >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
