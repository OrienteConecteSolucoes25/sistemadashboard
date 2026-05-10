import * as PIXI from 'pixi.js';
import { pixiApp, PIXI_LAYERS } from './pixiApp';
import { TILE_SIZE } from '../core/constants';
import type { FurnitureLite } from '../data/usePixelWorkspaceData';

class PixiFurnitureManager {
  private furnitureMap: Map<string, PIXI.Container> = new Map();

  render(furniture: FurnitureLite[]) {
    const container = pixiApp.getContainer(PIXI_LAYERS.DECORATIONS_BACK);
    if (!container) return;

    const activeIds = new Set(furniture.map(f => f.id));

    // Remove old
    for (const [id, sprite] of this.furnitureMap.entries()) {
      if (!activeIds.has(id)) {
        container.removeChild(sprite);
        this.furnitureMap.delete(id);
      }
    }

    // Update/Create
    furniture.forEach(item => {
      let itemContainer = this.furnitureMap.get(item.id);
      if (!itemContainer) {
        itemContainer = this.createFurnitureSprite(item);
        this.furnitureMap.set(item.id, itemContainer);
        container.addChild(itemContainer);
      }
      this.updateFurnitureSprite(itemContainer, item);
    });
  }

  private createFurnitureSprite(item: FurnitureLite): PIXI.Container {
    const container = new PIXI.Container();
    container.label = `furniture-${item.id}`;
    
    const graphics = new PIXI.Graphics();
    container.addChild(graphics);

    return container;
  }

  private updateFurnitureSprite(container: PIXI.Container, item: FurnitureLite) {
    const graphics = container.children[0] as PIXI.Graphics;
    
    container.x = item.position_x * TILE_SIZE;
    container.y = item.position_y * TILE_SIZE;
    container.zIndex = (item.z_index ?? 10) + (item.position_y * 10);
    container.rotation = (item.rotation || 0) * (Math.PI / 180);

    graphics.clear();
    
    // Simple representation based on key
    let color = 0xcccccc;
    let w = TILE_SIZE;
    let h = TILE_SIZE;

    switch (item.furniture_key) {
      case 'plant':
        color = 0x228b22;
        graphics.ellipse(TILE_SIZE/2, TILE_SIZE/2, TILE_SIZE/3, TILE_SIZE/2);
        break;
      case 'sofa':
        color = 0x4682b4;
        w = TILE_SIZE * 2;
        graphics.roundRect(0, 0, w, h, 4);
        break;
      case 'pc':
        color = 0x333333;
        graphics.rect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);
        break;
      default:
        graphics.rect(0, 0, TILE_SIZE, TILE_SIZE);
    }
    
    graphics.fill(color);
  }
}

export const pixiFurniture = new PixiFurnitureManager();
