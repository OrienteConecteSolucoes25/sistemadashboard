export const TILE_SIZE = 32;
export const STAGE_WIDTH_TILES = 24;
export const STAGE_HEIGHT_TILES = 16;
export const STAGE_WIDTH_PX = TILE_SIZE * STAGE_WIDTH_TILES;
export const STAGE_HEIGHT_PX = TILE_SIZE * STAGE_HEIGHT_TILES;

export type PixelStatus = "online" | "offline" | "working" | "meeting" | "away" | "busy";

export const STATUS_LABEL: Record<PixelStatus, string> = {
  online: "Online",
  offline: "Offline",
  working: "Trabalhando",
  meeting: "Em reunião",
  away: "Ausente",
  busy: "Ocupado",
};

export const STATUS_COLOR: Record<PixelStatus, string> = {
  online: "hsl(142 70% 45%)",
  offline: "hsl(0 0% 50%)",
  working: "hsl(210 80% 55%)",
  meeting: "hsl(280 70% 55%)",
  away: "hsl(45 90% 55%)",
  busy: "hsl(0 75% 55%)",
};
