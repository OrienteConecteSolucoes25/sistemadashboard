import { PixelSprite } from "../renderer/PixelSprite";
import { Badge } from "@/components/ui/badge";

export interface ParticipantRow {
  user_id: string;
  display_name: string | null;
  avatar_sprite_key: string | null;
  status: string;
}

const labelFor = (s: string) => {
  switch (s) {
    case "joined":
      return "Na sala";
    case "invited":
      return "Convidado";
    case "accepted":
      return "Aceito";
    case "declined":
      return "Recusou";
    case "left":
      return "Saiu";
    default:
      return s;
  }
};

const variantFor = (s: string): "default" | "secondary" | "outline" | "destructive" => {
  if (s === "joined" || s === "accepted") return "default";
  if (s === "declined" || s === "left") return "destructive";
  return "secondary";
};

export const PixelMeetingParticipants = ({ items }: { items: ParticipantRow[] }) => {
  if (items.length === 0) {
    return <div className="text-sm text-muted-foreground">Sem participantes ainda.</div>;
  }
  return (
    <ul className="space-y-2">
      {items.map((p) => (
        <li key={p.user_id} className="flex items-center gap-3 text-sm">
          <PixelSprite spriteKey={p.avatar_sprite_key} size={32} />
          <span className="flex-1 truncate">{p.display_name ?? "—"}</span>
          <Badge variant={variantFor(p.status)}>{labelFor(p.status)}</Badge>
        </li>
      ))}
    </ul>
  );
};
