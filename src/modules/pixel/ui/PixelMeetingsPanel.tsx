import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Video, LogOut, Square } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { usePixelMeetings, MeetingLite } from "../data/usePixelMeetings";
import type { PixelCharacter } from "../data/usePixelWorkspaceData";
import { PixelMeetingRoom } from "./PixelMeetingRoom";
import { PixelMeetingParticipants } from "./PixelMeetingParticipants";

interface Props {
  meetings: ReturnType<typeof usePixelMeetings>;
  characters: PixelCharacter[];
  onNewMeeting: () => void;
}

/**
 * Painel lista as reuniões ativas do workspace.
 * Cada reunião expande para mostrar a "PixelMeetingRoom" visual.
 */
export const PixelMeetingsPanel = ({ meetings, characters, onNewMeeting }: Props) => {
  const { user, isAdmin } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const charById = new Map(characters.map((c) => [c.user_id, c]));

  const myParticipantOf = (m: MeetingLite) =>
    meetings.participants.find(
      (p) => p.meeting_id === m.id && p.user_id === user?.id && !p.left_at,
    );

  const active = meetings.meetings;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Video className="w-4 h-4" /> Reuniões ativas
        </CardTitle>
        <Button size="sm" onClick={onNewMeeting}>
          <Plus className="w-3.5 h-3.5" /> Nova reunião
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {active.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma reunião ativa no momento.</p>
        )}

        {active.map((m) => {
          const parts = meetings.participantsOf(m.id).map((p) => {
            const c = charById.get(p.user_id);
            return {
              user_id: p.user_id,
              display_name: c?.display_name ?? null,
              avatar_sprite_key: c?.avatar_sprite_key ?? null,
              status: p.participant_status,
            };
          });
          const me = myParticipantOf(m);
          const isCreator = m.created_by === user?.id;
          const expanded = expandedId === m.id;

          return (
            <div key={m.id} className="border rounded-md p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate flex items-center gap-2">
                    {m.title}
                    <Badge variant="outline">{m.status}</Badge>
                  </div>
                  {m.description && (
                    <p className="text-xs text-muted-foreground truncate">{m.description}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setExpandedId(expanded ? null : m.id)}
                >
                  {expanded ? "Recolher" : "Ver sala"}
                </Button>
              </div>

              {expanded && (
                <div className="mt-3 space-y-3">
                  <PixelMeetingRoom participants={parts} size={280} />
                  <PixelMeetingParticipants items={parts} />
                  <div className="flex flex-wrap gap-2">
                    {me?.participant_status === "joined" ? (
                      <Button size="sm" variant="outline" onClick={() => meetings.leaveMeeting(me.id)}>
                        <LogOut className="w-3.5 h-3.5" /> Sair
                      </Button>
                    ) : me?.participant_status === "invited" ? (
                      <>
                        <Button size="sm" onClick={() => meetings.acceptInvite(me.id)}>
                          Entrar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => meetings.declineInvite(me.id)}>
                          Recusar
                        </Button>
                      </>
                    ) : null}

                    {(isAdmin || isCreator) && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => meetings.endMeeting(m.id)}
                      >
                        <Square className="w-3.5 h-3.5" /> Encerrar reunião
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
