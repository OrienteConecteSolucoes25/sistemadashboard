import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Hook utilitário para registrar ações administrativas no Pixel Office.
 * Toda mutação sensível feita pelo admin deve passar por aqui para auditoria.
 * Backend continua protegido por RLS (admin manage policies); este registro
 * é complementar e fica em pixel_admin_actions.
 */
export function usePixelAdminLog() {
  const { user, isAdmin } = useAuth();

  const log = useCallback(
    async (
      action_type: string,
      opts?: { target_user_id?: string | null; description?: string; metadata?: Record<string, any> },
    ) => {
      if (!user || !isAdmin) return;
      const { error } = await supabase.from("pixel_admin_actions").insert({
        admin_user_id: user.id,
        target_user_id: opts?.target_user_id ?? null,
        action_type,
        description: opts?.description ?? null,
        metadata: opts?.metadata ?? null,
      });
      if (error) console.error("[admin-log]", error);
    },
    [user, isAdmin],
  );

  return { log };
}
