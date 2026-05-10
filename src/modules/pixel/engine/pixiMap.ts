import * as PIXI from 'pixi.js';
import { pixiApp, PIXI_LAYERS } from './pixiApp';
import { STAGE_WIDTH_PX, STAGE_HEIGHT_PX, TILE_SIZE } from '../core/constants';
import { OFFICE_THEME } from '../core/pixelOfficeTheme';

export const pixiMap = {
  render() {
    const container = pixiApp.getContainer(PIXI_LAYERS.FLOOR);
    if (!container) return;

    container.removeChildren();

    // Background
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, STAGE_WIDTH_PX, STAGE_HEIGHT_PX);
    bg.fill(this.hexToNumber(OFFICE_THEME.floorBase));
    container.addChild(bg);

    // Grid
    const grid = new PIXI.Graphics();
    grid.setStrokeStyle({ width: 1, color: this.hexToNumber(OFFICE_THEME.floorTileLine), alpha: 0.5 });
    
    for (let x = 0; x <= STAGE_WIDTH_PX; x += TILE_SIZE) {
      grid.moveTo(x, 0);
      grid.lineTo(x, STAGE_HEIGHT_PX);
    }
    for (let y = 0; y <= STAGE_HEIGHT_PX; y += TILE_SIZE) {
      grid.moveTo(0, y);
      grid.lineTo(STAGE_WIDTH_PX, y);
    }
    grid.stroke();
    container.addChild(grid);

    // Zones (Simplified Rects for now)
    this.drawZone(container, 0, TILE_SIZE, TILE_SIZE * 6, TILE_SIZE * 5, OFFICE_THEME.carpetReception, 0.3);
    this.drawZone(container, 0, STAGE_HEIGHT_PX - TILE_SIZE * 5, TILE_SIZE * 5, TILE_SIZE * 5, OFFICE_THEME.carpetCommon, 0.2);
    this.drawZone(container, TILE_SIZE * 7, TILE_SIZE, TILE_SIZE * 8, TILE_SIZE * 4, OFFICE_THEME.carpetEngineer, 0.15);
    this.drawZone(container, TILE_SIZE * 6, STAGE_HEIGHT_PX - TILE_SIZE * 6, TILE_SIZE * 7, TILE_SIZE * 5, OFFICE_THEME.carpetLegal, 0.15);
    this.drawZone(container, STAGE_WIDTH_PX - TILE_SIZE * 7, TILE_SIZE, TILE_SIZE * 7, TILE_SIZE * 5, OFFICE_THEME.carpetIT, 0.15);
    this.drawZone(container, STAGE_WIDTH_PX - TILE_SIZE * 9, STAGE_HEIGHT_PX - TILE_SIZE * 8, TILE_SIZE * 9, TILE_SIZE * 8, OFFICE_THEME.carpetMeeting, 0.1);
  },

  drawZone(container: PIXI.Container, x: number, y: number, w: number, h: number, color: string, alpha: number) {
    const zone = new PIXI.Graphics();
    zone.rect(x, y, w, h);
    zone.fill({ color: this.hexToNumber(color), alpha });
    container.addChild(zone);
  },

  hexToNumber(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
  }
};
