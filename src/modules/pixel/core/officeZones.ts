/**
 * Mapa lógico do escritório virtual (Leva 3).
 * Define 9 zonas nomeadas em coordenadas de tile.
 * Único ponto de verdade — usado por DOM (PixelOfficeMap) e PixiJS (pixiMap).
 */
import { TILE_SIZE, STAGE_WIDTH_TILES, STAGE_HEIGHT_TILES } from "./constants";
import { OFFICE_THEME } from "./pixelOfficeTheme";

export interface OfficeZone {
  id: string;
  label: string;
  /** tile x */ tx: number;
  /** tile y */ ty: number;
  /** tile w */ tw: number;
  /** tile h */ th: number;
  color: string;
  alpha: number;
}

// Layout em 3 faixas: topo (5t), centro (4t), base (6t) — total 15 + 1t parede topo = 16
export const OFFICE_ZONES: OfficeZone[] = [
  // ---- Faixa superior (y 1..6) ----
  { id: "recepcao",    label: "Recepção",          tx: 0,  ty: 1,  tw: 5, th: 5, color: OFFICE_THEME.carpetReception, alpha: 0.18 },
  { id: "engenharia",  label: "Engenharia",        tx: 5,  ty: 1,  tw: 7, th: 5, color: OFFICE_THEME.carpetEngineer,  alpha: 0.16 },
  { id: "ti",          label: "Sala Técnica · TI", tx: 12, ty: 1,  tw: 6, th: 5, color: OFFICE_THEME.carpetIT,        alpha: 0.16 },
  { id: "diretoria",   label: "Diretoria",         tx: 18, ty: 1,  tw: 6, th: 5, color: OFFICE_THEME.carpetMeeting,   alpha: 0.14 },

  // ---- Faixa central (y 6..10) ----
  { id: "operacional", label: "Mesas Operacionais", tx: 0, ty: 6, tw: 24, th: 4, color: OFFICE_THEME.carpetCommon,    alpha: 0.10 },

  // ---- Faixa inferior (y 10..16) ----
  { id: "cafe",        label: "Café · Lounge",     tx: 0,  ty: 10, tw: 5, th: 6, color: OFFICE_THEME.carpetCommon,    alpha: 0.18 },
  { id: "juridico",    label: "Jurídico",          tx: 5,  ty: 10, tw: 6, th: 6, color: OFFICE_THEME.carpetLegal,     alpha: 0.16 },
  { id: "reunioes",    label: "Sala de Reuniões",  tx: 11, ty: 10, tw: 7, th: 6, color: OFFICE_THEME.carpetMeeting,   alpha: 0.16 },
  { id: "agentes",     label: "Sala dos Agentes",  tx: 18, ty: 10, tw: 6, th: 6, color: OFFICE_THEME.carpetHR,        alpha: 0.16 },
];

export const zonePx = (z: OfficeZone) => ({
  x: z.tx * TILE_SIZE,
  y: z.ty * TILE_SIZE,
  w: z.tw * TILE_SIZE,
  h: z.th * TILE_SIZE,
});

export const STAGE_W = STAGE_WIDTH_TILES * TILE_SIZE;
export const STAGE_H = STAGE_HEIGHT_TILES * TILE_SIZE;
