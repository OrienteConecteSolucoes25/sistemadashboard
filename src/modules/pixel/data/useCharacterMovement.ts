import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { STAGE_HEIGHT_TILES, STAGE_WIDTH_TILES } from "../core/constants";
import { movementEngine } from "../engine/movementEngine";
import { mapEngine } from "../engine/mapEngine";

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
  const movementIntervals = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const currentPosRef = useRef<Record<string, LocalPosition>>({});

  // Limpa overrides ao trocar workspace
  useEffect(() => {
    setOverrides({});
    Object.values(persistTimers.current).forEach(clearTimeout);
    Object.values(movementIntervals.current).forEach(clearInterval);
    persistTimers.current = {};
    movementIntervals.current = {};
    currentPosRef.current = {};
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
      const targetX = clampX(rawX);
      const targetY = clampY(rawY);

      // Limpa movimento anterior se houver
      if (movementIntervals.current[userId]) {
        clearInterval(movementIntervals.current[userId]);
      }

      // Posição atual (do override ou do fallback se for a primeira vez)
      // Nota: o fallback real deve vir dos characters carregados, mas aqui o hook é agnóstico.
      // Assumimos que o chamador sabe a posição inicial ou que ela está no overrides.
      const current = overrides[userId] || { x: 4, y: 4 }; // Fallback seguro
      
      const path = movementEngine.calculatePath(current, { x: targetX, y: targetY });
      if (path.length === 0) return false;

      let step = 0;
      movementIntervals.current[userId] = setInterval(() => {
        if (step >= path.length) {
          clearInterval(movementIntervals.current[userId]);
          delete movementIntervals.current[userId];
          
          // Persiste posição final no banco (com debounce para não floodar)
          const lastPoint = path[path.length - 1];
          const existing = persistTimers.current[userId];
          if (existing) clearTimeout(existing);
          persistTimers.current[userId] = setTimeout(() => {
            persist(userId, lastPoint.x, lastPoint.y);
            delete persistTimers.current[userId];
          }, 500);
          return;
        }

        const nextPoint = path[step];
        setOverrides((prev) => ({ ...prev, [userId]: nextPoint }));
        
        // Broadcast para outros usuários
        if (workspaceId) {
          supabase.channel(`workspace-${workspaceId}`).send({
            type: "broadcast",
            event: "player-move",
            payload: { userId, x: nextPoint.x, y: nextPoint.y },
          });
        }

        step++;
      }, 200); // 200ms por tile (velocidade do personagem)

      return true;
    },
    [canMove, persist, overrides, workspaceId],
  );

  const getPosition = useCallback(
    (userId: string, fallback: LocalPosition): LocalPosition => {
      return overrides[userId] ?? fallback;
    },
    [overrides],
  );

  const setTyping = useCallback(
    async (isTyping: boolean) => {
      if (!user?.id || !workspaceId) return;
      await supabase
        .from("pixel_positions")
        .update({ is_typing: isTyping } as any)
        .eq("user_id", user.id);
    },
    [user?.id, workspaceId]
  );

  return { moveTo, getPosition, canMove, setTyping };
}
