import * as PIXI from 'pixi.js';
import { pixiApp, PIXI_LAYERS } from './pixiApp';
import { TILE_SIZE } from '../core/constants';
import { deskKindFromKey, type DeskKind } from '../core/pixelOfficeTheme';
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

    // Label container
    const label = new PIXI.Text({
      text: '',
    });
    label.style = new PIXI.TextStyle({
      fontFamily: 'Orbitron, Arial',
      fontSize: 9,
      fill: 0xffffff,
      fontWeight: '500',
    });
    label.label = 'label';
    label.anchor.set(0.5, 0);
    label.alpha = 0.7;
    container.addChild(label);

    return container;
  }

  private updateDeskSprite(container: PIXI.Container, desk: DeskLite) {
    if (!container || container.destroyed) return;
    const graphics = container.children[0] as PIXI.Graphics | undefined;
    const label = container.children[1] as PIXI.Text | undefined;
    if (!graphics || !label) return;
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
    
    if (kind === "meeting") {
      this.drawMeetingTable(graphics, w, h);
    } else {
      this.drawStandardDesk(graphics, kind, w, h, !!desk.owner_display_name);
    }

    // Label update
    if (desk.owner_display_name) {
      label.text = desk.owner_display_name;
      label.x = w / 2;
      label.y = h + 4;
      label.visible = true;
    } else {
      label.visible = false;
    }
  }

  private drawStandardDesk(g: PIXI.Graphics, kind: DeskKind, w: number, h: number, isOccupied: boolean) {
    const wood = 0x8b5e3c;
    const woodLight = 0xa07a52;
    const woodDark = 0x5d3a1a;
    const shadow = 0x000000;

    // Sombra no chão
    g.rect(2, 18, 28, 4);
    g.fill({ color: shadow, alpha: 0.3 });

    // Pernas
    g.rect(4, 14, 2, 6);
    g.rect(26, 14, 2, 6);
    g.rect(4, 12, 24, 2);
    g.fill(woodDark);

    // Tampo (Pseudo-iso)
    const points = [
      { x: 2, y: 12 },
      { x: 6, y: 4 },
      { x: 30, y: 4 },
      { x: 26, y: 12 }
    ];
    g.poly(points);
    g.fill(woodLight);

    g.rect(2, 12, 24, 2);
    g.fill(wood);

    g.rect(26, 4, 4, 8);
    g.fill({ color: woodDark, alpha: 0.3 });

    // Objects conforme o tipo (match DOM)
    if (kind === "admin") {
      // Dual Monitor
      g.rect(8, 2, 8, 6);
      g.fill(0x1a1a1a);
      g.rect(9, 3, 6, 4);
      g.fill(0x3a8acb);
      g.rect(17, 3, 8, 6);
      g.fill(0x1a1a1a);
      g.rect(18, 4, 6, 4);
      g.fill(0x3a8acb);
      // Keyboard
      g.rect(10, 10, 10, 1);
      g.fill(0x444444);
    } else if (kind === "engenharia") {
      // Planta Técnica / Rolo
      g.roundRect(18, 6, 10, 3, 1);
      g.fill(0xf5e9c8);
      // Notebook Robusto
      g.rect(7, 4, 9, 7);
      g.fill(0x2a2a2a);
      g.rect(8, 5, 7, 5);
      g.fill(0xf59e0b);
    } else if (kind === "juridico") {
      // Arquivos empilhados
      g.rect(8, 4, 8, 6);
      g.fill(0xffffff);
      g.rect(9, 2, 8, 6);
      g.fill(0xf5f5f5);
    } else if (isOccupied || kind === "default") {
      // Laptop slim
      g.rect(11, 5, 10, 6);
      g.fill(0x333333);
      g.rect(12, 6, 8, 4);
      g.fill(0x60a5fa);
    }
  }

  private drawMeetingTable(g: PIXI.Graphics, w: number, h: number) {
    const top = 0xa07a52;
    const topShade = 0x6b4a2e;
    const chair = 0x5a3a8a;

    g.ellipse(32, 36, 28, 3);
    g.fill({ color: 0x000000, alpha: 0.35 });

    // Chairs
    [14, 29, 44].forEach(x => {
      g.rect(x, 6, 6, 4);
      g.rect(x, 30, 6, 4);
      g.fill(chair);
    });

    // Oval Table
    g.ellipse(32, 20, 22, 9);
    g.fill(top);
    g.ellipse(32, 22, 22, 9);
    g.fill({ color: topShade, alpha: 0.5 });
    
    // Items
    g.rect(22, 17, 4, 3);
    g.rect(38, 17, 4, 3);
    g.fill(0x1a1a1a);
  }
}

export const pixiDesks = new PixiDesksManager();
