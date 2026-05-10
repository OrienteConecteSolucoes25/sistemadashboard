import * as PIXI from 'pixi.js';
import { pixiApp, PIXI_LAYERS } from './pixiApp';
import { TILE_SIZE } from '../core/constants';
import { deskKindFromKey } from '../core/pixelOfficeTheme';
import type { DeskLite } from '../data/usePixelWorkspaceData';

class PixiDesksManager {
  private desksMap: Map<string, PIXI.Container> = new Map();

  render(desks: DeskLite[]) {
    const container = pixiApp.getContainer(PIXI_LAYERS.DESKS);
    if (!container) return;

    const activeIds = new Set(desks.map(d => d.id));

    // Remove old
    for (const [id, sprite] of this.desksMap.entries()) {
      if (!activeIds.has(id)) {
        container.removeChild(sprite);
        this.desksMap.delete(id);
      }
    }

    // Update/Create
    desks.forEach(desk => {
      let deskContainer = this.desksMap.get(desk.id);
      if (!deskContainer) {
        deskContainer = this.createDeskSprite(desk);
        this.desksMap.set(desk.id, deskContainer);
        container.addChild(deskContainer);
      }
      this.updateDeskSprite(deskContainer, desk);
    });
  }

  private createDeskSprite(desk: DeskLite): PIXI.Container {
    const container = new PIXI.Container();
    container.label = `desk-${desk.id}`;
    container.eventMode = 'static';
    container.cursor = 'pointer';
    
    const graphics = new PIXI.Graphics();
    container.addChild(graphics);

    return container;
  }

  private updateDeskSprite(container: PIXI.Container, desk: DeskLite) {
    const graphics = container.children[0] as PIXI.Graphics;
    const kind = deskKindFromKey((desk as any).asset_key ?? null, desk.desk_type);
    
    const isMeeting = kind === "meeting";
    const tilesW = isMeeting ? 4 : 2;
    const tilesH = isMeeting ? 3 : 1.5;
    const w = tilesW * TILE_SIZE;
    const h = tilesH * TILE_SIZE;

    container.x = desk.position_x * TILE_SIZE;
    container.y = desk.position_y * TILE_SIZE;
    container.zIndex = (desk.z_index ?? 20) + (desk.position_y * 10);
    container.rotation = (desk.rotation || 0) * (Math.PI / 180);

    graphics.clear();
    
    // Draw table top (simplified rectangle for now)
    const color = kind === "meeting" ? 0xa07a52 : 0x8b5e3c;
    graphics.roundRect(0, 0, w, h, 4);
    graphics.fill(color);
    
    // Shadow
    graphics.rect(2, h + 2, w - 4, 4);
    graphics.fill({ color: 0x000000, alpha: 0.2 });

    if (desk.owner_display_name) {
      // Laptop indicator
      graphics.rect(w/2 - 8, h/2 - 6, 16, 12);
      graphics.fill(0x333333);
      graphics.rect(w/2 - 7, h/2 - 5, 14, 8);
      graphics.fill(0x00f2ff);
    }
  }
}

export const pixiDesks = new PixiDesksManager();
