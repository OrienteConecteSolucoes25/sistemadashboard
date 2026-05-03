import type { AvatarCustomization } from "../core/avatarOptions";
import { DEFAULT_CUSTOMIZATION } from "../core/avatarOptions";
import { roleFromSpriteKey } from "./pixelOfficeTheme";

/**
 * Extrai um AvatarCustomization a partir de um row de pixel_profiles.
 * Faz fallback para defaults sensíveis baseados no sprite_key (papel) quando
 * o usuário ainda não personalizou nada.
 */
export function customizationFromProfile(p: any): AvatarCustomization {
  if (!p) return { ...DEFAULT_CUSTOMIZATION };
  const role = roleFromSpriteKey(p.avatar_sprite_key);
  // Defaults coerentes por papel quando o usuário não customizou
  const roleDefault: Partial<AvatarCustomization> =
    role === "admin"
      ? { avatar_outfit_key: "outfit_admin", avatar_outfit_color: "purple" }
      : role === "engenharia"
      ? {
          avatar_outfit_key: "outfit_engenharia",
          avatar_outfit_color: "orange",
          avatar_hat_key: "helmet_engineering",
        }
      : role === "juridico"
      ? { avatar_outfit_key: "outfit_juridico", avatar_outfit_color: "blue" }
      : {};

  return {
    avatar_sprite_key: p.avatar_sprite_key ?? null,
    avatar_body_key: p.avatar_body_key ?? DEFAULT_CUSTOMIZATION.avatar_body_key,
    avatar_skin_tone: p.avatar_skin_tone ?? DEFAULT_CUSTOMIZATION.avatar_skin_tone,
    avatar_hair_key: p.avatar_hair_key ?? DEFAULT_CUSTOMIZATION.avatar_hair_key,
    avatar_hair_color: p.avatar_hair_color ?? DEFAULT_CUSTOMIZATION.avatar_hair_color,
    avatar_outfit_key:
      p.avatar_outfit_key ?? roleDefault.avatar_outfit_key ?? DEFAULT_CUSTOMIZATION.avatar_outfit_key,
    avatar_outfit_color:
      p.avatar_outfit_color ??
      roleDefault.avatar_outfit_color ??
      DEFAULT_CUSTOMIZATION.avatar_outfit_color,
    avatar_bottom_key: p.avatar_bottom_key ?? DEFAULT_CUSTOMIZATION.avatar_bottom_key,
    avatar_shoes_key: p.avatar_shoes_key ?? DEFAULT_CUSTOMIZATION.avatar_shoes_key,
    avatar_lipstick_key: p.avatar_lipstick_key ?? DEFAULT_CUSTOMIZATION.avatar_lipstick_key,
    avatar_earring_key: p.avatar_earring_key ?? DEFAULT_CUSTOMIZATION.avatar_earring_key,
    avatar_glasses_key: p.avatar_glasses_key ?? DEFAULT_CUSTOMIZATION.avatar_glasses_key,
    avatar_hat_key:
      p.avatar_hat_key ?? roleDefault.avatar_hat_key ?? DEFAULT_CUSTOMIZATION.avatar_hat_key,
    avatar_tool_key: p.avatar_tool_key ?? DEFAULT_CUSTOMIZATION.avatar_tool_key,
  };
}

export const AVATAR_CUSTOMIZATION_COLUMNS =
  "avatar_body_key, avatar_skin_tone, avatar_hair_key, avatar_hair_color, avatar_outfit_key, avatar_outfit_color, avatar_bottom_key, avatar_shoes_key, avatar_lipstick_key, avatar_earring_key, avatar_glasses_key, avatar_hat_key, avatar_tool_key";
