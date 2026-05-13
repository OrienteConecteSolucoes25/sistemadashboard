import * as PIXI from "pixi.js";
import { pixiApp, PIXI_LAYERS } from "./pixiApp";
import { STAGE_WIDTH_PX, STAGE_HEIGHT_PX, TILE_SIZE } from "../core/constants";
import { OFFICE_THEME } from "../core/pixelOfficeTheme";
import { OFFICE_ZONES, zonePx } from "../core/officeZones";

const hexToNumber = (hex: string): number => {
  if (!hex) return 0x000000;
  return parseInt(hex.replace("#", "").substring(0, 6), 16);
};

export const pixiMap = {
  render() {
    const container = pixiApp.getContainer(PIXI_LAYERS.FLOOR);
    if (!container) return;
    container.removeChildren();

    // Fundo
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, STAGE_WIDTH_PX, STAGE_HEIGHT_PX);
    bg.fill(hexToNumber(OFFICE_THEME.floorBase));
    container.addChild(bg);

    // Grade
    const grid = new PIXI.Graphics();
    grid.setStrokeStyle({ width: 1, color: 0xffffff, alpha: 0.04 });
    for (let x = 0; x <= STAGE_WIDTH_PX; x += TILE_SIZE) {
      grid.moveTo(x, 0).lineTo(x, STAGE_HEIGHT_PX);
    }
    for (let y = 0; y <= STAGE_HEIGHT_PX; y += TILE_SIZE) {
      grid.moveTo(0, y).lineTo(STAGE_WIDTH_PX, y);
    }
    grid.stroke();
    container.addChild(grid);

    // Zonas + etiquetas
    for (const z of OFFICE_ZONES) {
      const { x, y, w, h } = zonePx(z);
      const carpet = new PIXI.Graphics();
      carpet.roundRect(x, y, w, h, 4);
      carpet.fill({ color: hexToNumber(z.color), alpha: z.alpha });
      container.addChild(carpet);

      const label = new PIXI.Text({
        text: z.label.toUpperCase(),
        style: {
          fontFamily: "ui-monospace, monospace",
          fontSize: 9,
          fontWeight: "700",
          fill: 0xffffff,
          letterSpacing: 0.5,
        },
      });
      label.alpha = 0.55;
      label.x = x + 6;
      label.y = y + 4;
      container.addChild(label);
    }

    // Paredes laterais (pseudo-iso)
    const wallL = new PIXI.Graphics();
    wallL.rect(0, 0, 4, STAGE_HEIGHT_PX).fill({ color: hexToNumber(OFFICE_THEME.wallSide), alpha: 0.55 });
    container.addChild(wallL);
    const wallR = new PIXI.Graphics();
    wallR.rect(STAGE_WIDTH_PX - 4, 0, 4, STAGE_HEIGHT_PX).fill({ color: hexToNumber(OFFICE_THEME.wallSide), alpha: 0.55 });
    container.addChild(wallR);
    const wallB = new PIXI.Graphics();
    wallB.rect(0, STAGE_HEIGHT_PX - 4, STAGE_WIDTH_PX, 4).fill({ color: hexToNumber(OFFICE_THEME.wallSide), alpha: 0.45 });
    container.addChild(wallB);

    // Vinheta
    const vignette = new PIXI.Graphics();
    vignette.rect(0, 0, STAGE_WIDTH_PX, STAGE_HEIGHT_PX);
    vignette.fill({ color: 0x000000, alpha: 0.18 });
    container.addChild(vignette);
  },
};
