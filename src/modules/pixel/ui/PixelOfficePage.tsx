import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  usePixelWorkspaceData,
  type DeskLite,
  type PixelCharacter,
} from "../data/usePixelWorkspaceData";
import { useCharacterMovement } from "../data/useCharacterMovement";
import { usePixelMeetings } from "../data/usePixelMeetings";
import { PixelWorkspaceView } from "../renderer/PixelWorkspaceView";
import { PixelWorkspaceSelector } from "./PixelWorkspaceSelector";
import { PixelSidePanel } from "./PixelSidePanel";
import { PixelMeetingModal } from "./PixelMeetingModal";
import { PixelMeetingInvite } from "./PixelMeetingInvite";
import OcsGuardPage from "@/modules/ocs-guard/ui/OcsGuardPage";
import TiAgentPage from "@/modules/ti/ui/TiAgentPage";
import { JarbasInterface } from "@/modules/jarbas/ui/JarbasInterface";
import { PixelMeetingsPanel } from "./PixelMeetingsPanel";
import { PixelCommunityPanel } from "./PixelCommunityPanel";
import { PixelGamificationPanel } from "../components/PixelGamificationPanel";

import MarketplaceHome from "@/modules/marketplace/ui/MarketplaceHome";
import FinanceiroDashboard from "@/modules/financeiro/ui/FinanceiroDashboard";
import { DiretorAgentChat } from "@/modules/comunicacao/ui/DiretorAgentChat";
import { DiretorNpc } from "./DiretorNpc";
import { ModuleAgentNpc } from "./ModuleAgentNpc";
import { ModuleAgentChat } from "./ModuleAgentChat";
import { NPCS_CONFIG } from "../data/npcsConfig";
import { HardHat, Scale, HeartHandshake, FileSignature, MessageSquare, ShieldAlert, Cpu, Zap, ShoppingCart, DollarSign, Users, Video } from "lucide-react";
import { ActiveBrandKitProvider } from "@/modules/comunicacao/hooks/useActiveBrandKit";
import { toast } from "sonner";

type Selected =
  | { kind: "character"; data: PixelCharacter }
  | { kind: "desk"; data: DeskLite }
  | null;

export default function PixelOfficePage() {
  const { user, isAdmin } = useAuth();
  const [notifTick, setNotifTick] = useState(0);
  const [directorNotifs, setDirectorNotifs] = useState<string[]>([]);
  const [bubbles, setBubbles] = useState<Record<string, string>>({});
  const {
    loading,
    workspaces,
    activeWorkspace,
    setActiveWorkspaceId,
    characters,
    desks,
    rooms,
    furniture,
    refresh,
  } = usePixelWorkspaceData();

  const [selected, setSelected] = useState<Selected>(null);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [preselectInvitee, setPreselectInvitee] = useState<string | null>(null);
  const [activeAgentPanel, setActiveAgentPanel] = useState<string | null>(null);

  const { moveTo, getPosition, setTyping } = useCharacterMovement({
    workspaceId: activeWorkspace?.id ?? null,
    isAdmin,
  });

  const meetings = usePixelMeetings({ workspaceId: activeWorkspace?.id ?? null });

  // Real-time synchronization is now handled inside usePixelWorkspaceData
  // which manages character positions more efficiently via broadcasts and state updates.

  // Realtime: Bubbles de chat
  useEffect(() => {
    if (!activeWorkspace?.id) return;
    const channel = supabase
      .channel(`pixel-bubbles-${activeWorkspace.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pixel_messages",
          filter: `workspace_id=eq.${activeWorkspace.id}`,
        },
        (payload) => {
          const row: any = payload.new;
          if (!row?.sender_user_id || !row?.message) return;
          
          setBubbles(prev => ({ ...prev, [row.sender_user_id]: row.message }));
          
          // Remove a bubble após 5 segundos
          setTimeout(() => {
            setBubbles(prev => {
              const next = { ...prev };
              if (next[row.sender_user_id] === row.message) {
                delete next[row.sender_user_id];
              }
              return next;
            });
          }, 5000);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeWorkspace?.id]);
  
  // Integração Jarbas: Comandos de Voz para Movimento
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { target } = customEvent.detail;
      if (!user?.id) return;
      
      if (target === 'desk') {
        const myDesk = desks.find(d => d.user_id === user.id);
        if (myDesk) moveTo(user.id, myDesk.position_x, myDesk.position_y);
        else toast.info("Você não possui uma mesa atribuída.");
      } else if (target === 'room') {
        const room = rooms[0]; // Vai para a primeira sala disponível
        if (room) moveTo(user.id, room.position_x + 1, room.position_y + 1);
      }
    };
    
    window.addEventListener("pixel-office-move", handler);
    return () => window.removeEventListener("pixel-office-move", handler);
  }, [user?.id, desks, rooms, moveTo]);

  // Personagens "em reunião" recebem badge meeting (via status do profile já vem)
  // Posicionar personagens joined dentro/perto da sala da reunião visualmente
  // (Para simplicidade, sala de reunião visual fica no painel lateral abaixo.)

  const handleStageClick = (tileX: number, tileY: number) => {
    if (!user?.id) return;
    moveTo(user.id, tileX, tileY);
  };

  const handleCallToMeeting = (userId: string) => {
    setPreselectInvitee(userId);
    setMeetingModalOpen(true);
    setSelected(null);
  };

  const loadDirectorNotifs = useCallback(async () => {
    if (!user) return;
    try {
      // 1. Eng Pendencias
      const engP = supabase.from("eng_pendencias").select("id", { count: "exact", head: true }).eq("status", "pendente");
      // 2. TI Chamados
      const tiP = supabase.from("it_tickets").select("id", { count: "exact", head: true }).eq("status", "aberto");

      const [engR, tiR] = await Promise.all([engP, tiP]);
      
      const alerts: string[] = [];
      if ((engR.count ?? 0) > 0) alerts.push(`${engR.count} pendências na Engenharia`);
      if ((tiR.count ?? 0) > 0) alerts.push(`${tiR.count} chamados de TI abertos`);
      
      setDirectorNotifs(alerts);
    } catch (e) {
      console.error("Erro ao carregar notificações do diretor", e);
    }
  }, [user]);

  useEffect(() => {
    loadDirectorNotifs();
    const interval = setInterval(loadDirectorNotifs, 60000); // 1 minuto
    return () => clearInterval(interval);
  }, [loadDirectorNotifs]);

  return (
    <ActiveBrandKitProvider>
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Clique no piso para mover, nos personagens ou mesas para ver detalhes.
        </p>
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
            <span>👤 {characters.filter(c => c.is_online).length}/{characters.length} online</span>
            <span>🪑 {desks.length} mesas</span>
            <span>🚪 {rooms.length} salas</span>
            <span>🎥 {meetings.meetings.length} reuniões</span>
            <div className="h-4 w-px bg-muted mx-1" />
            <div className="flex gap-2 items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Ambiente Social Vivo</span>
            </div>
          </div>
          <div className="relative">
            <PixelWorkspaceView
              workspace={activeWorkspace}
              currentUser={user}
              characters={characters}
              desks={desks}
              rooms={rooms}
              furniture={furniture}
              getPosition={(uid, fb) => getPosition(uid, fb)}
              onSelectCharacter={(c) => setSelected({ kind: "character", data: c })}
              onSelectDesk={(d) => setSelected({ kind: "desk", data: d })}
              onStageClick={handleStageClick}
              recentMessages={bubbles}
              setTyping={setTyping}
              meetings={meetings}
              isAdmin={isAdmin}
              onRefresh={refresh}
              renderer="pixi"
            />
            {/* NPC Diretor OCS dentro do mapa — abre o chat ao ser clicado */}
            <DiretorAgentChat renderTrigger={(open) => <DiretorNpc onClick={open} notifications={directorNotifs} />} />

            {/* Agentes por Módulo Automáticos */}
            {Object.values(NPCS_CONFIG).map((npc) => (
              <ModuleAgentChat
                key={npc.id}
                moduleKey={npc.moduleKey}
                agentName={npc.name}
                agentRole={npc.role}
                icon={npc.icon}
                welcomeMessage={npc.welcomeMessage}
                renderTrigger={(open) => (
                  <ModuleAgentNpc
                    name={npc.name}
                    moduleKey={npc.moduleKey}
                    icon={npc.icon}
                    primaryColor={npc.primaryColor}
                    secondaryColor={npc.secondaryColor}
                    startX={npc.startX}
                    onClick={() => {
                      if (["ocs_guard", "ti", "financeiro", "jarbas", "marketplace", "gamificacao"].includes(npc.id)) {
                        setActiveAgentPanel(npc.id);
                      }
                      open();
                    }}
                  />
                )}
              />
            ))}
          </div>

          {activeAgentPanel === "ocs_guard" && (
            <Card className="mt-4 animate-in slide-in-from-bottom duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl">Painel OCS Guard</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveAgentPanel(null)}>Fechar</Button>
              </CardHeader>
              <CardContent>
                <OcsGuardPage />
              </CardContent>
            </Card>
          )}

          {activeAgentPanel === "ti" && (
            <Card className="mt-4 animate-in slide-in-from-bottom duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl">Painel de TI</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveAgentPanel(null)}>Fechar</Button>
              </CardHeader>
              <CardContent>
                <TiAgentPage />
              </CardContent>
            </Card>
          )}

          {activeAgentPanel === "financeiro" && (
            <Card className="mt-4 animate-in slide-in-from-bottom duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl">Central Financeira OCS</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveAgentPanel(null)}>Fechar</Button>
              </CardHeader>
              <CardContent>
                <FinanceiroDashboard />
              </CardContent>
            </Card>
          )}

          {activeAgentPanel === "jarbas" && (
            <div className="mt-4">
              <JarbasInterface />
              <Card className="bg-slate-950 text-white border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xl text-primary font-bold">Console Operacional Jarbas</CardTitle>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => setActiveAgentPanel(null)}>Minimizar</Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400">O Jarbas está ativo via comando de voz. Utilize o console flutuante no canto inferior para interagir.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeAgentPanel === "marketplace" && (
            <Card className="mt-4 animate-in slide-in-from-bottom duration-300 max-w-[1400px] mx-auto">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl">Portal Marketplace OCS</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveAgentPanel(null)}>Fechar</Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[80vh] overflow-auto">
                  <MarketplaceHome />
                </div>
              </CardContent>
            </Card>
          )}

          {activeAgentPanel === "gamificacao" && (
            <div className="mt-4 flex justify-center animate-in slide-in-from-bottom duration-300">
              <PixelGamificationPanel userId={user?.id ?? ""} />
            </div>
          )}


          <PixelMeetingsPanel
            meetings={meetings}
            characters={characters}
            onNewMeeting={() => {
              setPreselectInvitee(null);
              setMeetingModalOpen(true);
            }}
          />
          <PixelCommunityPanel activeWorkspace={activeWorkspace} workspaces={workspaces} setTyping={setTyping} />

          {/* Mobile Navigation Fixa */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-2 flex justify-around items-center z-[100] safe-area-bottom shadow-lg">
            <Button variant="ghost" size="sm" className="flex flex-col gap-1 h-auto py-2" onClick={() => setActiveWorkspaceId(workspaces[0]?.id)}>
              <Cpu className="w-5 h-5" />
              <span className="text-[10px]">Office</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col gap-1 h-auto py-2" onClick={() => setSelected({ kind: "character", data: characters.find(c => c.user_id === user?.id) as any })}>
              <Users className="w-5 h-5" />
              <span className="text-[10px]">Eu</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col gap-1 h-auto py-2">
              <MessageSquare className="w-5 h-5" />
              <span className="text-[10px]">Chat</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col gap-1 h-auto py-2">
              <Video className="w-5 h-5" />
              <span className="text-[10px]">Reunião</span>
            </Button>
          </div>
        </>
      )}

      <PixelSidePanel
        selected={selected}
        onClose={() => setSelected(null)}
        onCallToMeeting={handleCallToMeeting}
        refresh={refresh}
      />

      <PixelMeetingModal
        open={meetingModalOpen}
        onOpenChange={setMeetingModalOpen}
        workspaceId={activeWorkspace?.id ?? null}
        visibilityGroupId={activeWorkspace?.visibility_group_id ?? null}
        rooms={rooms}
        workspaceCharacters={characters}
        meetings={meetings}
        preselectUserId={preselectInvitee}
      />

      <PixelMeetingInvite
        invites={meetings.myInvites}
        onAccept={meetings.acceptInvite}
        onDecline={meetings.declineInvite}
      />

      {/* Diretor já está embutido no mapa via NPC. Sem botão flutuante duplicado aqui. */}
    </div>
    </ActiveBrandKitProvider>
  );
}
