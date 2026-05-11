import * as PIXI from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import { pixiApp, PIXI_LAYERS } from './pixiApp';
import { TILE_SIZE } from '../core/constants';

class PixiEffectsManager {
  private particles: PIXI.Graphics[] = [];
  private initialized = false;

  render() {
    const container = pixiApp.getContainer(PIXI_LAYERS.EFFECTS);
    const app = pixiApp.getApp();
    if (!container || !app || this.initialized) return;
    
    // Holographic scanline effect
    const scanline = new PIXI.Graphics();
    scanline.rect(0, 0, app.screen.width, 4);
    scanline.fill({ color: 0x0ea5e9, alpha: 0.15 });
    container.addChild(scanline);

    // Grid Glow overlay (center pulse)
    const pulse = new PIXI.Graphics();
    pulse.circle(app.screen.width / 2, app.screen.height / 2, 200);
    pulse.fill({ color: 0x00f2ff, alpha: 0.05 });
    pulse.filters = [new PIXI.BlurFilter(50)];
    container.addChild(pulse);

    // Ambient floating particles
    for (let i = 0; i < 20; i++) {
      const p = new PIXI.Graphics();
      p.circle(0, 0, Math.random() * 2);
      p.fill({ color: 0x00f2ff, alpha: Math.random() * 0.5 });
      p.x = Math.random() * app.screen.width;
      p.y = Math.random() * app.screen.height;
      (p as any).vx = (Math.random() - 0.5) * 0.5;
      (p as any).vy = (Math.random() - 0.5) * 0.5;
      container.addChild(p);
      this.particles.push(p);
    }

    app.ticker.add((ticker) => {
      // Move scanline
      scanline.y += 1.5 * ticker.deltaTime;
      if (scanline.y > app.screen.height) scanline.y = 0;

      // Pulse effect
      const time = performance.now() / 1000;
      pulse.alpha = 0.05 + Math.sin(time * 0.5) * 0.02;
      pulse.scale.set(1 + Math.sin(time * 0.3) * 0.1);

      // Move particles
      this.particles.forEach(p => {
        p.x += (p as any).vx * ticker.deltaTime;
        p.y += (p as any).vy * ticker.deltaTime;
        if (p.x < 0) p.x = app.screen.width;
        if (p.x > app.screen.width) p.x = 0;
        if (p.y < 0) p.y = app.screen.height;
        if (p.y > app.screen.height) p.y = 0;
      });
    });

    this.initialized = true;
  }
}

export const pixiEffects = new PixiEffectsManager();