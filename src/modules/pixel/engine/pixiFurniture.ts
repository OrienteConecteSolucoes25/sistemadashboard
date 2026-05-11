import * as PIXI from 'pixi.js';
import { pixiApp, PIXI_LAYERS } from './pixiApp';
import { TILE_SIZE } from '../core/constants';
import type { FurnitureLite } from '../data/usePixelWorkspaceData';

class PixiFurnitureManager {
  private furnitureMap: Map<string, PIXI.Container> = new Map();

  render(furniture: FurnitureLite[]) {
    const containerBelow = pixiApp.getContainer(PIXI_LAYERS.FURNITURE_BELOW);
    const containerAbove = pixiApp.getContainer(PIXI_LAYERS.FURNITURE_ABOVE);
    if (!containerBelow || !containerAbove) return;

    const activeIds = new Set(furniture.map(f => f.id));

    // Remove old
    for (const [id, sprite] of this.furnitureMap.entries()) {
      if (!activeIds.has(id)) {
        if (sprite.parent) sprite.parent.removeChild(sprite);
        this.furnitureMap.delete(id);
      }
    }

    // Update/Create
    furniture.forEach(item => {
      let itemContainer = this.furnitureMap.get(item.id);
      if (!itemContainer) {
        itemContainer = this.createFurnitureSprite(item);
        this.furnitureMap.set(item.id, itemContainer);
        
        // Decide layer
        const layer = this.isTall(item.furniture_key) ? containerAbove : containerBelow;
        layer.addChild(itemContainer);
      }
      this.updateFurnitureSprite(itemContainer, item);
    });
  }

  private isTall(key: string | null): boolean {
    return key === 'plant' || key === 'board' || key === 'divider';
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
    
    // Improved visual representation matching DOM renderer
    const w = item.furniture_key === 'sofa' ? TILE_SIZE * 2 : (item.furniture_key === 'board' ? TILE_SIZE * 2.5 : TILE_SIZE);
    const h = item.furniture_key === 'plant' ? TILE_SIZE * 1.5 : TILE_SIZE;

    switch (item.furniture_key) {
      case 'plant':
        // Pot
        graphics.poly([{x: 6, y: 28}, {x: 22, y: 28}, {x: 20, y: 36}, {x: 8, y: 36}]);
        graphics.fill(0x8b4513);
        // Leaves
        graphics.ellipse(14, 16, 10, 12);
        graphics.fill(0x2e8b57);
        break;
      case 'sofa':
        graphics.roundRect(2, 6, 28, 10, 2);
        graphics.fill(0x4a5568);
        graphics.roundRect(2, 2, 28, 6, 2);
        graphics.fill(0x2d3748);
        break;
      case 'coffee':
        graphics.rect(2, 10, 8, 6);
        graphics.fill(0x3a3a45);
        graphics.rect(3, 2, 6, 8);
        graphics.fill(0x5a8acb);
        break;
      case 'pc':
        graphics.rect(2, 2, 12, 10);
        graphics.fill(0x1a202c);
        graphics.rect(3, 3, 10, 8);
        graphics.fill(0x3182ce);
        break;
      default:
        graphics.rect(0, 0, TILE_SIZE, TILE_SIZE);
        graphics.fill(0xcccccc);
    }
  }
}

export const pixiFurniture = new PixiFurnitureManager();