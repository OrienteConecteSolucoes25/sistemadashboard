import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  AVATAR_CUSTOMIZATION_COLUMNS,
  customizationFromProfile,
} from "../core/avatarMapping";
import type { AvatarCustomization } from "../core/avatarOptions";

export interface WorkspaceLite {
  id: string;
  visibility_group_id: string;
  workspace_key: string;
  name: string;
  background_asset_key: string | null;
}

export interface PixelCharacter {
  user_id: string;
  display_name: string | null;
  job_title: string | null;
  avatar_sprite_key: string | null;
  status: string;
  is_visible: boolean;
  is_blocked: boolean;
  position_x: number;
  position_y: number;
  current_action: string;
  is_sitting: boolean;
  last_heartbeat?: string | null;
  is_online?: boolean;
  customization: AvatarCustomization;
}

export interface DeskLite {
  id: string;
  workspace_id: string;
  user_id: string | null;
  desk_name: string | null;
  desk_type: string;
  position_x: number;
  position_y: number;
  rotation: number;
  /** preenchido via join em memória */
  owner_display_name?: string | null;
  owner_status?: string | null;
  owner_is_sitting?: boolean | null;
  owner_current_action?: string | null;
}

export interface RoomLite {
  id: string;
  workspace_id: string;
  room_key: string;
  name: string;
  room_type: string;
  position_x: number;
  position_y: number;
  capacity: number;
}

interface UsePixelWorkspaceDataResult {
  loading: boolean;
  workspaces: WorkspaceLite[];
  activeWorkspace: WorkspaceLite | null;
  setActiveWorkspaceId: (id: string) => void;
  characters: PixelCharacter[];
  desks: DeskLite[];
  rooms: RoomLite[];
  refresh: () => void;
}

/**
 * Hook único para a tela do Pixel Office.
 * - Faz N consultas agrupadas por workspace (não 1 por avatar).
 * - RLS já filtra: usuário comum só recebe registros do(s) seu(s) grupo(s).
 * - Admin recebe todos os workspaces; pode alternar.
 */
export function usePixelWorkspaceData(): UsePixelWorkspaceDataResult {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<WorkspaceLite[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [characters, setCharacters] = useState<PixelCharacter[]>([]);
  const [desks, setDesks] = useState<DeskLite[]>([]);
  const [rooms, setRooms] = useState<RoomLite[]>([]);
  const [reloadTick, setReloadTick] = useState(0);
  const refresh = useCallback(() => setReloadTick((n) => n + 1), []);

  // Heartbeat em tempo real
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      await supabase.rpc("update_pixel_heartbeat", { _uid: user.id });
    }, 15000); // a cada 15 segundos
    return () => clearInterval(interval);
  }, [user]);

  // 1) Carregar workspaces visíveis
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: ws, error } = await supabase
        .from("pixel_workspaces")
        .select("id, visibility_group_id, workspace_key, name, background_asset_key")
        .eq("is_active", true)
        .order("name");
      if (cancelled) return;
      if (error) {
        console.error(error);
        setWorkspaces([]);
        setActiveId(null);
        setLoading(false);
        return;
      }
      const list = ws ?? [];
      setWorkspaces(list);
      // Default: 1º workspace (user comum só recebe os dele via RLS)
      if (list.length > 0) {
        setActiveId((curr) => curr ?? list[0].id);
      } else {
        setActiveId(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isAdmin]);

  // 2) Quando troca workspace ativo, carrega tudo dele em 3 queries agrupadas
  useEffect(() => {
    if (!activeId) {
      setCharacters([]);
      setDesks([]);
      setRooms([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const ws = workspaces.find((w) => w.id === activeId);
      if (!ws) return;

      // Personagens do grupo (perfis + posições no workspace ativo)
      const profilesP = supabase
        .from("pixel_profiles")
        .select(
          `user_id, display_name, job_title, avatar_sprite_key, status, is_visible, is_blocked, last_heartbeat, ${AVATAR_CUSTOMIZATION_COLUMNS}`,
        )
        .eq("visibility_group_id", ws.visibility_group_id)
        .eq("is_visible", true);

      const positionsP = supabase
        .from("pixel_positions")
        .select("user_id, position_x, position_y, current_action, is_sitting")
        .eq("workspace_id", activeId);

      const desksP = supabase
        .from("pixel_desks")
        .select("id, workspace_id, user_id, desk_name, desk_type, position_x, position_y, rotation")
        .eq("workspace_id", activeId)
        .eq("is_active", true);

      const roomsP = supabase
        .from("pixel_rooms")
        .select("id, workspace_id, room_key, name, room_type, position_x, position_y, capacity")
        .eq("workspace_id", activeId)
        .eq("is_active", true);

      const [profilesR, positionsR, desksR, roomsR] = await Promise.all([
        profilesP,
        positionsP,
        desksP,
        roomsP,
      ]);
      if (cancelled) return;

      const posMap = new Map<string, any>();
      (positionsR.data ?? []).forEach((p) => posMap.set(p.user_id, p));

      const chars: PixelCharacter[] = (profilesR.data ?? []).map((p) => {
        const pos = posMap.get(p.user_id);
        return {
          user_id: p.user_id,
          display_name: p.display_name,
          job_title: p.job_title,
          avatar_sprite_key: p.avatar_sprite_key,
          status: p.status,
          is_visible: p.is_visible,
          is_blocked: p.is_blocked,
          position_x: pos?.position_x ?? 4,
          position_y: pos?.position_y ?? 4,
          current_action: pos?.current_action ?? "idle",
          is_sitting: pos?.is_sitting ?? false,
          customization: customizationFromProfile(p),
        };
      });

      setCharacters(chars);

      // Enriquecer mesas com dados do dono
      const profileMap = new Map<string, any>();
      (profilesR.data ?? []).forEach((p) => profileMap.set(p.user_id, p));
      const enrichedDesks: DeskLite[] = (desksR.data ?? []).map((d) => {
        const owner = d.user_id ? profileMap.get(d.user_id) : null;
        const ownerPos = d.user_id ? posMap.get(d.user_id) : null;
        return {
          ...d,
          owner_display_name: owner?.display_name ?? null,
          owner_status: owner?.status ?? null,
          owner_is_sitting: ownerPos?.is_sitting ?? null,
          owner_current_action: ownerPos?.current_action ?? null,
        };
      });
      setDesks(enrichedDesks);
      setRooms(roomsR.data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId, workspaces, reloadTick]);

  const activeWorkspace = workspaces.find((w) => w.id === activeId) ?? null;

  return {
    loading,
    workspaces,
    activeWorkspace,
    setActiveWorkspaceId: setActiveId,
    characters,
    desks,
    rooms,
    refresh,
  };
}
