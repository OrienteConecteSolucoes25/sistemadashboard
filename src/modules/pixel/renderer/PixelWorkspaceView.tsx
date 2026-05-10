import { useState, useEffect } from "react";
import {
  STAGE_HEIGHT_PX,
  STAGE_WIDTH_PX,
  STAGE_HEIGHT_TILES,
  STAGE_WIDTH_TILES,
  TILE_SIZE,
} from "../core/constants";
import { PixelAvatar } from "../renderer/PixelAvatar";
import { PixelDesk } from "../renderer/PixelDesk";
import { PixelRoom } from "../renderer/PixelRoom";
import { PixelOfficeMap } from "../renderer/PixelOfficeMap";
import { PixelOfficeDecorations } from "../renderer/PixelOfficeDecorations";
import { PixelFurnitureSprite, FurnitureKind } from "./PixelFurnitureSprite";
import type {
  PixelCharacter,
  DeskLite,
  RoomLite,
  WorkspaceLite,
  FurnitureLite,
} from "../data/usePixelWorkspaceData";
import { Button } from "@/components/ui/button";
import { Plus, Move, Trash2, RotateCw, Lock, Unlock, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mapEngine } from "../engine/mapEngine";
import { spriteEngine, type RendererType } from "../engine/spriteEngine";

interface Props {
  workspace: WorkspaceLite;
  currentUser?: { id: string } | null;
  characters: PixelCharacter[];
  desks: DeskLite[];
  rooms: RoomLite[];
  furniture: FurnitureLite[];
  getPosition: (userId: string, fallback: { x: number; y: number }) => { x: number; y: number };
  onSelectCharacter: (c: PixelCharacter) => void;
  onSelectDesk: (d: DeskLite) => void;
  onStageClick: (tileX: number, tileY: number) => void;
  recentMessages?: Record<string, string | null>;
  setTyping?: (isTyping: boolean) => void;
  meetings?: any;
  isAdmin?: boolean;
  onRefresh?: () => void;
}

export const PixelWorkspaceView = ({
  workspace,
  currentUser,
  characters,
  desks,
  rooms,
  furniture,
  getPosition,
  onSelectCharacter,
  onSelectDesk,
  onStageClick,
  recentMessages = {},
  setTyping,
  meetings,
  isAdmin,
  onRefresh,
}: Props) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ type: "desk" | "room" | "furniture"; id: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const tileX = Math.floor(px / TILE_SIZE);
    const tileY = Math.floor(py / TILE_SIZE);

    if (isEditMode && selectedItem && isDragging) {
      handleMoveItem(selectedItem.type, selectedItem.id, tileX, tileY);
      setIsDragging(false);
    } else {
      onStageClick(tileX, tileY);
    }
  };

  const handleMoveItem = async (type: string, id: string, x: number, y: number) => {
    const table = type === "desk" ? "pixel_desks" : type === "room" ? "pixel_rooms" : "pixel_furniture";
    const { error } = await supabase
      .from(table as any)
      .update({ position_x: x, position_y: y } as any)
      .eq("id", id);
    
    if (!error && onRefresh) onRefresh();
  };

  const handleRotateItem = async (type: string, id: string, currentRotation: number) => {
    const table = type === "desk" ? "pixel_desks" : type === "room" ? "pixel_rooms" : "pixel_furniture";
    const nextRotation = (currentRotation + 90) % 360;
    const { error } = await supabase
      .from(table as any)
      .update({ rotation: nextRotation } as any)
      .eq("id", id);
    
    if (!error && onRefresh) onRefresh();
  };

  const handleDeleteItem = async (type: string, id: string) => {
    const table = type === "desk" ? "pixel_desks" : type === "room" ? "pixel_rooms" : "pixel_furniture";
    const { error } = await supabase
      .from(table as any)
      .update({ is_active: false } as any)
      .eq("id", id);
    
    if (!error) {
      setSelectedItem(null);
      if (onRefresh) onRefresh();
    }
  };

  const handleAddItem = async (kind: FurnitureKind) => {
    const { error } = await supabase
      .from("pixel_furniture" as any)
      .insert({
        workspace_id: workspace.id,
        furniture_key: kind,
        name: kind,
        position_x: 2,
        position_y: 2,
        z_index: 10
      } as any);
    
    if (!error && onRefresh) onRefresh();
  };

  // Combine and sort by z_index
  const sortedLayers = [
    ...rooms.map(r => ({ type: "room" as const, data: r, z: (r as any).z_index ?? 5 })),
    ...furniture.map(f => ({ type: "furniture" as const, data: f, z: f.z_index })),
    ...desks.map(d => ({ type: "desk" as const, data: d, z: (d as any).z_index ?? 20 })),
  ].sort((a, b) => a.z - b.z);

  return (
    <div className="flex flex-col gap-4">
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-primary/20">
          <Button 
            variant={isEditMode ? "default" : "outline"} 
            size="sm" 
            onClick={() => {
              setIsEditMode(!isEditMode);
              setSelectedItem(null);
            }}
            className="gap-2"
          >
            <Move className="w-4 h-4" />
            {isEditMode ? "Sair do Modo Edição" : "Modo Edição (Admin)"}
          </Button>

          {isEditMode && (
            <>
              <div className="h-6 w-px bg-white/10 mx-1" />
              <Button variant="outline" size="sm" onClick={() => handleAddItem("plant")} title="Adicionar Planta">
                <Plus className="w-4 h-4 mr-1" /> Planta
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleAddItem("sofa")} title="Adicionar Sofá">
                <Plus className="w-4 h-4 mr-1" /> Sofá
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleAddItem("pc")} title="Adicionar PC">
                <Plus className="w-4 h-4 mr-1" /> Computador
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleAddItem("coffee")} title="Adicionar Café">
                <Plus className="w-4 h-4 mr-1" /> Café
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleAddItem("board")} title="Adicionar Quadro">
                <Plus className="w-4 h-4 mr-1" /> Quadro
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleAddItem("chair")} title="Adicionar Cadeira">
                <Plus className="w-4 h-4 mr-1" /> Cadeira
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleAddItem("divider")} title="Adicionar Divisória">
                <Plus className="w-4 h-4 mr-1" /> Divisória
              </Button>
            </>
          )}

          {isEditMode && selectedItem && (
            <>
              <div className="h-6 w-px bg-white/10 mx-1" />
              <Button variant="outline" size="sm" onClick={() => setIsDragging(!isDragging)}>
                {isDragging ? "Soltar Item" : "Mover Selecionado"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const item = sortedLayers.find(l => l.type === selectedItem.type && l.data.id === selectedItem.id);
                  if (item) handleRotateItem(selectedItem.type, selectedItem.id, (item.data as any).rotation || 0);
                }}
              >
                <RotateCw className="w-4 h-4 mr-1" /> Rotacionar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  const item = sortedLayers.find(l => l.type === selectedItem.type && l.data.id === selectedItem.id);
                  if (item && "is_locked" in item.data) {
                    const table = item.type === "furniture" ? "pixel_furniture" : item.type === "desk" ? "pixel_desks" : "pixel_rooms";
                    await supabase.from(table as any).update({ is_locked: !item.data.is_locked } as any).eq("id", item.data.id);
                    if (onRefresh) onRefresh();
                  }
                }}
              >
                {(sortedLayers.find(l => l.type === selectedItem.type && l.data.id === selectedItem.id)?.data as any).is_locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(selectedItem.type, selectedItem.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      )}

      <div
        className={`overflow-auto rounded-xl border-2 shadow-inner transition-all ${isEditMode ? 'ring-4 ring-primary/20' : ''}`}
        style={{ borderColor: "#1a1626", background: "#1a1626" }}
      >
        <div
          className={`relative ${isEditMode ? 'cursor-move' : 'cursor-crosshair'}`}
          style={{
            width: STAGE_WIDTH_PX,
            height: STAGE_HEIGHT_PX,
          }}
          aria-label={`Workspace ${workspace.name} (${STAGE_WIDTH_TILES}x${STAGE_HEIGHT_TILES})`}
          onClick={handleStageClick}
        >
          {/* Piso pseudo-iso */}
          <PixelOfficeMap />
          
          {/* Grid visível no modo edição */}
          {isEditMode && (
            <div 
              className="absolute inset-0 pointer-events-none opacity-20" 
              style={{
                backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
                backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`
              }} 
            />
          )}

          {/* Decorações estáticas (apenas para fallback, futuramente removidas se tudo for pixel_furniture) */}
          <PixelOfficeDecorations />

          {/* Camadas ordenadas por Z-index */}
          {sortedLayers.map((layer) => {
            const isSelected = selectedItem?.type === layer.type && selectedItem?.id === layer.data.id;
            const canEdit = isEditMode && (!("is_locked" in layer.data) || !layer.data.is_locked);
            
            const commonStyle: React.CSSProperties = {
              position: 'absolute',
              left: layer.data.position_x * TILE_SIZE,
              top: layer.data.position_y * TILE_SIZE,
              zIndex: layer.z,
              transform: (layer.data as any).rotation ? `rotate(${(layer.data as any).rotation}deg)` : undefined,
              transition: isDragging && isSelected ? 'none' : 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              outline: isSelected ? '2px solid #0ea5e9' : 'none',
              outlineOffset: '2px',
              cursor: canEdit ? 'pointer' : (isEditMode ? 'not-allowed' : 'inherit')
            };

            if (layer.type === "room") {
              const r = layer.data as RoomLite;
              return (
                <div key={r.id} style={commonStyle} onClick={(e) => {
                  if (isEditMode) {
                    e.stopPropagation();
                    setSelectedItem({ type: "room", id: r.id });
                  }
                }}>
                  <PixelRoom room={r} characters={characters} meetings={meetings} />
                </div>
              );
            }

            if (layer.type === "desk") {
              const d = layer.data as DeskLite;
              return (
                <div key={d.id} style={commonStyle} onClick={(e) => {
                  if (isEditMode) {
                    e.stopPropagation();
                    setSelectedItem({ type: "desk", id: d.id });
                  }
                }}>
                  <PixelDesk desk={d} onClick={(desk) => {
                    if (!isEditMode) onSelectDesk(desk);
                  }} />
                </div>
              );
            }

            if (layer.type === "furniture") {
              const f = layer.data as FurnitureLite;
              return (
                <div key={f.id} style={commonStyle} onClick={(e) => {
                  if (isEditMode) {
                    e.stopPropagation();
                    setSelectedItem({ type: "furniture", id: f.id });
                  }
                }}>
                  <PixelFurnitureSprite 
                    kind={f.furniture_key as FurnitureKind} 
                    width={TILE_SIZE * 2} 
                    height={TILE_SIZE * 2} 
                  />
                </div>
              );
            }

            return null;
          })}

          {/* Personagens (Sempre no topo dos objetos, mas com sua própria lógica de profundidade) */}
          {characters
            .filter((c) => c.is_visible && !c.is_blocked)
            .map((c) => {
              const pos = getPosition(c.user_id, { x: c.position_x, y: c.position_y });
              return (
                <div key={c.user_id} style={{ zIndex: 100, position: 'absolute' }}>
                  <PixelAvatar
                    character={c}
                    posX={pos.x}
                    posY={pos.y}
                    onClick={onSelectCharacter}
                    recentMessage={recentMessages[c.user_id]}
                    isTyping={c.is_typing}
                  />
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
