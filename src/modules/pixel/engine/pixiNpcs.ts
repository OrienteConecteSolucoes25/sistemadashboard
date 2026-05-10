import * as PIXI from 'pixi.js';
import { pixiApp, PIXI_LAYERS } from './pixiApp';
import { TILE_SIZE, STAGE_WIDTH_PX } from '../core/constants';
import { NPCS_CONFIG } from '../data/npcsConfig';

class PixiNpcManager {
  private npcsMap: Map<string, PIXI.Container> = new Map();

  render() {
    const container = pixiApp.getContainer(PIXI_LAYERS.CHARACTERS);
    if (!container) return;

    Object.values(NPCS_CONFIG).forEach(npc => {
      let npcContainer = this.npcsMap.get(npc.id);
      if (!npcContainer) {
        npcContainer = this.createNpcSprite(npc);
        this.npcsMap.set(npc.id, npcContainer);
        container.addChild(npcContainer);
        
        // Initial position based on startX %
        const startX = Math.floor((npc.startX / 100) * STAGE_WIDTH_PX / TILE_SIZE);
        const startY = 10; // Fixed row for now
        
        npcContainer.x = startX * TILE_SIZE + TILE_SIZE / 2;
        npcContainer.y = startY * TILE_SIZE + TILE_SIZE;
      }
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
        fontFamily: 'Arial',
        fontSize: 10,
        fill: 0xffffff,
        align: 'center',
        fontWeight: 'bold',
      }
    });
    text.anchor.set(0.5, 0);
    text.y = 2;
    container.addChild(text);

    // Draw NPC (Simplified layered look like pixiCharacters.ts)
    this.drawNpc(graphics, npc);

    return container;
  }

  private drawNpc(graphics: PIXI.Graphics, npc: any) {
    const s = 2.3; // Scale
    const offX = -8 * s;
    const offY = -24 * s;

    const primary = this.hexToNumber(npc.primaryColor);
    const secondary = this.hexToNumber(npc.secondaryColor);
    const skin = 0xf5d2a8;

    // Shadow
    graphics.ellipse(0, 0, 4 * s, 0.8 * s);
    graphics.fill({ color: 0x000000, alpha: 0.35 });

    // Body
    graphics.rect(offX + 4 * s, offY + 10 * s, 8 * s, 6 * s);
    graphics.fill(primary);

    // Detail
    graphics.rect(offX + 7.25 * s, offY + 10 * s, 1.5 * s, 3 * s);
    graphics.fill(secondary);

    // Head
    graphics.rect(offX + 5 * s, offY + 4 * s, 6 * s, 6 * s);
    graphics.fill(skin);

    // Hair/Hat
    graphics.rect(offX + 5 * s, offY + 3 * s, 6 * s, 2 * s);
    graphics.fill(0x2a1a0f);

    // Eyes
    graphics.rect(offX + 6 * s, offY + 6 * s, 1 * s, 1 * s);
    graphics.rect(offX + 9 * s, offY + 6 * s, 1 * s, 1 * s);
    graphics.fill(0x000000);
    
    // Icon badge
    graphics.circle(8 * s, offY - 2 * s, 3 * s);
    graphics.fill(primary);
    graphics.stroke({ width: 1, color: 0xffffff });
  }

  private hexToNumber(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
  }
}

export const pixiNpcs = new PixiNpcManager();