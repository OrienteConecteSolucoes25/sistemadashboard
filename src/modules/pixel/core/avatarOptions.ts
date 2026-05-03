/**
 * Avatar Builder — opções de personalização (frontend-only).
 *
 * Cada opção tem `key` (salva no banco) e `label` (UI).
 * Cores são valores HSL/HEX usados pelos sprites SVG em camadas.
 * Nenhuma chamada de banco aqui — tudo local.
 */

export interface AvatarOption {
  key: string;
  label: string;
}
export interface AvatarColorOption extends AvatarOption {
  value: string; // hex
}

// 1) Base
export const bodyOptions: AvatarOption[] = [
  { key: "base_01", label: "Base 1" },
  { key: "base_02", label: "Base 2" },
  { key: "base_03", label: "Base 3" },
];

// 2) Skin tone
export const skinToneOptions: AvatarColorOption[] = [
  { key: "skin_light", label: "Clara", value: "#f5d6b8" },
  { key: "skin_medium", label: "Média", value: "#e0b18a" },
  { key: "skin_tan", label: "Bronze", value: "#c08b5c" },
  { key: "skin_dark", label: "Escura", value: "#7a4a2a" },
];

// 3) Hair
export const hairOptions: AvatarOption[] = [
  { key: "hair_short", label: "Curto" },
  { key: "hair_medium", label: "Médio" },
  { key: "hair_long", label: "Longo" },
  { key: "hair_curly", label: "Cacheado" },
  { key: "hair_bun", label: "Coque" },
  { key: "hair_none", label: "Careca" },
];

// 4) Hair color
export const hairColorOptions: AvatarColorOption[] = [
  { key: "black", label: "Preto", value: "#1a1a1a" },
  { key: "brown", label: "Castanho", value: "#4a2c1a" },
  { key: "blonde", label: "Loiro", value: "#e8c878" },
  { key: "red", label: "Ruivo", value: "#a83a1a" },
  { key: "gray", label: "Grisalho", value: "#a0a0a0" },
];

// 5) Outfit (top)
export const outfitOptions: AvatarOption[] = [
  { key: "outfit_admin", label: "Admin" },
  { key: "outfit_engenharia", label: "Engenharia" },
  { key: "outfit_juridico", label: "Jurídico" },
  { key: "outfit_social", label: "Social" },
  { key: "outfit_operacional", label: "Operacional" },
  { key: "outfit_casual", label: "Casual" },
];

// 6) Outfit color
export const outfitColorOptions: AvatarColorOption[] = [
  { key: "purple", label: "Roxo", value: "#6b3fa0" },
  { key: "blue", label: "Azul", value: "#1f3a8a" },
  { key: "black", label: "Preto", value: "#1a1a1a" },
  { key: "white", label: "Branco", value: "#e8e8e8" },
  { key: "gray", label: "Cinza", value: "#5a5a5a" },
  { key: "orange", label: "Laranja", value: "#e87a1a" },
  { key: "green", label: "Verde", value: "#3b8c7a" },
];

// 7) Bottom
export const bottomOptions: AvatarColorOption[] = [
  { key: "pants_black", label: "Calça Preta", value: "#1f1830" },
  { key: "pants_blue", label: "Calça Azul", value: "#1f3a6a" },
  { key: "pants_gray", label: "Calça Cinza", value: "#3a3a45" },
  { key: "skirt_black", label: "Saia Preta", value: "#1a1a1a" },
  { key: "skirt_blue", label: "Saia Azul", value: "#2a4a8a" },
];

// 8) Shoes
export const shoesOptions: AvatarColorOption[] = [
  { key: "shoes_black", label: "Sapato Preto", value: "#0f0a18" },
  { key: "shoes_brown", label: "Sapato Marrom", value: "#5a3a1a" },
  { key: "shoes_boots", label: "Bota", value: "#2a1a0a" },
  { key: "shoes_safety", label: "Segurança", value: "#3a2a1a" },
];

// 9) Lipstick
export const lipstickOptions: AvatarColorOption[] = [
  { key: "lipstick_none", label: "Nenhum", value: "" },
  { key: "lipstick_red", label: "Vermelho", value: "#c41e3a" },
  { key: "lipstick_pink", label: "Rosa", value: "#e08aa8" },
  { key: "lipstick_wine", label: "Vinho", value: "#6b1a2a" },
  { key: "lipstick_nude", label: "Nude", value: "#b88070" },
];

// 10) Earring
export const earringOptions: AvatarColorOption[] = [
  { key: "earring_none", label: "Nenhum", value: "" },
  { key: "earring_small", label: "Pequeno", value: "#c0c0c0" },
  { key: "earring_gold", label: "Dourado", value: "#ffd166" },
  { key: "earring_silver", label: "Prata", value: "#d8d8d8" },
];

// 11) Glasses
export const glassesOptions: AvatarOption[] = [
  { key: "glasses_none", label: "Nenhum" },
  { key: "glasses_black", label: "Preto" },
  { key: "glasses_round", label: "Redondo" },
  { key: "glasses_safety", label: "Segurança" },
];

// 12) Hat / helmet
export const hatOptions: AvatarOption[] = [
  { key: "hat_none", label: "Nenhum" },
  { key: "hat_admin", label: "Admin" },
  { key: "helmet_white", label: "Capacete Branco" },
  { key: "helmet_yellow", label: "Capacete Amarelo" },
  { key: "helmet_blue", label: "Capacete Azul" },
  { key: "helmet_engineering", label: "Engenharia" },
];

// 13) Tool / accessory
export const toolOptions: AvatarOption[] = [
  { key: "tool_none", label: "Nenhum" },
  { key: "tool_notebook", label: "Notebook" },
  { key: "tool_clipboard", label: "Prancheta" },
  { key: "tool_folder", label: "Pasta" },
  { key: "tool_radio", label: "Rádio" },
  { key: "tool_badge", label: "Crachá" },
  { key: "tool_wrench", label: "Chave" },
];

export interface AvatarCustomization {
  avatar_body_key?: string | null;
  avatar_skin_tone?: string | null;
  avatar_hair_key?: string | null;
  avatar_hair_color?: string | null;
  avatar_outfit_key?: string | null;
  avatar_outfit_color?: string | null;
  avatar_bottom_key?: string | null;
  avatar_shoes_key?: string | null;
  avatar_lipstick_key?: string | null;
  avatar_earring_key?: string | null;
  avatar_glasses_key?: string | null;
  avatar_hat_key?: string | null;
  avatar_tool_key?: string | null;
  /** Mantido por compat / fallback — papel visual quando não há outfit. */
  avatar_sprite_key?: string | null;
}

export const DEFAULT_CUSTOMIZATION: AvatarCustomization = {
  avatar_body_key: "base_01",
  avatar_skin_tone: "skin_medium",
  avatar_hair_key: "hair_short",
  avatar_hair_color: "brown",
  avatar_outfit_key: "outfit_casual",
  avatar_outfit_color: "blue",
  avatar_bottom_key: "pants_black",
  avatar_shoes_key: "shoes_black",
  avatar_lipstick_key: "lipstick_none",
  avatar_earring_key: "earring_none",
  avatar_glasses_key: "glasses_none",
  avatar_hat_key: "hat_none",
  avatar_tool_key: "tool_none",
};

// Helpers de lookup
export const getColorValue = (
  options: AvatarColorOption[],
  key: string | null | undefined,
  fallback = "",
): string => options.find((o) => o.key === key)?.value ?? fallback;
