import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminCharacterRow {
  user_id: string;
  display_name: string | null;
  job_title: string | null;
  department: string | null;
  avatar_sprite_key: string | null;
  status: string;
  is_visible: boolean;
  is_blocked: boolean;
  visibility_group_id: string | null;
  group_name?: string | null;
  group_color?: string | null;
  desk_id?: string | null;
  desk_name?: string | null;
  position_x?: number | null;
  position_y?: number | null;
  current_action?: string | null;
}

export interface AdminGroupRow {
  id: string;
  name: string;
  color: string;
}

export interface AdminWorkspaceRow {
  id: string;
  visibility_group_id: string;
  workspace_key: string;
  name: string;
}

export interface AdminDeskRow {
  id: string;
  workspace_id: string;
  user_id: string | null;
  desk_name: string | null;
  desk_type: string;
  position_x: number;
  position_y: number;
  is_active: boolean;
}

export interface AdminMessageRow {
  id: string;
  workspace_id: string;
  sender_user_id: string;
  message: string;
  created_at: string;
  is_deleted: boolean;
  sender_display_name?: string | null;
}

export interface AdminActionRow {
  id: string;
  admin_user_id: string;
  target_user_id: string | null;
  action_type: string;
  description: string | null;
  metadata: any;
  created_at: string;
  admin_name?: string | null;
}

/**
 * Hook único do painel admin. Carrega tudo necessário em consultas agrupadas.
 * RLS já permite admin ver tudo (admin manage policies).
 */
export function usePixelAdminData() {
  const [loading, setLoading] = useState(true);
  const [characters, setCharacters] = useState<AdminCharacterRow[]>([]);
  const [groups, setGroups] = useState<AdminGroupRow[]>([]);
  const [workspaces, setWorkspaces] = useState<AdminWorkspaceRow[]>([]);
  const [desks, setDesks] = useState<AdminDeskRow[]>([]);
  const [messages, setMessages] = useState<AdminMessageRow[]>([]);
  const [actions, setActions] = useState<AdminActionRow[]>([]);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [profilesR, groupsR, wsR, desksR, posR, messagesR, actionsR] = await Promise.all([
        supabase
          .from("pixel_profiles")
          .select(
            "user_id, display_name, job_title, department, avatar_sprite_key, status, is_visible, is_blocked, visibility_group_id",
          )
          .order("display_name"),
        supabase.from("visibility_groups").select("id, name, color").order("name"),
        supabase
          .from("pixel_workspaces")
          .select("id, visibility_group_id, workspace_key, name")
          .order("name"),
        supabase
          .from("pixel_desks")
          .select("id, workspace_id, user_id, desk_name, desk_type, position_x, position_y, is_active")
          .order("desk_name"),
        supabase
          .from("pixel_positions")
          .select("user_id, position_x, position_y, current_action"),
        supabase
          .from("pixel_messages")
          .select("id, workspace_id, sender_user_id, message, created_at, is_deleted")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("pixel_admin_actions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      if (cancelled) return;

      const groupMap = new Map((groupsR.data ?? []).map((g) => [g.id, g]));
      const deskByOwner = new Map<string, AdminDeskRow>();
      (desksR.data ?? []).forEach((d) => {
        if (d.user_id) deskByOwner.set(d.user_id, d as AdminDeskRow);
      });
      const posMap = new Map<string, any>();
      (posR.data ?? []).forEach((p) => posMap.set(p.user_id, p));

      const chars: AdminCharacterRow[] = (profilesR.data ?? []).map((p) => {
        const g = p.visibility_group_id ? groupMap.get(p.visibility_group_id) : null;
        const desk = deskByOwner.get(p.user_id);
        const pos = posMap.get(p.user_id);
        return {
          ...p,
          group_name: g?.name ?? null,
          group_color: g?.color ?? null,
          desk_id: desk?.id ?? null,
          desk_name: desk?.desk_name ?? null,
          position_x: pos?.position_x ?? null,
          position_y: pos?.position_y ?? null,
          current_action: pos?.current_action ?? null,
        };
      });

      const profMap = new Map((profilesR.data ?? []).map((p) => [p.user_id, p.display_name]));
      const msgs: AdminMessageRow[] = (messagesR.data ?? []).map((m) => ({
        ...m,
        sender_display_name: profMap.get(m.sender_user_id) ?? null,
      }));
      const acts: AdminActionRow[] = (actionsR.data ?? []).map((a) => ({
        ...a,
        admin_name: profMap.get(a.admin_user_id) ?? null,
      }));

      setCharacters(chars);
      setGroups((groupsR.data ?? []) as AdminGroupRow[]);
      setWorkspaces((wsR.data ?? []) as AdminWorkspaceRow[]);
      setDesks((desksR.data ?? []) as AdminDeskRow[]);
      setMessages(msgs);
      setActions(acts);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return { loading, characters, groups, workspaces, desks, messages, actions, refresh };
}
