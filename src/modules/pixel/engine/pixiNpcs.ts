import * as PIXI from 'pixi.js';
import { pixiApp, PIXI_LAYERS } from './pixiApp';
import { TILE_SIZE, STAGE_WIDTH_PX } from '../core/constants';
import { NPCS_CONFIG } from '../data/npcsConfig';

class PixiNpcManager {
  private npcsMap: Map<string, PIXI.Container> = new Map();
  private prevPositions: Map<string, { x: number, y: number }> = new Map();
  private initialized = false;

  private setupTicker() {
    if (this.initialized) return;
    const app = pixiApp.getApp();
    if (!app) return;

    app.ticker.add((ticker) => {
      this.npcsMap.forEach((container, npcId) => {
        const targetX = (container as any).targetX;
        const targetY = (container as any).targetY;
        
        if (targetX !== undefined && targetY !== undefined) {
          const dx = targetX - container.x;
          const dy = targetY - container.y;
          
          if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
            container.x += dx * 0.05 * ticker.deltaTime;
            container.y += dy * 0.05 * ticker.deltaTime;
            container.zIndex = container.y * 10 + 110; // NPCs slightly above players usually
          } else {
            container.x = targetX;
            container.y = targetY;
          }
        }

        // Floating animation
        const time = performance.now() / 1000;
        const graphics = container.children[0] as PIXI.Graphics;
        if (graphics) {
          graphics.y = Math.sin(time * 2 + (parseInt(npcId.length.toString()) * 0.5)) * 3;
        }
      });
    });
    this.initialized = true;
  }

  render() {
    const container = pixiApp.getContainer(PIXI_LAYERS.CHARACTERS);
    if (!container) return;

    this.setupTicker();

    Object.values(NPCS_CONFIG).forEach(npc => {
      let npcContainer = this.npcsMap.get(npc.id);
      if (!npcContainer) {
        npcContainer = this.createNpcSprite(npc);
        this.npcsMap.set(npc.id, npcContainer);
        container.addChild(npcContainer);
        
        // Initial position
        const startX = Math.floor((npc.startX / 100) * STAGE_WIDTH_PX / TILE_SIZE);
        const startY = 12; // Adjusted row
        
        npcContainer.x = startX * TILE_SIZE + TILE_SIZE / 2;
        npcContainer.y = startY * TILE_SIZE + TILE_SIZE;
      }

      // Update logical position
      const startX = Math.floor((npc.startX / 100) * STAGE_WIDTH_PX / TILE_SIZE);
      const startY = 12;
      (npcContainer as any).targetX = startX * TILE_SIZE + TILE_SIZE / 2;
      (npcContainer as any).targetY = startY * TILE_SIZE + TILE_SIZE;
    });
  }

  private createNpcSprite(npc: any): PIXI.Container {
    const container = new PIXI.Container();
    container.label = `npc-${npc.id}`;
    container.eventMode = 'static';
    container.cursor = 'pointer';

    const graphics = new PIXI.Graphics();
    container.addChild(graphics);

    // Label
    const text = new PIXI.Text({
      text: npc.name,
      style: {
        fontFamily: 'Orbitron, Arial',
        fontSize: 10,
        fill: 0x00f2ff,
        align: 'center',
        fontWeight: 'bold',
        dropShadow: {
            color: 0x000000,
            alpha: 0.5,
            blur: 4,
            distance: 2
        }
      }
    });
    text.anchor.set(0.5, 0);
    text.y = 4;
    container.addChild(text);

    this.drawNpc(graphics, npc);

    return container;
  }

  private drawNpc(graphics: PIXI.Graphics, npc: any) {
    const s = 2.5; 
    const offX = -8 * s;
    const offY = -24 * s;

    const primary = this.hexToNumber(npc.primaryColor);
    const secondary = this.hexToNumber(npc.secondaryColor);
    const skin = 0xf5d2a8;

    // Outer glow for holographic feel
    graphics.ellipse(0, 0, 6 * s, 1.2 * s);
    graphics.fill({ color: primary, alpha: 0.2 });

    // Inner shadow
    graphics.ellipse(0, 0, 4 * s, 0.8 * s);
    graphics.fill({ color: 0x000000, alpha: 0.4 });

    // Body
    graphics.rect(offX + 4 * s, offY + 10 * s, 8 * s, 6 * s);
    graphics.fill({ color: primary, alpha: 0.8 });
    graphics.stroke({ width: 1, color: 0xffffff, alpha: 0.3 });

    // Detail
    graphics.rect(offX + 7 * s, offY + 10 * s, 2 * s, 4 * s);
    graphics.fill({ color: secondary, alpha: 0.9 });

    // Head
    graphics.rect(offX + 5 * s, offY + 4 * s, 6 * s, 6 * s);
    graphics.fill({ color: skin, alpha: 0.9 });

    // Tech Eyes
    graphics.rect(offX + 6 * s, offY + 6 * s, 1.5 * s, 1 * s);
    graphics.rect(offX + 8.5 * s, offY + 6 * s, 1.5 * s, 1 * s);
    graphics.fill(0x00f2ff);
    
    // Scanline on NPC
    graphics.rect(offX + 4 * s, offY + 4 * s, 8 * s, 1);
    graphics.fill({ color: 0xffffff, alpha: 0.2 });

    // Floating Icon
    graphics.circle(0, offY - 6 * s, 4 * s);
    graphics.fill({ color: primary, alpha: 0.3 });
    graphics.stroke({ width: 1, color: 0x00f2ff });
  }

  private hexToNumber(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
  }
}

export const pixiNpcs = new PixiNpcManager();
