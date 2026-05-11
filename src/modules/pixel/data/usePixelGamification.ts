import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PixelAchievement {
  id: string;
  name: string;
  description: string;
  icon_key: string;
  points: number;
}

export interface UserAchievement {
  id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement: PixelAchievement;
}

export interface PixelGamificationData {
  points: number;
  level: number;
  xp: number;
  xp_to_next_level: number;
  unlocked_achievements: UserAchievement[];
  available_achievements: PixelAchievement[];
}

export function usePixelGamification(userId: string | null) {
  const [data, setData] = useState<PixelGamificationData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchGamification = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // 1. Perfil gamificado (pontos, level)
      const { data: profile } = await supabase
        .from("pixel_profiles")
        .select("points, level, xp")
        .eq("user_id", userId)
        .single();

      // 2. Conquistas desbloqueadas
      const { data: unlocked } = await supabase
        .from("pixel_user_achievements")
        .select("id, achievement_id, unlocked_at, achievement:pixel_achievements(*)")
        .eq("user_id", userId);

      // 3. Todas as conquistas para mostrar o que falta
      const { data: all } = await supabase
        .from("pixel_achievements")
        .select("*")
        .order("points", { ascending: true });

      if (profile) {
        setData({
          points: profile.points || 0,
          level: profile.level || 1,
          xp: profile.xp || 0,
          xp_to_next_level: (profile.level || 1) * 1000,
          unlocked_achievements: (unlocked || []) as any,
          available_achievements: (all || []) as any,
        });
      }
    } catch (error) {
      console.error("Error fetching gamification data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGamification();

    // Sincronização em tempo real para novos desbloqueios ou pontos
    const channel = supabase
      .channel(`pixel-gamification-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pixel_profiles", filter: `user_id=eq.${userId}` },
        () => fetchGamification()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pixel_user_achievements", filter: `user_id=eq.${userId}` },
        () => fetchGamification()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const addXP = async (amount: number) => {
    if (!userId) return;
    // RPC para adicionar XP com segurança no backend (evita race conditions)
    await supabase.rpc("add_pixel_xp", { _uid: userId, _amount: amount });
  };

  return { data, loading, refresh: fetchGamification, addXP };
}
