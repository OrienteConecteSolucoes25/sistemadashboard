import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AVATAR_CUSTOMIZATION_COLUMNS,
  customizationFromProfile,
} from "../core/avatarMapping";
import type { AvatarCustomization } from "../core/avatarOptions";

export interface CharacterFullDetails {
  user_id: string;
  display_name: string | null;
  job_title: string | null;
  age: number | null;
  show_age: boolean;
  linkedin_url: string | null;
  department: string | null;
  sector_description: string | null;
  avatar_sprite_key: string | null;
  status: string;
  group_name: string | null;
  group_color: string | null;
  desk_name: string | null;
  desk_id: string | null;
  last_moved_at: string | null;
  current_action: string | null;
  last_heartbeat?: string | null;
  is_online?: boolean;
  customization: AvatarCustomization;
}

/**
 * Busca os dados completos de um personagem ao abrir o painel lateral.
 * Uma única chamada (com selects aninhados via FK) — RLS já garante visibilidade.
 */
export function useCharacterDetails(userId: string | null) {
  const [data, setData] = useState<CharacterFullDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      // 3 selects pequenos em paralelo (perfil + posição + mesa do user)
      const [profileR, positionR, deskR] = await Promise.all([
        supabase
          .from("pixel_profiles")
          .select(
            `user_id, display_name, job_title, age, show_age, linkedin_url, department, sector_description, avatar_sprite_key, status, last_heartbeat, visibility_group_id, ${AVATAR_CUSTOMIZATION_COLUMNS}, visibility_groups:visibility_group_id(name, color)`,
          )
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("pixel_positions")
          .select("last_moved_at, current_action")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("pixel_desks")
          .select("id, desk_name")
          .eq("user_id", userId)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      const p: any = profileR.data;
      if (!p) {
        setData(null);
        setLoading(false);
        return;
      }

      setData({
        user_id: p.user_id,
        display_name: p.display_name,
        job_title: p.job_title,
        age: p.age,
        show_age: !!p.show_age,
        linkedin_url: p.linkedin_url,
        department: p.department,
        sector_description: p.sector_description,
        avatar_sprite_key: p.avatar_sprite_key,
        status: p.status,
        group_name: p.visibility_groups?.name ?? null,
        group_color: p.visibility_groups?.color ?? null,
        desk_name: deskR.data?.desk_name ?? null,
        desk_id: deskR.data?.id ?? null,
        last_moved_at: positionR.data?.last_moved_at ?? null,
        current_action: positionR.data?.current_action ?? null,
        customization: customizationFromProfile(p),
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { data, loading };
}
