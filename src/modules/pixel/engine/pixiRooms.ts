import * as PIXI from 'pixi.js';
import { pixiApp, PIXI_LAYERS } from './pixiApp';
import { TILE_SIZE } from '../core/constants';
import { OFFICE_THEME } from '../core/pixelOfficeTheme';
import type { RoomLite } from '../data/usePixelWorkspaceData';

class PixiRoomsManager {
  private roomsMap: Map<string, PIXI.Container> = new Map();

  render(rooms: RoomLite[]) {
    const container = pixiApp.getContainer(PIXI_LAYERS.ROOMS);
    if (!container) return;

    const activeIds = new Set(rooms.map(r => r.id));

    // Remove old
    for (const [id, sprite] of this.roomsMap.entries()) {
      if (!activeIds.has(id)) {
        container.removeChild(sprite);
        this.roomsMap.delete(id);
      }
    }

    // Update/Create
    rooms.forEach(room => {
      let roomContainer = this.roomsMap.get(room.id);
      if (!roomContainer) {
        roomContainer = this.createRoomSprite(room);
        this.roomsMap.set(room.id, roomContainer);
        container.addChild(roomContainer);
      }
      this.updateRoomSprite(roomContainer, room);
    });
  }

  private createRoomSprite(room: RoomLite): PIXI.Container {
    const container = new PIXI.Container();
    container.label = `room-${room.id}`;
    
    const graphics = new PIXI.Graphics();
    container.addChild(graphics);

    // Nome da Sala
    const text = new PIXI.Text({
      text: room.name || '',
      style: {
        fontFamily: 'monospace',
        fontSize: 10,
        fill: 0xffffff,
        fontWeight: 'bold',
      }
    });
    text.x = 4;
    text.y = 4;
    container.addChild(text);

    // Dados em Tempo Real (Smart Room)
    const dataText = new PIXI.Text({
      text: '',
      style: {
        fontFamily: 'monospace',
        fontSize: 8,
        fill: 0x00f2ff,
        fontWeight: 'normal',
      }
    });
    dataText.x = 4;
    dataText.y = 16;
    container.addChild(dataText);

    return container;
  }

  private updateRoomSprite(container: PIXI.Container, room: RoomLite) {
    const graphics = container.children[0] as PIXI.Graphics;
    const text = container.children[1] as PIXI.Text;
    const dataText = container.children[2] as PIXI.Text;
    
    const w = this.sizeForCapacity(room.capacity).w * TILE_SIZE;
    const h = this.sizeForCapacity(room.capacity).h * TILE_SIZE;

    container.x = room.position_x * TILE_SIZE;
    container.y = room.position_y * TILE_SIZE;
    container.zIndex = (room.z_index ?? 5) + (room.position_y * 10);

    graphics.clear();
    
    // Carpet
    const carpetColor = this.hexToNumber(OFFICE_THEME.carpetCommon);
    graphics.rect(2, 2, w - 4, h - 4);
    graphics.fill({ color: carpetColor, alpha: 0.85 });

    // Border
    graphics.setStrokeStyle({ width: 2, color: 0xffffff, alpha: 0.6 });
    graphics.rect(0, 0, w, h);
    graphics.stroke();

    text.text = room.name || '';

    // Simulação de Dados em Tempo Real por Módulo
    const name = (room.name || '').toUpperCase();
    if (name.includes('TI')) {
      dataText.text = 'CHAMADOS: 12\nSLA: 98%';
    } else if (name.includes('FINANCEIRO') || name.includes('CONTABIL')) {
      dataText.text = 'SALDO: OK\nALERTAS: 00';
    } else if (name.includes('JURIDICO')) {
      dataText.text = 'PROCESSOS: 42\nPRAZOS: 03';
    } else if (name.includes('ENGENHARIA')) {
      dataText.text = 'OBRAS: 15\nSTATUS: ATIVO';
    } else {
      dataText.text = '';
    }
  }

  private sizeForCapacity(cap: number) {
    if (cap <= 4) return { w: 3, h: 3 };
    if (cap <= 8) return { w: 4, h: 4 };
    return { w: 5, h: 4 };
  }

  private hexToNumber(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
  }
}

export const pixiRooms = new PixiRoomsManager();
