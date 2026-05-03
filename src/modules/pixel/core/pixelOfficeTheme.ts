/**
 * Pixel Office — Theme tokens (visual layer ONLY).
 *
 * Mantém toda a paleta usada pelos sprites SVG inline.
 * Qualquer mudança de visual deve passar por aqui — nenhum
 * componente de regra de negócio pode importar este arquivo.
 */

export type PixelRole = "admin" | "engenharia" | "juridico" | "padrao";

export interface RolePalette {
  skin: string;
  skinShadow: string;
  hair: string;
  shirt: string;
  shirtShadow: string;
  pants: string;
  shoes: string;
  accent: string;
  /** Cor do balão/etiqueta do nome */
  badge: string;
}

export const ROLE_PALETTES: Record<PixelRole, RolePalette> = {
  admin: {
    skin: "#f0c9a4",
    skinShadow: "#d9a87e",
    hair: "#2d1b1b",
    shirt: "#6b3fa0",
    shirtShadow: "#4a2a73",
    pants: "#1f1830",
    shoes: "#0f0a18",
    accent: "#ffd166",
    badge: "#8a55c8",
  },
  engenharia: {
    skin: "#f0c9a4",
    skinShadow: "#d9a87e",
    hair: "#3a2510",
    shirt: "#e87a1a",
    shirtShadow: "#b35613",
    pants: "#3b2a1a",
    shoes: "#1a120b",
    accent: "#ffe066",
    badge: "#e87a1a",
  },
  juridico: {
    skin: "#f0c9a4",
    skinShadow: "#d9a87e",
    hair: "#1a1a1a",
    shirt: "#1f3a8a",
    shirtShadow: "#142762",
    pants: "#0f1830",
    shoes: "#080912",
    accent: "#c9a96a",
    badge: "#1f3a8a",
  },
  padrao: {
    skin: "#f0c9a4",
    skinShadow: "#d9a87e",
    hair: "#4a2c1a",
    shirt: "#3b8c7a",
    shirtShadow: "#256055",
    pants: "#2a2a35",
    shoes: "#10101a",
    accent: "#a8d8cc",
    badge: "#3b8c7a",
  },
};

/** Deriva o papel visual a partir do sprite_key vindo do banco. */
export const roleFromSpriteKey = (key: string | null | undefined): PixelRole => {
  if (!key) return "padrao";
  const k = key.toLowerCase();
  if (k.includes("admin")) return "admin";
  if (k.includes("engen")) return "engenharia";
  if (k.includes("jurid")) return "juridico";
  return "padrao";
};

export type DeskKind = "admin" | "engenharia" | "juridico" | "meeting" | "default";

export const deskKindFromKey = (
  spriteKey: string | null | undefined,
  deskType: string | null | undefined,
): DeskKind => {
  if (deskType === "meeting") return "meeting";
  const k = (spriteKey ?? "").toLowerCase();
  if (k.includes("admin")) return "admin";
  if (k.includes("engen")) return "engenharia";
  if (k.includes("jurid")) return "juridico";
  return "default";
};

/** Cores do piso/ambiente (independente do tema do app). */
export const OFFICE_THEME = {
  floorBase: "#2a2436",
  floorAlt: "#241f30",
  floorTileLine: "rgba(255,255,255,0.04)",
  wallTop: "#3b3450",
  wallSide: "#2c2640",
  wallTrim: "#a89bd1",
  carpetCommon: "#3d6b62",
  carpetMeeting: "#5a3a8a",
  plantPot: "#6b3a1a",
  plantLeaf: "#3a8a5a",
  boardFrame: "#1a120b",
  boardPaper: "#f5e9c8",
  divider: "#4a4360",
} as const;
