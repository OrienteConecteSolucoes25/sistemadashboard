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
    container.eventMode = 'static';
    container.cursor = 'pointer';
    
    // Z-index base (background layers should be lower)
    container.zIndex = (room.z_index ?? 5);

    const graphics = new PIXI.Graphics();
    container.addChild(graphics);

    // Dashboard Container (for floating stats)
    const dashboard = new PIXI.Container();
    dashboard.label = 'dashboard';
    container.addChild(dashboard);

    const dashBg = new PIXI.Graphics();
    dashboard.addChild(dashBg);

    const titleText = new PIXI.Text({ text: '' });
    titleText.style = new PIXI.TextStyle({
      fontFamily: 'Orbitron, monospace',
      fontSize: 9,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    titleText.label = 'title';
    dashboard.addChild(titleText);

    const statsText = new PIXI.Text({ text: '' });
    statsText.style = new PIXI.TextStyle({
      fontFamily: 'monospace',
      fontSize: 8,
      fill: 0x00f2ff,
    });
    statsText.label = 'stats';
    statsText.y = 12;
    dashboard.addChild(statsText);

    return container;
  }

  private updateRoomSprite(container: PIXI.Container, room: RoomLite) {
    const graphics = container.children[0] as PIXI.Graphics;
    const dashboard = container.children[1] as PIXI.Container;
    
    const { w: tilesW, h: tilesH } = this.sizeForCapacity(room.capacity);
    const w = tilesW * TILE_SIZE;
    const h = tilesH * TILE_SIZE;

    container.x = room.position_x * TILE_SIZE;
    container.y = room.position_y * TILE_SIZE;
    // Keep rooms behind desks/characters but respect their own z-index
    container.zIndex = (room.z_index ?? 5);

    graphics.clear();
    
    const variant = this.variantOf(room);
    const colors = this.variantColors(variant);
    const carpetColor = this.hexToNumber(colors.carpet);
    const accentColor = this.hexToNumber(colors.accent);

    // Carpet
    graphics.rect(2, 2, w - 4, h - 4);
    graphics.fill({ color: carpetColor, alpha: 0.85 });

    // Checkerboard pattern
    for (let i = 0; i < Math.floor((w - 4) / 8); i++) {
      for (let j = 0; j < Math.floor((h - 4) / 8); j++) {
        if ((i + j) % 2 === 0) {
          graphics.rect(2 + i * 8, 2 + j * 8, 8, 8);
          graphics.fill({ color: 0xffffff, alpha: 0.04 });
        }
      }
    }

    // Border
    graphics.setStrokeStyle({ width: 2, color: accentColor, alpha: 0.6 });
    graphics.rect(0, 0, w, h);
    graphics.stroke();

    // Internal inner border
    graphics.setStrokeStyle({ width: 1, color: 0x000000, alpha: 0.4 });
    graphics.rect(2, 2, w - 4, h - 4);
    graphics.stroke();

    // Update Dashboard
    if (variant !== 'common') {
      dashboard.visible = true;
      dashboard.x = w - 10;
      dashboard.y = -40;
      
      const dashBg = dashboard.children[0] as PIXI.Graphics;
      const title = dashboard.children[1] as PIXI.Text;
      const stats = dashboard.children[2] as PIXI.Text;

      const config = this.getModuleConfig(variant);
      title.text = config.title.toUpperCase();
      stats.text = config.stats.map(s => `${s.label}: ${s.value}`).join('\n');

      dashBg.clear();
      dashBg.roundRect(-4, -4, 110, 35, 6);
      dashBg.fill({ color: this.hexToNumber(config.bg), alpha: 0.9 });
      dashBg.setStrokeStyle({ width: 1, color: this.hexToNumber(config.color), alpha: 0.4 });
      dashBg.stroke();
    } else {
      dashboard.visible = false;
    }
  }

  private sizeForCapacity(cap: number) {
    if (cap <= 4) return { w: 3, h: 3 };
    if (cap <= 8) return { w: 4, h: 4 };
    return { w: 5, h: 4 };
  }

  private variantOf(room: RoomLite) {
    const t = (room.room_type ?? "").toLowerCase();
    const k = (room.room_key ?? "").toLowerCase();
    const n = (room.name ?? "").toLowerCase();
    
    if (t.includes("meeting") || k.includes("meeting")) return "meeting"; 
    if (k.includes("engen") || k.includes("engineer") || n.includes("engenharia")) return "engineering";
    if (k.includes("jurid") || k.includes("legal") || n.includes("jurídico")) return "legal";
    if (k.includes("ti") || k.includes("tech") || k.includes("support") || n.includes("ti")) return "ti";
    if (k.includes("rh") || k.includes("people") || k.includes("dp") || n.includes("rh")) return "hr";
    if (k.includes("reception") || k.includes("lobby") || n.includes("recepção") || n.includes("lobby")) return "reception";
    if (k.includes("showroom") || n.includes("showroom") || n.includes("vitrine") || n.includes("marketplace")) return "marketplace";
    if (k.includes("project") || n.includes("projeto") || n.includes("acompanhamento")) return "project_view";
    
    return "common";
  }

  private variantColors(v: string) {
    switch (v) {
      case "meeting": return { carpet: OFFICE_THEME.carpetMeeting, accent: "#c9a8ff" };
      case "engineering": return { carpet: "#1f2937", accent: "#3b82f6" };
      case "legal": return { carpet: "#1e1b4b", accent: "#f59e0b" };
      case "hr": return { carpet: "#064e3b", accent: "#10b981" };
      case "finance": return { carpet: "#4c1d95", accent: "#a78bfa" };
      case "ti": return { carpet: "#164e63", accent: "#22d3ee" };
      case "reception": return { carpet: "#334155", accent: "#94a3b8" };
      case "showroom": return { carpet: "#1e1b4b", accent: "#818cf8" };
      case "project_view": return { carpet: "#0f172a", accent: "#38bdf8" };
      case "marketplace": return { carpet: "#1e1b4b", accent: "#a78bfa" };
      default: return { carpet: OFFICE_THEME.carpetCommon, accent: "#a8d8cc" };
    }
  }

  private getModuleConfig(t: string) {
    const base = { title: "Geral", color: "#64748b4d", bg: "#0f172a", stats: [{ label: "Status", value: "Online" }] };
    switch (t) {
      case "engineering": return { ...base, title: "Engenharia", color: "#3b82f64d", bg: "#172554", stats: [{ label: "Projetos", value: "12" }, { label: "RFIs", value: "5" }] };
      case "legal": return { ...base, title: "Jurídico", color: "#f59e0b4d", bg: "#451a03", stats: [{ label: "Processos", value: "48" }, { label: "Prazos", value: "3" }] };
      case "hr": return { ...base, title: "RH & DP", color: "#10b9814d", bg: "#064e3b", stats: [{ label: "Onboarding", value: "2" }, { label: "Total", value: "142" }] };
      case "ti": return { ...base, title: "TI & Suporte", color: "#06b6d44d", bg: "#164e63", stats: [{ label: "Chamados", value: "4" }, { label: "Uptime", value: "99.9%" }] };
      case "marketplace": return { ...base, title: "Marketplace", color: "#6366f14d", bg: "#1e1b4b", stats: [{ label: "Lojas", value: "850+" }, { label: "Vendas", value: "R$ 4.2M" }] };
      default: return base;
    }
  }

  private hexToNumber(hex: string): number {
    if (!hex) return 0x000000;
    const cleanHex = hex.replace('#', '');
    // Handle both 6-char and 8-char hex (ignoring alpha for color number)
    return parseInt(cleanHex.substring(0, 6), 16);
  }
}

export const pixiRooms = new PixiRoomsManager();
