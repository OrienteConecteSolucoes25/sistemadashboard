import { TILE_SIZE } from "../core/constants";

export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type RendererType = "dom" | "pixi";

export interface RenderState {
  type: RendererType;
  scale: number;
  debugMode: boolean;
}

export class PixelSpriteEngine {
  private renderState: RenderState = {
    type: "dom",
    scale: 1,
    debugMode: false
  };

  setRenderer(type: RendererType) {
    this.renderState.type = type;
  }

  getRenderer(): RendererType {
    return this.renderState.type;
  }

  // Converte coordenadas de tile para pixel
  tileToPixel(tileCoord: number): number {
    return tileCoord * TILE_SIZE;
  }

  // Converte coordenadas de pixel para tile
  pixelToTile(pixelCoord: number): number {
    return Math.floor(pixelCoord / TILE_SIZE);
  }

  // Gera Z-index dinâmico baseado na posição Y para profundidade (Y-sorting)
  calculateZIndex(y: number, baseLayer = 10): number {
    return baseLayer + Math.floor(y);
  }
}

export const spriteEngine = new PixelSpriteEngine();
