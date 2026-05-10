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
  private width: number;
  private height: number;

  constructor(width = STAGE_WIDTH_TILES, height = STAGE_HEIGHT_TILES) {
    this.width = width;
    this.height = height;
    this.collisions = Array(height).fill(null).map(() => Array(width).fill(false));
  }

  setCollision(x: number, y: number, value: boolean) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.collisions[y][x] = value;
    }
  }

  isWalkable(x: number, y: number): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    return !this.collisions[y][x];
  }

  resetCollisions() {
    this.collisions = Array(this.height).fill(null).map(() => Array(this.width).fill(false));
  }

  // Prepara colisão com base nos itens do workspace
  updateCollisions(desks: any[], rooms: any[], furniture: any[]) {
    this.resetCollisions();
    
    // Mesas bloqueiam 1 tile
    desks.forEach(d => {
      this.setCollision(d.position_x, d.position_y, true);
    });

    // Salas bloqueiam sua área (geralmente capacity define tamanho ou metadados)
    // Para agora, bloqueamos o ponto de origem ou definimos box fixa
    rooms.forEach(r => {
      // Exemplo: salas bloqueiam 4x4 tiles se for meeting room
      const sizeX = 3;
      const sizeY = 3;
      for(let ix = 0; ix < sizeX; ix++) {
        for(let iy = 0; iy < sizeY; iy++) {
          this.setCollision(r.position_x + ix, r.position_y + iy, true);
        }
      }
    });

    // Móveis bloqueiam dependendo do tipo
    furniture.forEach(f => {
      this.setCollision(f.position_x, f.position_y, true);
    });
  }
}

export const mapEngine = new PixelMapEngine();
