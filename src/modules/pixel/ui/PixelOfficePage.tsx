import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePixelWorkspaceData, type DeskLite, type PixelCharacter } from "../data/usePixelWorkspaceData";
import { PixelWorkspaceView } from "../renderer/PixelWorkspaceView";
import { PixelWorkspaceSelector } from "./PixelWorkspaceSelector";
import { PixelSidePanel } from "./PixelSidePanel";

type Selected =
  | { kind: "character"; data: PixelCharacter }
  | { kind: "desk"; data: DeskLite }
  | null;

export default function PixelOfficePage() {
  const {
    loading,
    workspaces,
    activeWorkspace,
    setActiveWorkspaceId,
    characters,
    desks,
    rooms,
    refresh,
  } = usePixelWorkspaceData();

  const [selected, setSelected] = useState<Selected>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pixel Office</h1>
          <p className="text-sm text-muted-foreground">
            Escritório virtual do seu grupo. Clique em um personagem ou mesa.
          </p>
        </div>
        <PixelWorkspaceSelector
          workspaces={workspaces}
          activeId={activeWorkspace?.id ?? null}
          onChange={setActiveWorkspaceId}
        />
      </div>

      {loading && <div className="text-muted-foreground">Carregando...</div>}

      {!loading && !activeWorkspace && (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum workspace disponível</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Você ainda não foi adicionado a nenhum grupo de visibilidade. Peça ao
            administrador para incluir você em um grupo.
          </CardContent>
        </Card>
      )}

      {activeWorkspace && (
        <>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>👤 {characters.length} personagens</span>
            <span>🪑 {desks.length} mesas</span>
            <span>🚪 {rooms.length} salas</span>
          </div>
          <PixelWorkspaceView
            workspace={activeWorkspace}
            characters={characters}
            desks={desks}
            rooms={rooms}
            onSelectCharacter={(c) => setSelected({ kind: "character", data: c })}
            onSelectDesk={(d) => setSelected({ kind: "desk", data: d })}
          />
        </>
      )}

      <PixelSidePanel selected={selected} onClose={() => setSelected(null)} refresh={refresh} />
    </div>
  );
}
