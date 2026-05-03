/**
 * Pixel Office — Sprite Registry
 *
 * Catálogo central de todos os assets do módulo.
 * Os arquivos físicos vivem em /public/pixel/<categoria>/<key>.webp
 *
 * Enquanto o arquivo real não existir, o componente <PixelSprite/> renderiza
 * um placeholder em CSS (ver PixelSpritePlaceholder.tsx). Para usar a arte
 * real, basta colocar o .webp em /public/pixel/<categoria>/ com o mesmo nome
 * da `key` — nada mais precisa mudar.
 */

export type SpriteCategory = "avatar" | "desk" | "room" | "background";

export interface SpriteAsset {
  key: string;
  category: SpriteCategory;
  label: string;
  /** Cor base do placeholder (HSL semantic — usar tokens quando possível) */
  placeholderColor: string;
  /** Inicial/letra desenhada no placeholder */
  placeholderGlyph: string;
  /** Caminho público esperado do asset real */
  src: string;
}

const make = (
  category: SpriteCategory,
  key: string,
  label: string,
  placeholderColor: string,
  placeholderGlyph: string,
): SpriteAsset => ({
  key,
  category,
  label,
  placeholderColor,
  placeholderGlyph,
  src: `/pixel/${category === "avatar" ? "avatars" : category === "desk" ? "desks" : category === "room" ? "rooms" : "backgrounds"}/${key}.webp`,
});

// ---------------- AVATARS ----------------
export const AVATAR_SPRITES: SpriteAsset[] = [
  make("avatar", "avatar_admin_01", "Admin 01", "hsl(280 70% 55%)", "A"),
  make("avatar", "avatar_engenharia_01", "Engenharia 01", "hsl(25 90% 55%)", "E"),
  make("avatar", "avatar_engenharia_02", "Engenharia 02", "hsl(35 85% 50%)", "E"),
  make("avatar", "avatar_juridico_01", "Jurídico 01", "hsl(220 70% 55%)", "J"),
  make("avatar", "avatar_juridico_02", "Jurídico 02", "hsl(210 75% 45%)", "J"),
];

// ---------------- DESKS ----------------
export const DESK_SPRITES: SpriteAsset[] = [
  make("desk", "desk_admin", "Mesa Admin", "hsl(280 30% 35%)", "▭"),
  make("desk", "desk_engenharia", "Mesa Engenharia", "hsl(25 40% 35%)", "▭"),
  make("desk", "desk_juridico", "Mesa Jurídico", "hsl(220 30% 35%)", "▭"),
  make("desk", "meeting_table", "Mesa de Reunião", "hsl(160 30% 30%)", "◯"),
];

// ---------------- ROOMS ----------------
export const ROOM_SPRITES: SpriteAsset[] = [
  make("room", "meeting_room", "Sala de Reunião", "hsl(160 25% 25%)", "M"),
  make("room", "engineering_room", "Sala Engenharia", "hsl(25 25% 25%)", "E"),
  make("room", "legal_room", "Sala Jurídico", "hsl(220 25% 25%)", "J"),
];

// ---------------- BACKGROUNDS ----------------
export const BACKGROUND_SPRITES: SpriteAsset[] = [
  make("background", "workspace_admin", "Workspace Admin", "hsl(280 20% 15%)", ""),
  make("background", "workspace_engenharia", "Workspace Engenharia", "hsl(25 20% 15%)", ""),
  make("background", "workspace_juridico", "Workspace Jurídico", "hsl(220 20% 15%)", ""),
  make("background", "workspace_geral", "Workspace Geral", "hsl(0 0% 12%)", ""),
];

// ---------------- INDEX ----------------
export const ALL_SPRITES: SpriteAsset[] = [
  ...AVATAR_SPRITES,
  ...DESK_SPRITES,
  ...ROOM_SPRITES,
  ...BACKGROUND_SPRITES,
];

const SPRITE_BY_KEY: Record<string, SpriteAsset> = Object.fromEntries(
  ALL_SPRITES.map((s) => [s.key, s]),
);

export const getSprite = (key: string | null | undefined): SpriteAsset | null =>
  (key && SPRITE_BY_KEY[key]) || null;

export const getAvatarSprites = () => AVATAR_SPRITES;
export const getDeskSprites = () => DESK_SPRITES;
export const getRoomSprites = () => ROOM_SPRITES;
export const getBackgroundSprites = () => BACKGROUND_SPRITES;
