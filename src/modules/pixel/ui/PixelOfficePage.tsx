import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  usePixelWorkspaceData,
  type DeskLite,
  type PixelCharacter,
} from "../data/usePixelWorkspaceData";
import { useCharacterMovement } from "../data/useCharacterMovement";
import { PixelWorkspaceView } from "../renderer/PixelWorkspaceView";
import { PixelWorkspaceSelector } from "./PixelWorkspaceSelector";
import { PixelSidePanel } from "./PixelSidePanel";

type Selected =
  | { kind: "character"; data: PixelCharacter }
  | { kind: "desk"; data: DeskLite }
  | null;

export default function PixelOfficePage() {
  const { user, isAdmin } = useAuth();
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

  const { moveTo, getPosition, canMove } = useCharacterMovement({
    workspaceId: activeWorkspace?.id ?? null,
    isAdmin,
  });

  // Realtime: outros usuários do mesmo workspace veem a posição final
  useEffect(() => {
    if (!activeWorkspace?.id) return;
    const channel = supabase
      .channel(`pixel-positions-${activeWorkspace.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pixel_positions",
          filter: `workspace_id=eq.${activeWorkspace.id}`,
        },
        (payload) => {
          const row: any = payload.new ?? payload.old;
          // Ignora a própria posição (já foi atualizada localmente)
          if (row?.user_id === user?.id) return;
          refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeWorkspace?.id, user?.id, refresh]);

  const handleStageClick = (tileX: number, tileY: number) => {
    if (!user?.id) return;
    // Usuário comum move só o próprio personagem.
    // (Admin pode mover outros pelo painel lateral — futuro.)
    moveTo(user.id, tileX, tileY);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pixel Office</h1>
          <p className="text-sm text-muted-foreground">
            Clique em um ponto livre para mover seu personagem. Clique em um personagem ou mesa para ver detalhes.
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
            getPosition={(uid, fb) => getPosition(uid, fb)}
            onSelectCharacter={(c) => setSelected({ kind: "character", data: c })}
            onSelectDesk={(d) => setSelected({ kind: "desk", data: d })}
            onStageClick={handleStageClick}
          />
        </>
      )}

      <PixelSidePanel selected={selected} onClose={() => setSelected(null)} refresh={refresh} />
    </div>
  );
}
