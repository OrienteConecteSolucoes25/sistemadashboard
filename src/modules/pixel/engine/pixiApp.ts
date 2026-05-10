import * as PIXI from 'pixi.js';

export const PIXI_LAYERS = {
  BACKGROUND: 'background',
  FLOOR: 'floor',
  ROOMS: 'rooms',
  DECORATIONS_BACK: 'decorationsBack',
  DESKS: 'desks',
  CHARACTERS: 'characters',
  EFFECTS: 'effects',
  UI_OVERLAY: 'uiOverlay',
  DEBUG: 'debug'
};

class PixiAppManager {
  private app: PIXI.Application | null = null;
  private containers: Record<string, PIXI.Container> = {};

  async init(element: HTMLDivElement, width: number, height: number) {
    if (this.app) return this.app;

    this.app = new PIXI.Application();
    await this.app.init({
      width,
      height,
      backgroundColor: 0x1a1626,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: false, // Keep it pixelated
    });

    element.appendChild(this.app.canvas);

    // Create layers
    Object.values(PIXI_LAYERS).forEach(layerName => {
      const container = new PIXI.Container();
      container.label = layerName;
      this.containers[layerName] = container;
      this.app!.stage.addChild(container);
    });

    return this.app;
  }

  getApp() {
    return this.app;
  }

  getContainer(name: string) {
    return this.containers[name];
  }

  destroy() {
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true });
      this.app = null;
      this.containers = {};
    }
  }

  resize(width: number, height: number) {
    if (this.app) {
      this.app.renderer.resize(width, height);
    }
  }
}

export const pixiApp = new PixiAppManager();
