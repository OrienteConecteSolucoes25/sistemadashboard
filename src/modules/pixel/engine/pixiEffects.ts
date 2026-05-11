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
    scanline.fill({ color: 0x0ea5e9, alpha: 0.25 });
    scanline.filters = [new GlowFilter({ distance: 10, outerStrength: 2, color: 0x0ea5e9 })];
    container.addChild(scanline);

    // Grid Glow overlay (center pulse)
    const pulse = new PIXI.Graphics();
    pulse.circle(app.screen.width / 2, app.screen.height / 2, 200);
    pulse.fill({ color: 0x00f2ff, alpha: 0.1 });
    pulse.filters = [new PIXI.BlurFilter(50)];
    container.addChild(pulse);

    // Ambient floating particles
    for (let i = 0; i < 30; i++) {
      const p = new PIXI.Graphics();
      p.circle(0, 0, Math.random() * 2 + 1);
      p.fill({ color: 0x00f2ff, alpha: Math.random() * 0.7 });
      p.x = Math.random() * app.screen.width;
      p.y = Math.random() * app.screen.height;
      (p as any).vx = (Math.random() - 0.5) * 0.8;
      (p as any).vy = (Math.random() - 0.5) * 0.8;
      (p as any).pulseOffset = Math.random() * Math.PI * 2;
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
        const pvt = p as any;
        pvt.x += pvt.vx * ticker.deltaTime;
        pvt.y += pvt.vy * ticker.deltaTime;
        
        // Flicker effect
        p.alpha = 0.3 + Math.sin(time * 3 + pvt.pulseOffset) * 0.3;
        
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