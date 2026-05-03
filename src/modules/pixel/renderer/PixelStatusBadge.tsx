import { Briefcase, Coffee, Video } from "lucide-react";
import type { PixelStatus } from "../core/constants";

interface Props {
  status: PixelStatus;
  size?: number;
}

const COLOR: Record<PixelStatus, string> = {
  online: "hsl(142 70% 45%)",
  offline: "hsl(0 0% 45%)",
  working: "hsl(210 80% 55%)",
  meeting: "hsl(280 70% 55%)",
  away: "hsl(45 90% 55%)",
  busy: "hsl(0 75% 55%)",
};

/**
 * Indicador de status pequeno e elegante.
 * Para working/meeting/away usa um ícone discreto; demais é só um ponto.
 */
export const PixelStatusBadge = ({ status, size = 10 }: Props) => {
  const color = COLOR[status];
  const Icon =
    status === "working" ? Briefcase : status === "meeting" ? Video : status === "away" ? Coffee : null;

  if (!Icon) {
    return (
      <span
        className="inline-block rounded-full ring-2 ring-background"
        style={{ width: size, height: size, background: color }}
      />
    );
  }

  return (
    <span
      className="inline-flex items-center justify-center rounded-full ring-2 ring-background text-white"
      style={{ width: size + 6, height: size + 6, background: color }}
    >
      <Icon style={{ width: size - 2, height: size - 2 }} />
    </span>
  );
};
