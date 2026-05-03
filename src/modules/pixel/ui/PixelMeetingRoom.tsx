import { PixelSprite } from "../renderer/PixelSprite";

export interface ParticipantAvatar {
  user_id: string;
  display_name: string | null;
  avatar_sprite_key: string | null;
  status: "joined" | "invited" | "declined" | "left" | string;
}

interface Props {
  participants: ParticipantAvatar[];
  size?: number;
}

/**
 * Composição visual em HTML/CSS: avatares pixel ao redor de uma "mesa de reunião".
 * Sem captura de imagem, sem canvas externo.
 */
export const PixelMeetingRoom = ({ participants, size = 320 }: Props) => {
  const joined = participants.filter((p) => p.status === "joined");
  const radius = size / 2 - 40;

  return (
    <div
      className="relative mx-auto rounded-full bg-muted/30 border-2 border-dashed border-primary/40"
      style={{ width: size, height: size }}
      aria-label="Sala de reunião visual"
    >
      {/* Mesa central */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-xs font-mono text-primary"
        style={{ width: size * 0.4, height: size * 0.4 }}
      >
        🪑 Mesa
      </div>

      {/* Avatares ao redor */}
      {joined.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          Aguardando participantes…
        </div>
      )}
      {joined.map((p, i) => {
        const angle = (i / Math.max(joined.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const cx = size / 2 + Math.cos(angle) * radius - 24;
        const cy = size / 2 + Math.sin(angle) * radius - 24;
        return (
          <div
            key={p.user_id}
            className="absolute flex flex-col items-center"
            style={{ left: cx, top: cy, width: 48 }}
            title={p.display_name ?? ""}
          >
            <PixelSprite spriteKey={p.avatar_sprite_key} size={48} />
            <div className="mt-1 text-[10px] font-medium truncate max-w-[60px] text-center">
              {p.display_name ?? "—"}
            </div>
          </div>
        );
      })}
    </div>
  );
};
