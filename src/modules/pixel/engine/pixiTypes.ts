import * as PIXI from 'pixi.js';

export interface PixiCharacter extends PIXI.Container {
  userId: string;
  targetX: number;
  targetY: number;
  isMoving: boolean;
}

export interface PixiDesk extends PIXI.Container {
  deskId: string;
}

export interface PixiRoom extends PIXI.Container {
  roomId: string;
}

export interface PixiFurniture extends PIXI.Container {
  furnitureId: string;
}
