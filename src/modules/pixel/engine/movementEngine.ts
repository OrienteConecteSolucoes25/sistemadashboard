import { Point, mapEngine } from "./mapEngine";

export interface MovementPath {
  points: Point[];
  currentIndex: number;
}

export class PixelMovementEngine {
  // Implementação básica de A* ou busca de caminho simples
  calculatePath(start: Point, end: Point): Point[] {
    // Por enquanto, retorna linha direta (ou L-shape) se for possível caminhar
    // No futuro, implementaremos A* completo aqui
    const path: Point[] = [];
    let curX = start.x;
    let curY = start.y;

    // Movimento simples em X depois Y
    while (curX !== end.x) {
      curX += end.x > curX ? 1 : -1;
      if (mapEngine.isWalkable(curX, curY)) {
        path.push({ x: curX, y: curY });
      } else {
        // Obstruído - paramos o caminho aqui por enquanto
        break;
      }
    }

    while (curY !== end.y) {
      curY += end.y > curY ? 1 : -1;
      if (mapEngine.isWalkable(curX, curY)) {
        path.push({ x: curX, y: curY });
      } else {
        // Obstruído
        break;
      }
    }

    return path;
  }

  // Verifica se um movimento é válido
  isValidMove(target: Point): boolean {
    return mapEngine.isWalkable(target.x, target.y);
  }
}

export const movementEngine = new PixelMovementEngine();
