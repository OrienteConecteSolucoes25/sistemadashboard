import * as PIXI from 'pixi.js';
import { pixiApp, PIXI_LAYERS } from './pixiApp';
import { TILE_SIZE } from '../core/constants';
import { 
  getColorValue, 
  skinToneOptions, 
  hairColorOptions, 
  outfitColorOptions, 
  bottomOptions, 
  shoesOptions,
  type AvatarCustomization 
} from '../core/avatarOptions';
import type { PixelCharacter } from '../data/usePixelWorkspaceData';

const AVATAR_SIZE = 56;
const SCALE = AVATAR_SIZE / 24; // Original is 16x24

class PixiCharactersManager {
  private charactersMap: Map<string, PIXI.Container> = new Map();
  private prevPositions: Map<string, { x: number, y: number }> = new Map();

  render(characters: PixelCharacter[]) {
    const container = pixiApp.getContainer(PIXI_LAYERS.CHARACTERS);
    if (!container) return;

    // Track which characters we still have
    const activeIds = new Set(characters.map(c => c.user_id));

    // Remove old ones
    for (const [id, sprite] of this.charactersMap.entries()) {
      if (!activeIds.has(id)) {
        container.removeChild(sprite);
        this.charactersMap.delete(id);
        this.prevPositions.delete(id);
      }
    }

    // Update or create
    characters.forEach(char => {
      let charContainer = this.charactersMap.get(char.user_id);
      
      if (!charContainer) {
        charContainer = this.createCharacterSprite(char);
        this.charactersMap.set(char.user_id, charContainer);
        container.addChild(charContainer);
      }

      this.updateCharacterSprite(charContainer, char);
    });
  }

  private createCharacterSprite(char: PixelCharacter): PIXI.Container {
    const container = new PIXI.Container();
    container.label = `char-${char.user_id}`;
    
    // Base Graphics for the layered look
    const graphics = new PIXI.Graphics();
    container.addChild(graphics);

    // Label
    const text = new PIXI.Text({
      text: char.display_name || '',
      style: {
        fontFamily: 'Arial',
        fontSize: 10,
        fill: 0xffffff,
        align: 'center',
        fontWeight: 'bold',
      }
    });
    text.anchor.set(0.5, 0);
    text.y = 2; // Positioned below the sprite (centered on container)
    container.addChild(text);

    return container;
  }

  private updateCharacterSprite(container: PIXI.Container, char: PixelCharacter) {
    const graphics = container.children[0] as PIXI.Graphics;
    const customization = char.customization;
    
    const prevPos = this.prevPositions.get(char.user_id);
    const targetX = char.position_x * TILE_SIZE + TILE_SIZE / 2;
    const targetY = char.position_y * TILE_SIZE + TILE_SIZE;

    // Determine direction
    if (prevPos) {
      if (targetX > prevPos.x) container.scale.x = 1;
      else if (targetX < prevPos.x) container.scale.x = -1;
    }
    this.prevPositions.set(char.user_id, { x: targetX, y: targetY });
    
    // Set position directly for now
    container.x = targetX;
    container.y = targetY;
    container.zIndex = char.position_y * 10 + 100;

    // Redraw graphics
    graphics.clear();
    
    const colors = this.getCustomizationColors(customization);
    const skin = this.hexToNumber(colors.skin);
    const outfit = this.hexToNumber(colors.outfit);
    const bottom = this.hexToNumber(colors.bottom);
    const hair = this.hexToNumber(colors.hair);
    const shoes = this.hexToNumber(colors.shoes);

    const s = SCALE;
    const offX = -8 * s;
    const offY = -24 * s;

    // Shadow
    graphics.ellipse(0, 0, 4 * s, 0.8 * s);
    graphics.fill({ color: 0x000000, alpha: 0.35 });

    // Legs / Pants
    graphics.rect(offX + 5 * s, offY + 16 * s, 3 * s, 5 * s);
    graphics.rect(offX + 8 * s, offY + 16 * s, 3 * s, 5 * s);
    graphics.fill(bottom);

    // Shoes
    graphics.rect(offX + 4 * s, offY + 21 * s, 4 * s, 1 * s);
    graphics.rect(offX + 8 * s, offY + 21 * s, 4 * s, 1 * s);
    graphics.fill(shoes);

    // Torso (Shirt)
    graphics.rect(offX + 4 * s, offY + 10 * s, 8 * s, 6 * s);
    graphics.fill(outfit);

    // Arms
    graphics.rect(offX + 3 * s, offY + 10 * s, 1 * s, 5 * s);
    graphics.rect(offX + 12 * s, offY + 10 * s, 1 * s, 5 * s);
    graphics.fill(outfit);

    // Hands
    graphics.rect(offX + 3 * s, offY + 15 * s, 1 * s, 1 * s);
    graphics.rect(offX + 12 * s, offY + 15 * s, 1 * s, 1 * s);
    graphics.fill(skin);

    // Head
    graphics.rect(offX + 5 * s, offY + 4 * s, 6 * s, 6 * s);
    graphics.fill(skin);

    // Eyes
    graphics.rect(offX + 6 * s, offY + 6 * s, 1 * s, 1 * s);
    graphics.rect(offX + 9 * s, offY + 6 * s, 1 * s, 1 * s);
    graphics.fill(0x1a1a1a);

    // Mouth / Detail
    graphics.rect(offX + 7 * s, offY + 8 * s, 2 * s, 1 * s);
    graphics.fill({ color: 0x000000, alpha: 0.1 });

    // Hair
    graphics.rect(offX + 5 * s, offY + 3 * s, 6 * s, 2 * s);
    graphics.rect(offX + 4 * s, offY + 4 * s, 1 * s, 2 * s);
    graphics.rect(offX + 11 * s, offY + 4 * s, 1 * s, 2 * s);
    graphics.fill(hair);

    // Typing bubble if active
    if (char.is_typing) {
      graphics.circle(8 * s, offY - 4 * s, 3 * s);
      graphics.fill(0xffffff);
      graphics.circle(8 * s, offY - 4 * s, 1 * s);
      graphics.fill(0x333333);
    }
  }

  private getCustomizationColors(c: AvatarCustomization) {
    return {
      skin: getColorValue(skinToneOptions, c.avatar_skin_tone, "#e0b18a"),
      hair: getColorValue(hairColorOptions, c.avatar_hair_color, "#4a2c1a"),
      outfit: getColorValue(outfitColorOptions, c.avatar_outfit_color, "#3b8c7a"),
      bottom: getColorValue(bottomOptions, c.avatar_bottom_key, "#1f1830"),
      shoes: getColorValue(shoesOptions, c.avatar_shoes_key, "#0f0a18"),
    };
  }

  private hexToNumber(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
  }
}

export const pixiCharacters = new PixiCharactersManager();
