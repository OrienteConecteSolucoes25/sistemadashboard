import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { STAGE_HEIGHT_TILES, STAGE_WIDTH_TILES } from "../core/constants";

/**
 * Lógica de movimento desacoplada da camada visual.
 * - Mantém posições locais (overrides) por user_id, atualizadas instantaneamente.
 * - A animação acontece no CSS (transition no avatar), não aqui.
 * - Persiste APENAS a posição final no banco (1 update por movimento).
 * - Preparado para trocar o renderer por PixiJS/Phaser: basta consumir
 *   `getPosition(userId)` e ignorar o cálculo CSS.
 */

export interface LocalPosition {
  x: number;
  y: number;
}

const clampX = (x: number) => Math.max(0, Math.min(STAGE_WIDTH_TILES - 2, Math.round(x)));
const clampY = (y: number) => Math.max(0, Math.min(STAGE_HEIGHT_TILES - 2, Math.round(y)));

export function useCharacterMovement(opts: {
  workspaceId: string | null;
  isAdmin: boolean;
}) {
  const { workspaceId, isAdmin } = opts;
  const { user } = useAuth();
  const [overrides, setOverrides] = useState<Record<string, LocalPosition>>({});
  const persistTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Limpa overrides ao trocar workspace
  useEffect(() => {
    setOverrides({});
    Object.values(persistTimers.current).forEach(clearTimeout);
    persistTimers.current = {};
  }, [workspaceId]);

  const canMove = useCallback(
    (userId: string) => isAdmin || (user?.id ? user.id === userId : false),
    [isAdmin, user?.id],
  );

  const persist = useCallback(
    async (userId: string, x: number, y: number) => {
      if (!workspaceId) return;
      // upsert por (user_id) — pixel_positions tem RLS por user
      const { error } = await supabase
        .from("pixel_positions")
        .upsert(
          {
            user_id: userId,
            workspace_id: workspaceId,
            position_x: x,
            position_y: y,
            last_moved_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      
      // Update heartbeat on move
      await supabase.rpc("update_pixel_heartbeat", { _uid: userId });
      if (error) console.error("[pixel] persist position error", error);
    },
    [workspaceId],
  );

  /**
   * Inicia movimento até (x,y). Atualiza posição local imediatamente.
   * O avatar se anima via CSS transition do estilo `left/top`.
   * Persiste APENAS a posição final (com pequeno debounce caso usuário clique
   * em vários pontos seguidos).
   */
  const moveTo = useCallback(
    (userId: string, rawX: number, rawY: number) => {
      if (!canMove(userId)) return false;
      const x = clampX(rawX);
      const y = clampY(rawY);

      setOverrides((prev) => ({ ...prev, [userId]: { x, y } }));

      // debounce de 350ms para agrupar cliques rápidos
      const existing = persistTimers.current[userId];
      if (existing) clearTimeout(existing);
      persistTimers.current[userId] = setTimeout(() => {
        persist(userId, x, y);
        delete persistTimers.current[userId];
      }, 350);
      return true;
    },
    [canMove, persist],
  );

  const getPosition = useCallback(
    (userId: string, fallback: LocalPosition): LocalPosition => {
      return overrides[userId] ?? fallback;
    },
    [overrides],
  );

  return { moveTo, getPosition, canMove };
}
