import { pixiApp } from './pixiApp';
import { TILE_SIZE } from '../core/constants';

export const pixiEvents = {
  setupStage(onStageClick: (tileX: number, tileY: number) => void) {
    const stage = pixiApp.getStage();
    if (!stage) return;

    stage.eventMode = 'static';
    stage.on('pointertap', (event) => {
      // Local position inside stage
      const local = stage.toLocal(event.global);
      const tileX = Math.floor(local.x / TILE_SIZE);
      const tileY = Math.floor(local.y / TILE_SIZE);
      
      onStageClick(tileX, tileY);
    });
  }
};
