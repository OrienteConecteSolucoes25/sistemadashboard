import { pixiApp, PIXI_LAYERS } from './pixiApp';
import { TILE_SIZE } from '../core/constants';
import * as PIXI from 'pixi.js';

export const pixiEvents = {
  setupStage(
    onStageClick: (tileX: number, tileY: number) => void, 
    onNpcClick?: (npcId: string) => void,
    onCharacterClick?: (userId: string) => void,
    onDeskClick?: (deskId: string) => void,
    onRoomClick?: (roomId: string) => void
  ) {
    const stage = pixiApp.getStage();
    const app = pixiApp.getApp();
    if (!stage || !app) return;

    stage.eventMode = 'static';
    stage.hitArea = app.screen;

    // Real-time hover logic
    stage.on('pointermove', (event) => {
      const local = stage.toLocal(event.global);
      const target = event.target as PIXI.Container;
      
      // Update cursor based on target
      if (target && target.label && (
        target.label.startsWith('npc-') || 
        target.label.startsWith('char-') || 
        target.label.startsWith('desk-') || 
        target.label.startsWith('room-')
      )) {
        stage.cursor = 'pointer';
      } else {
        stage.cursor = 'inherit';
      }
    });

    stage.on('pointertap', (event) => {
      // Local position inside stage
      const local = stage.toLocal(event.global);
      const tileX = Math.floor(local.x / TILE_SIZE);
      const tileY = Math.floor(local.y / TILE_SIZE);

      // Check if we clicked an NPC or character first
      const target = event.target as PIXI.Container;
      if (target && target.label) {
        if (target.label.startsWith('npc-')) {
          const npcId = target.label.replace('npc-', '');
          if (onNpcClick) onNpcClick(npcId);
          return; 
        }
        if (target.label.startsWith('char-')) {
          const userId = target.label.replace('char-', '');
          if (onCharacterClick) onCharacterClick(userId);
          return;
        }
        if (target.label.startsWith('desk-')) {
          const deskId = target.label.replace('desk-', '');
          if (onDeskClick) onDeskClick(deskId);
          return;
        }
        if (target.label.startsWith('room-')) {
          const roomId = target.label.replace('room-', '');
          if (onRoomClick) onRoomClick(roomId);
          return;
        }
      }
      
      onStageClick(tileX, tileY);
    });
  }
};
