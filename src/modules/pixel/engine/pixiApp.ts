import * as PIXI from 'pixi.js';

export const PIXI_LAYERS = {
  BACKGROUND: 'background',
  FLOOR: 'floor',
  ROOMS: 'rooms',
  FURNITURE_BELOW: 'furnitureBelow', // Below characters
  DESKS: 'desks',
  CHARACTERS: 'characters',
  FURNITURE_ABOVE: 'furnitureAbove', // Above characters (tall plants, etc)
  EFFECTS: 'effects',
  UI_OVERLAY: 'uiOverlay',
  DEBUG: 'debug'
};

class PixiAppManager {
  private app: PIXI.Application | null = null;
  private containers: Record<string, PIXI.Container> = {};
  private tickerRunning = false;

  async init(element: HTMLDivElement, width: number, height: number) {
    if (this.app) return this.app;

    this.app = new PIXI.Application();
    await this.app.init({
      width,
      height,
      backgroundColor: 0x1a1626,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: false,
    });

    element.appendChild(this.app.canvas);

    // Create layers
    Object.values(PIXI_LAYERS).forEach(layerName => {
      const container = new PIXI.Container();
      container.label = layerName;
      this.containers[layerName] = container;
      this.app!.stage.addChild(container);
    });

    this.startTicker();
    return this.app;
  }

  private startTicker() {
    if (!this.app || this.tickerRunning) return;
    this.tickerRunning = true;
    
    // Global ticker for animations and smooth movements
    this.app.ticker.add((ticker) => {
      // Broadcast tick to subscribers if needed
      // Currently managers handle their own state
    });
  }

  getApp() {
    return this.app;
  }

  getStage() {
    return this.app?.stage;
  }

  getContainer(name: string) {
    return this.containers[name];
  }

  destroy() {
    if (this.app) {
      this.tickerRunning = false;
      try {
        this.app.destroy(true, { children: true, texture: true });
      } catch (e) {
        console.warn("PixiApp destroy warning:", e);
      }
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
