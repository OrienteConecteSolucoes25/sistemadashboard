import { STAGE_WIDTH_TILES, STAGE_HEIGHT_TILES } from "../core/constants";

export interface Point {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  type: "character" | "furniture" | "desk" | "room" | "npc";
  position: Point;
  size?: Point;
  isStatic: boolean;
  metadata?: any;
}

export class PixelMapEngine {
  private collisions: boolean[][];
  private entities: Map<string, any>[][];
  private width: number;
  private height: number;

  constructor(width = STAGE_WIDTH_TILES, height = STAGE_HEIGHT_TILES) {
    this.width = width;
    this.height = height;
    this.collisions = Array(height).fill(null).map(() => Array(width).fill(false));
    this.entities = Array(height).fill(null).map(() => Array(width).fill(null).map(() => new Map()));
  }

  setCollision(x: number, y: number, value: boolean) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.collisions[y][x] = value;
    }
  }

  setEntity(x: number, y: number, type: string, data: any) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.entities[y][x].set(type, data);
    }
  }

  isDeskAt(x: number, y: number): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    return this.entities[y][x].has("desk");
  }

  isWalkable(x: number, y: number): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    // We allow walking on desks for the "sit" action to trigger
    if (this.isDeskAt(x, y)) return true;
    return !this.collisions[y][x];
  }

  resetCollisions() {
    this.collisions = Array(this.height).fill(null).map(() => Array(this.width).fill(false));
    this.entities = Array(this.height).fill(null).map(() => Array(this.width).fill(null).map(() => new Map()));
  }

  // Prepara colisão com base nos itens do workspace
  updateCollisions(desks: any[], rooms: any[], furniture: any[]) {
    this.resetCollisions();
    
    // Mesas
    desks.forEach(d => {
      this.setEntity(d.position_x, d.position_y, "desk", d);
      // Desks don't block anymore if we want to "sit" on them, 
      // but they block other paths. Let's say they block but are walkable for sitting.
      this.setCollision(d.position_x, d.position_y, true);
    });

    // Salas
    rooms.forEach(r => {
      const sizeX = 3;
      const sizeY = 3;
      for(let ix = 0; ix < sizeX; ix++) {
        for(let iy = 0; iy < sizeY; iy++) {
          this.setCollision(r.position_x + ix, r.position_y + iy, true);
          this.setEntity(r.position_x + ix, r.position_y + iy, "room", r);
        }
      }
    });

    // Móveis
    furniture.forEach(f => {
      this.setCollision(f.position_x, f.position_y, true);
      this.setEntity(f.position_x, f.position_y, "furniture", f);
    });
  }
}

export const mapEngine = new PixelMapEngine();
