import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  usePixelWorkspaceData,
  type DeskLite,
  type PixelCharacter,
} from "../data/usePixelWorkspaceData";
import { useCharacterMovement } from "../data/useCharacterMovement";
import { usePixelMeetings } from "../data/usePixelMeetings";
import { PixelWorkspaceView } from "../renderer/PixelWorkspaceView";
import { PixelWorkspaceSelector } from "./PixelWorkspaceSelector";
import { PixelSidePanel } from "./PixelSidePanel";
import { PixelMeetingModal } from "./PixelMeetingModal";
import { PixelMeetingInvite } from "./PixelMeetingInvite";
import { PixelMeetingsPanel } from "./PixelMeetingsPanel";
import { PixelCommunityPanel } from "./PixelCommunityPanel";
import { DiretorAgentChat } from "@/modules/comunicacao/ui/DiretorAgentChat";

type Selected =
  | { kind: "character"; data: PixelCharacter }
  | { kind: "desk"; data: DeskLite }
  | null;

export default function PixelOfficePage() {
  const { user, isAdmin } = useAuth();
  const {
    loading,
    workspaces,
    activeWorkspace,
    setActiveWorkspaceId,
    characters,
    desks,
    rooms,
    refresh,
  } = usePixelWorkspaceData();

  const [selected, setSelected] = useState<Selected>(null);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [preselectInvitee, setPreselectInvitee] = useState<string | null>(null);

  const { moveTo, getPosition } = useCharacterMovement({
    workspaceId: activeWorkspace?.id ?? null,
    isAdmin,
  });

  const meetings = usePixelMeetings({ workspaceId: activeWorkspace?.id ?? null });

  // Realtime: posições de outros usuários
  useEffect(() => {
    if (!activeWorkspace?.id) return;
    const channel = supabase
      .channel(`pixel-positions-${activeWorkspace.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pixel_positions",
          filter: `workspace_id=eq.${activeWorkspace.id}`,
        },
        (payload) => {
          const row: any = payload.new ?? payload.old;
          if (row?.user_id === user?.id) return;
          refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeWorkspace?.id, user?.id, refresh]);

  // Personagens "em reunião" recebem badge meeting (via status do profile já vem)
  // Posicionar personagens joined dentro/perto da sala da reunião visualmente
  // (Para simplicidade, sala de reunião visual fica no painel lateral abaixo.)

  const handleStageClick = (tileX: number, tileY: number) => {
    if (!user?.id) return;
    moveTo(user.id, tileX, tileY);
  };

  const handleCallToMeeting = (userId: string) => {
    setPreselectInvitee(userId);
    setMeetingModalOpen(true);
    setSelected(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pixel Office OCS</h1>
          <p className="text-sm text-muted-foreground">
            Escritório virtual da Comunidade OCS — clique no piso para mover, nos personagens ou mesas para detalhes.
          </p>
        </div>
        <PixelWorkspaceSelector
          workspaces={workspaces}
          activeId={activeWorkspace?.id ?? null}
          onChange={setActiveWorkspaceId}
        />
      </div>

      {loading && <div className="text-muted-foreground">Carregando...</div>}

      {!loading && !activeWorkspace && (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum workspace disponível</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Você ainda não foi adicionado a nenhum grupo de visibilidade. Peça ao
            administrador para incluir você em um grupo.
          </CardContent>
        </Card>
      )}

      {activeWorkspace && (
        <>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>👤 {characters.length} personagens</span>
            <span>🪑 {desks.length} mesas</span>
            <span>🚪 {rooms.length} salas</span>
            <span>🎥 {meetings.meetings.length} reuniões</span>
          </div>
          <PixelWorkspaceView
            workspace={activeWorkspace}
            characters={characters}
            desks={desks}
            rooms={rooms}
            getPosition={(uid, fb) => getPosition(uid, fb)}
            onSelectCharacter={(c) => setSelected({ kind: "character", data: c })}
            onSelectDesk={(d) => setSelected({ kind: "desk", data: d })}
            onStageClick={handleStageClick}
          />

          <PixelMeetingsPanel
            meetings={meetings}
            characters={characters}
            onNewMeeting={() => {
              setPreselectInvitee(null);
              setMeetingModalOpen(true);
            }}
          />

          <PixelCommunityPanel activeWorkspace={activeWorkspace} workspaces={workspaces} />
        </>
      )}

      <PixelSidePanel
        selected={selected}
        onClose={() => setSelected(null)}
        onCallToMeeting={handleCallToMeeting}
        refresh={refresh}
      />

      <PixelMeetingModal
        open={meetingModalOpen}
        onOpenChange={setMeetingModalOpen}
        workspaceId={activeWorkspace?.id ?? null}
        visibilityGroupId={activeWorkspace?.visibility_group_id ?? null}
        rooms={rooms}
        workspaceCharacters={characters}
        meetings={meetings}
        preselectUserId={preselectInvitee}
      />

      <PixelMeetingInvite
        invites={meetings.myInvites}
        onAccept={meetings.acceptInvite}
        onDecline={meetings.declineInvite}
      />

      {/* NPC Pixel Diretor OCS — assistente flutuante de comunicação */}
      <DiretorAgentChat />
    </div>
  );
}
