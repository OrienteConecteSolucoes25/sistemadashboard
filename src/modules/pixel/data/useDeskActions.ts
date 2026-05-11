import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { DeskLite } from "./usePixelWorkspaceData";

/**
 * Ações em mesa: sentar, trabalhar, levantar.
 *
 * Regras de negócio:
 * - Usuário comum só interage com a própria mesa (desk.user_id === auth.uid()).
 * - Admin pode operar qualquer mesa em nome do dono.
 * - Salva apenas estado final em pixel_profiles.status e pixel_positions
 *   (current_action, is_sitting, position_x/y). Sem animação.
 */
export function useDeskActions(refresh?: () => void) {
  const { user, isAdmin } = useAuth();
  const [busy, setBusy] = useState(false);

  const canControl = (desk: DeskLite): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return desk.user_id === user.id;
  };

  const updateOccupant = async (
    desk: DeskLite,
    patch: {
      profileStatus: "online" | "working";
      currentAction: "idle" | "working" | "sitting";
      isSitting: boolean;
      moveToDesk: boolean;
    },
  ) => {
    if (!desk.user_id) {
      toast.error("Esta mesa não tem dono definido");
      return false;
    }
    if (!canControl(desk)) {
      toast.error("Você só pode interagir com a sua própria mesa");
      return false;
    }
    setBusy(true);
    try {
      // 1) Atualiza pixel_profiles.status
      const { error: profErr } = await supabase
        .from("pixel_profiles")
        .update({ status: patch.profileStatus })
        .eq("user_id", desk.user_id);
      if (profErr) throw profErr;

      // 2) Upsert pixel_positions
      const positionPayload = {
        user_id: desk.user_id,
        workspace_id: desk.workspace_id,
        current_action: patch.currentAction,
        is_sitting: patch.isSitting,
        last_moved_at: new Date().toISOString(),
        ...(patch.moveToDesk
          ? { position_x: desk.position_x, position_y: desk.position_y }
          : {}),
      };
      const { error: posErr } = await supabase
        .from("pixel_positions")
        .upsert(positionPayload, { onConflict: "user_id" });
      if (posErr) throw posErr;

      refresh?.();

      // Ganho de XP por trabalhar (Gamificação)
      if (patch.currentAction === "working" && desk.user_id) {
        supabase.rpc("add_pixel_xp", { _uid: desk.user_id, _amount: 20 });
      }

      return true;

    } catch (e: any) {
      toast.error("Erro: " + (e.message ?? "ação falhou"));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const sit = async (desk: DeskLite) => {
    const ok = await updateOccupant(desk, {
      profileStatus: "online",
      currentAction: "sitting",
      isSitting: true,
      moveToDesk: true,
    });
    if (ok) toast.success("Sentou na mesa");
  };

  const work = async (desk: DeskLite) => {
    const ok = await updateOccupant(desk, {
      profileStatus: "working",
      currentAction: "working",
      isSitting: true,
      moveToDesk: true,
    });
    if (ok) toast.success("Trabalhando");
  };

  const standUp = async (desk: DeskLite) => {
    const ok = await updateOccupant(desk, {
      profileStatus: "online",
      currentAction: "idle",
      isSitting: false,
      moveToDesk: false,
    });
    if (ok) toast.success("Levantou");
  };

  return { sit, work, standUp, canControl, busy };
}
