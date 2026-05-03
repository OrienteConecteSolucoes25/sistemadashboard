import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface MeetingLite {
  id: string;
  workspace_id: string;
  room_id: string | null;
  title: string;
  description: string | null;
  status: "scheduled" | "active" | "ended" | "cancelled" | string;
  created_by: string | null;
  created_at: string;
}

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  user_id: string;
  participant_status: "invited" | "accepted" | "declined" | "joined" | "left" | string;
  joined_at: string | null;
  left_at: string | null;
}

export interface InviteWithMeeting {
  participant: MeetingParticipant;
  meeting: MeetingLite;
}

interface UsePixelMeetingsOpts {
  workspaceId: string | null;
}

/**
 * Hook central para reuniões visuais do Pixel Office.
 * - Não usa videoconferência. Apenas estado lógico + visual em CSS.
 * - RLS já garante que o usuário só vê reuniões do seu workspace.
 */
export function usePixelMeetings({ workspaceId }: UsePixelMeetingsOpts) {
  const { user, isAdmin } = useAuth();
  const [meetings, setMeetings] = useState<MeetingLite[]>([]);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((n) => n + 1), []);

  // Carrega reuniões ativas/agendadas do workspace + participantes
  useEffect(() => {
    if (!workspaceId || !user) {
      setMeetings([]);
      setParticipants([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: ms } = await supabase
        .from("pixel_meetings")
        .select("*")
        .eq("workspace_id", workspaceId)
        .in("status", ["scheduled", "active"])
        .order("created_at", { ascending: false });
      const meetingIds = (ms ?? []).map((m) => m.id);
      let parts: MeetingParticipant[] = [];
      if (meetingIds.length > 0) {
        const { data: ps } = await supabase
          .from("pixel_meeting_participants")
          .select("*")
          .in("meeting_id", meetingIds);
        parts = (ps ?? []) as MeetingParticipant[];
      }
      if (cancelled) return;
      setMeetings((ms ?? []) as MeetingLite[]);
      setParticipants(parts);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, user, tick]);

  // Realtime — qualquer mudança em meetings/participants do workspace recarrega
  useEffect(() => {
    if (!workspaceId) return;
    const channel = supabase
      .channel(`pixel-meetings-${workspaceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pixel_meetings", filter: `workspace_id=eq.${workspaceId}` },
        () => refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pixel_meeting_participants" },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, refresh]);

  // -------- helpers --------
  const myInvites: InviteWithMeeting[] = (() => {
    if (!user) return [];
    return participants
      .filter(
        (p) =>
          p.user_id === user.id &&
          (p.participant_status === "invited" || p.participant_status === "accepted") &&
          !p.left_at,
      )
      .map((p) => ({ participant: p, meeting: meetings.find((m) => m.id === p.meeting_id)! }))
      .filter((x) => x.meeting && x.meeting.status !== "ended" && x.meeting.status !== "cancelled");
  })();

  const participantsOf = (meetingId: string) =>
    participants.filter((p) => p.meeting_id === meetingId);

  // -------- actions --------
  const createMeeting = useCallback(
    async (input: {
      title: string;
      description?: string;
      roomId: string | null;
      participantUserIds: string[];
    }) => {
      if (!workspaceId || !user) throw new Error("Sessão inválida");
      const { data: m, error } = await supabase
        .from("pixel_meetings")
        .insert({
          workspace_id: workspaceId,
          room_id: input.roomId,
          title: input.title,
          description: input.description ?? null,
          status: "active",
          created_by: user.id,
          starts_at: new Date().toISOString(),
        })
        .select("*")
        .single();
      if (error || !m) throw error ?? new Error("Falha ao criar reunião");

      // Criador entra como joined; demais como invited
      const ids = Array.from(new Set([user.id, ...input.participantUserIds]));
      const rows = ids.map((uid) => ({
        meeting_id: m.id,
        user_id: uid,
        participant_status: uid === user.id ? "joined" : "invited",
        joined_at: uid === user.id ? new Date().toISOString() : null,
      }));
      const { error: pErr } = await supabase.from("pixel_meeting_participants").insert(rows);
      if (pErr) console.error(pErr);

      // Status do criador → meeting
      await supabase.from("pixel_profiles").update({ status: "meeting" }).eq("user_id", user.id);
      refresh();
      return m as MeetingLite;
    },
    [workspaceId, user, refresh],
  );

  const acceptInvite = useCallback(
    async (participantId: string) => {
      if (!user) return;
      await supabase
        .from("pixel_meeting_participants")
        .update({
          participant_status: "joined",
          joined_at: new Date().toISOString(),
          left_at: null,
        })
        .eq("id", participantId)
        .eq("user_id", user.id);
      await supabase.from("pixel_profiles").update({ status: "meeting" }).eq("user_id", user.id);
      refresh();
    },
    [user, refresh],
  );

  const declineInvite = useCallback(
    async (participantId: string) => {
      if (!user) return;
      await supabase
        .from("pixel_meeting_participants")
        .update({ participant_status: "declined", left_at: new Date().toISOString() })
        .eq("id", participantId)
        .eq("user_id", user.id);
      refresh();
    },
    [user, refresh],
  );

  const leaveMeeting = useCallback(
    async (participantId: string) => {
      if (!user) return;
      await supabase
        .from("pixel_meeting_participants")
        .update({ participant_status: "left", left_at: new Date().toISOString() })
        .eq("id", participantId)
        .eq("user_id", user.id);
      await supabase.from("pixel_profiles").update({ status: "online" }).eq("user_id", user.id);
      refresh();
    },
    [user, refresh],
  );

  const endMeeting = useCallback(
    async (meetingId: string) => {
      if (!user) return;
      // Permitido a admin OU criador (RLS: admin pode tudo; criador pode atualizar via policy admin? — fallback: tenta e ignora erro)
      const { error } = await supabase
        .from("pixel_meetings")
        .update({ status: "ended", ends_at: new Date().toISOString() })
        .eq("id", meetingId);
      if (error) {
        console.error(error);
        throw error;
      }
      // Reverte status dos participantes ainda "joined"
      const joined = participants.filter(
        (p) => p.meeting_id === meetingId && p.participant_status === "joined" && !p.left_at,
      );
      if (joined.length > 0) {
        if (isAdmin) {
          await supabase
            .from("pixel_profiles")
            .update({ status: "online" })
            .in(
              "user_id",
              joined.map((p) => p.user_id),
            );
        } else {
          // usuário comum só pode mudar o próprio
          await supabase.from("pixel_profiles").update({ status: "online" }).eq("user_id", user.id);
        }
        await supabase
          .from("pixel_meeting_participants")
          .update({ participant_status: "left", left_at: new Date().toISOString() })
          .in(
            "id",
            joined.map((p) => p.id),
          );
      }
      refresh();
    },
    [user, isAdmin, participants, refresh],
  );

  return {
    loading,
    meetings,
    participants,
    myInvites,
    participantsOf,
    createMeeting,
    acceptInvite,
    declineInvite,
    leaveMeeting,
    endMeeting,
    refresh,
  };
}
