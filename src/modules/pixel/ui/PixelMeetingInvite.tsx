import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Check, X } from "lucide-react";
import type { InviteWithMeeting } from "../data/usePixelMeetings";

interface Props {
  invites: InviteWithMeeting[];
  onAccept: (participantId: string) => void;
  onDecline: (participantId: string) => void;
}

/**
 * Notificação visual dentro do Pixel Office para convites pendentes.
 */
export const PixelMeetingInvite = ({ invites, onAccept, onDecline }: Props) => {
  const pending = invites.filter((i) => i.participant.participant_status === "invited");
  if (pending.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 max-w-sm">
      {pending.map(({ participant, meeting }) => (
        <Card key={participant.id} className="border-primary/40 shadow-lg animate-fade-in">
          <CardContent className="p-3 flex items-start gap-3">
            <div className="p-2 rounded-md bg-primary/15 text-primary">
              <Video className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{meeting.title}</div>
              {meeting.description && (
                <p className="text-xs text-muted-foreground truncate">{meeting.description}</p>
              )}
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => onAccept(participant.id)}>
                  <Check className="w-3 h-3" /> Entrar
                </Button>
                <Button size="sm" variant="outline" onClick={() => onDecline(participant.id)}>
                  <X className="w-3 h-3" /> Recusar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
