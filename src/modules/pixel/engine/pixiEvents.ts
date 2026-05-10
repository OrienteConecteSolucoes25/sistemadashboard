import { pixiApp, PIXI_LAYERS } from './pixiApp';
import { TILE_SIZE } from '../core/constants';
import * as PIXI from 'pixi.js';

export const pixiEvents = {
  setupStage(onStageClick: (tileX: number, tileY: number) => void, onNpcClick?: (npcId: string) => void) {
    const stage = pixiApp.getStage();
    const app = pixiApp.getApp();
    if (!stage || !app) return;

    stage.eventMode = 'static';
    stage.hitArea = app.screen;

    stage.on('pointertap', (event) => {
      // Check if we clicked an NPC or character first
      const target = event.target as PIXI.Container;
      if (target && target.label) {
        if (target.label.startsWith('npc-')) {
          const npcId = target.label.replace('npc-', '');
          if (onNpcClick) onNpcClick(npcId);
          return; // Don't move if clicking NPC
        }
      }

      // Local position inside stage
      const local = stage.toLocal(event.global);
      const tileX = Math.floor(local.x / TILE_SIZE);
      const tileY = Math.floor(local.y / TILE_SIZE);
      
      onStageClick(tileX, tileY);
    });
  }
};
