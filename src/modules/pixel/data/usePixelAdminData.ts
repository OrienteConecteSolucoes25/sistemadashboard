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

      // Escopo por empresa: equipe OCS (admin/financeiro_ocs sem vínculo) vê tudo;
      // demais usuários só veem grupos de visibilidade aos quais pertencem.
      const { data: { user } } = await supabase.auth.getUser();
      let allowedGroupIds: string[] | null = null;
      if (user) {
        const [{ data: rolesData }, { data: cu }, { data: ugs }] = await Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", user.id),
          (supabase as any).from("company_users").select("company_id").eq("user_id", user.id).maybeSingle(),
          supabase.from("user_visibility_groups").select("group_id").eq("user_id", user.id),
        ]);
        const rs = (rolesData ?? []).map((r: any) => r.role);
        const isOcsStaff = (rs.includes("admin") || rs.includes("financeiro_ocs")) && !cu?.company_id;
        if (!isOcsStaff) {
          allowedGroupIds = (ugs ?? []).map((g: any) => g.group_id);
        }
      } else {
        allowedGroupIds = [];
      }

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

      // Aplica escopo por grupos permitidos
      const inScope = (gid: string | null | undefined) =>
        allowedGroupIds === null ? true : !!gid && allowedGroupIds.includes(gid);
      const scopedProfiles = (profilesR.data ?? []).filter((p) => inScope(p.visibility_group_id));
      const scopedWs = (wsR.data ?? []).filter((w) => inScope(w.visibility_group_id));
      const scopedWsIds = new Set(scopedWs.map((w) => w.id));
      const scopedUserIds = new Set(scopedProfiles.map((p) => p.user_id));
      const scopedDesks = (desksR.data ?? []).filter(
        (d) => scopedWsIds.has(d.workspace_id) || (d.user_id && scopedUserIds.has(d.user_id)),
      );
      const scopedMsgs = (messagesR.data ?? []).filter((m) => scopedWsIds.has(m.workspace_id));
      const scopedActions = (actionsR.data ?? []).filter(
        (a: any) => !a.target_user_id || scopedUserIds.has(a.target_user_id),
      );

      const groupMap = new Map((groupsR.data ?? []).map((g) => [g.id, g]));
      const deskByOwner = new Map<string, AdminDeskRow>();
      scopedDesks.forEach((d) => {
        if (d.user_id) deskByOwner.set(d.user_id, d as AdminDeskRow);
      });
      const posMap = new Map<string, any>();
      (posR.data ?? []).filter((p) => scopedUserIds.has(p.user_id)).forEach((p) => posMap.set(p.user_id, p));

      const chars: AdminCharacterRow[] = scopedProfiles.map((p) => {
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

      const profMap = new Map(scopedProfiles.map((p) => [p.user_id, p.display_name]));
      const scopedGroups = allowedGroupIds === null
        ? (groupsR.data ?? [])
        : (groupsR.data ?? []).filter((g) => allowedGroupIds!.includes(g.id));
      const msgs: AdminMessageRow[] = scopedMsgs.map((m) => ({
        ...m,
        sender_display_name: profMap.get(m.sender_user_id) ?? null,
      }));
      const acts: AdminActionRow[] = scopedActions.map((a: any) => ({
        ...a,
        admin_name: profMap.get(a.admin_user_id) ?? null,
      }));

      setCharacters(chars);
      setGroups(scopedGroups as AdminGroupRow[]);
      setWorkspaces(scopedWs as AdminWorkspaceRow[]);
      setDesks(scopedDesks as AdminDeskRow[]);
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
