import { Point, mapEngine } from "./mapEngine";

export interface MovementPath {
  points: Point[];
  currentIndex: number;
}

export class PixelMovementEngine {
  // A* Pathfinding Implementation
  calculatePath(start: Point, end: Point): Point[] {
    if (!mapEngine.isWalkable(end.x, end.y)) return [];

    const openSet: Node[] = [];
    const closedSet: Set<string> = new Set();
    
    const startNode = new Node(start.x, start.y, 0, this.heuristic(start, end));
    openSet.push(startNode);

    while (openSet.length > 0) {
      // Get node with lowest fCost
      let currentIdx = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].fCost < openSet[currentIdx].fCost) {
          currentIdx = i;
        }
      }
      
      const current = openSet[currentIdx];

      // Found the goal
      if (current.x === end.x && current.y === end.y) {
        return this.reconstructPath(current);
      }

      openSet.splice(currentIdx, 1);
      closedSet.add(`${current.x},${current.y}`);

      // Check neighbors
      const neighbors = [
        { x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 },
        { x: 1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 } // Diagonals
      ];

      for (const neighborOffset of neighbors) {
        const nx = current.x + neighborOffset.x;
        const ny = current.y + neighborOffset.y;

        if (nx < 0 || ny < 0 || closedSet.has(`${nx},${ny}`) || !mapEngine.isWalkable(nx, ny)) {
          continue;
        }

        // Cost for diagonal is higher (approx sqrt(2))
        const moveCost = (neighborOffset.x !== 0 && neighborOffset.y !== 0) ? 1.4 : 1;
        const gCost = current.gCost + moveCost;
        const hCost = this.heuristic({ x: nx, y: ny }, end);
        
        const existingNode = openSet.find(n => n.x === nx && n.y === ny);
        if (existingNode) {
          if (gCost < existingNode.gCost) {
            existingNode.gCost = gCost;
            existingNode.parent = current;
          }
        } else {
          openSet.push(new Node(nx, ny, gCost, hCost, current));
        }
      }
    }

    return []; // No path found
  }

  private heuristic(a: Point, b: Point): number {
    // Octile distance for 8-way movement
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    const F = Math.SQRT2 - 1;
    return (dx < dy) ? F * dx + dy : F * dy + dx;
  }

  private reconstructPath(node: Node): Point[] {
    const path: Point[] = [];
    let curr: Node | null = node;
    while (curr && curr.parent) {
      path.unshift({ x: curr.x, y: curr.y });
      curr = curr.parent;
    }
    return path;
  }

  isValidMove(target: Point): boolean {
    return mapEngine.isWalkable(target.x, target.y);
  }
}

class Node {
  constructor(
    public x: number,
    public y: number,
    public gCost: number,
    public hCost: number,
    public parent: Node | null = null
  ) {}

  get fCost() {
    return this.gCost + this.hCost;
  }
}

export const movementEngine = new PixelMovementEngine();
