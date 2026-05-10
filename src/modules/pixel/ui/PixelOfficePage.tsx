import { useEffect, useState, useCallback } from "react";
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
import MarketplaceHome from "@/modules/marketplace/ui/MarketplaceHome";
import FinanceiroDashboard from "@/modules/financeiro/ui/FinanceiroDashboard";
import { DiretorAgentChat } from "@/modules/comunicacao/ui/DiretorAgentChat";
import { DiretorNpc } from "./DiretorNpc";
import { ModuleAgentNpc } from "./ModuleAgentNpc";
import { ModuleAgentChat } from "./ModuleAgentChat";
import { HardHat, Scale, HeartHandshake, FileSignature, MessageSquare, ShieldAlert, Cpu, Zap, ShoppingCart, DollarSign } from "lucide-react";
import { ActiveBrandKitProvider } from "@/modules/comunicacao/hooks/useActiveBrandKit";

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
    refresh,
  } = usePixelWorkspaceData();

  const [selected, setSelected] = useState<Selected>(null);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [preselectInvitee, setPreselectInvitee] = useState<string | null>(null);
  const [activeAgentPanel, setActiveAgentPanel] = useState<string | null>(null);

  const { moveTo, getPosition } = useCharacterMovement({
    workspaceId: activeWorkspace?.id ?? null,
    isAdmin,
  });

  const meetings = usePixelMeetings({ workspaceId: activeWorkspace?.id ?? null });

  // Realtime: posições de outros usuários
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
          if (row?.user_id === user?.id) return;
          refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeWorkspace?.id, user?.id, refresh]);

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
      const tiP = supabase.from("ti_tickets").select("id", { count: "exact", head: true }).eq("status", "aberto");

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
            <span>👤 {characters.length} personagens</span>
            <span>🪑 {desks.length} mesas</span>
            <span>🚪 {rooms.length} salas</span>
            <span>🎥 {meetings.meetings.length} reuniões</span>
          </div>
          <div className="relative">
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
            {/* NPC Diretor OCS dentro do mapa — abre o chat ao ser clicado */}
            <DiretorAgentChat renderTrigger={(open) => <DiretorNpc onClick={open} notifications={directorNotifs} />} />

            {/* Agentes por Módulo */}
            <ModuleAgentChat
              moduleKey="engenharia"
              agentName="Engenheiro OCS"
              icon={HardHat}
              welcomeMessage="Olá! Sou o **Engenheiro OCS**. Posso te ajudar com obras, sites, suprimentos, materiais e gestão de projetos técnicos. Como posso te auxiliar na Engenharia hoje?"
              renderTrigger={(open) => (
                <ModuleAgentNpc
                  name="Engenheiro OCS"
                  moduleKey="engenharia"
                  icon={HardHat}
                  primaryColor="#f59e0b"
                  secondaryColor="#d97706"
                  startX={20}
                  onClick={open}
                />
              )}
            />

            <ModuleAgentChat
              moduleKey="juridico"
              agentName="Consultor Jurídico OCS"
              icon={Scale}
              welcomeMessage="Olá! Sou o **Consultor Jurídico OCS**. Estou aqui para ajudar com processos, prazos, documentos e governança jurídica. Como posso te apoiar hoje?"
              renderTrigger={(open) => (
                <ModuleAgentNpc
                  name="Consultor Jurídico OCS"
                  moduleKey="juridico"
                  icon={Scale}
                  primaryColor="#3b82f6"
                  secondaryColor="#2563eb"
                  startX={35}
                  onClick={open}
                />
              )}
            />

            <ModuleAgentChat
              moduleKey="rhdp"
              agentName="Diretora de RH/DP OCS"
              icon={HeartHandshake}
              welcomeMessage="Olá! Sou a **Diretora de RH/DP OCS**. Posso te ajudar com colaboradores, recrutamento, benefícios, folha de pagamento e solicitações de RH. Como posso te ajudar?"
              renderTrigger={(open) => (
                <ModuleAgentNpc
                  name="Diretora de RH/DP OCS"
                  moduleKey="rhdp"
                  icon={HeartHandshake}
                  primaryColor="#ec4899"
                  secondaryColor="#db2777"
                  startX={50}
                  onClick={open}
                />
              )}
            />

            <ModuleAgentChat
              moduleKey="crea"
              agentName="Analista de CREA/ART OCS"
              icon={FileSignature}
              welcomeMessage="Olá! Sou o **Analista de CREA/ART OCS**. Posso te auxiliar com registros de ART, protocolos, certidões e tratativas junto ao conselho. O que você precisa?"
              renderTrigger={(open) => (
                <ModuleAgentNpc
                  name="Analista de CREA/ART OCS"
                  moduleKey="crea"
                  icon={FileSignature}
                  primaryColor="#10b981"
                  secondaryColor="#059669"
                  startX={65}
                  onClick={open}
                />
              )}
            />

            <ModuleAgentChat
              moduleKey="ocs_guard"
              agentName="OCS Guard — Segurança"
              icon={ShieldAlert}
              welcomeMessage="Olá! Sou o **OCS Guard**. Sou seu agente de cibersegurança e governança digital. Como posso proteger sua empresa hoje?"
              renderTrigger={(open) => (
                <ModuleAgentNpc
                  name="OCS Guard"
                  moduleKey="ocs_guard"
                  icon={ShieldAlert}
                  primaryColor="#ef4444"
                  secondaryColor="#b91c1c"
                  startX={80}
                  onClick={() => {
                    setActiveAgentPanel("ocs_guard");
                    open();
                  }}
                />
              )}
            />

            <ModuleAgentChat
              moduleKey="ti"
              agentName="Agente de TI OCS"
              icon={Cpu}
              welcomeMessage="Olá! Sou o **Agente de TI OCS**. Posso te ajudar a abrir chamados, diagnosticar problemas e gerenciar ativos. Qual sua demanda técnica?"
              renderTrigger={(open) => (
                <ModuleAgentNpc
                  name="Agente de TI"
                  moduleKey="ti"
                  icon={Cpu}
                  primaryColor="#4f46e5"
                  secondaryColor="#3730a3"
                  startX={10}
                  onClick={() => {
                    setActiveAgentPanel("ti");
                    open();
                  }}
                />
              )}
            />

            <ModuleAgentChat
              moduleKey="jarbas"
              agentName="Jarbas OCS"
              icon={Zap}
              welcomeMessage="Olá! Sou o **Jarbas OCS**. Estou pronto para orientar suas atividades de campo, ler manuais técnicos e guiar seus procedimentos por voz. O que vamos executar agora?"
              renderTrigger={(open) => (
                <ModuleAgentNpc
                  name="Jarbas OCS"
                  moduleKey="jarbas"
                  icon={Zap}
                  primaryColor="#0ea5e9"
                  secondaryColor="#0284c7"
                  startX={90}
                  onClick={() => {
                    setActiveAgentPanel("jarbas");
                    open();
                  }}
                />
              )}
            />

            <ModuleAgentChat
              moduleKey="marketplace"
              agentName="Gestor Marketplace OCS"
              icon={ShoppingCart}
              welcomeMessage="Olá! Sou o **Gestor do Marketplace**. Posso te ajudar a gerenciar sua loja, cadastrar produtos e acompanhar suas vendas e logística. Como posso impulsionar seu negócio hoje?"
              renderTrigger={(open) => (
                <ModuleAgentNpc
                  name="Gestor Marketplace"
                  moduleKey="marketplace"
                  icon={ShoppingCart}
                  primaryColor="#16a34a"
                  secondaryColor="#166534"
                  startX={42}
                  onClick={() => {
                    setActiveAgentPanel("marketplace");
                    open();
                  }}
                />
              )}
            />

            <ModuleAgentChat
              moduleKey="financeiro"
              agentName="Conselheira Financeira OCS"
              icon={DollarSign}
              welcomeMessage="Olá! Sou a **Conselheira Financeira OCS**. Posso te ajudar a gerenciar suas contas, analisar lucros e planejar suas metas, seja você pessoa física ou jurídica. Qual sua dúvida financeira hoje?"
              renderTrigger={(open) => (
                <ModuleAgentNpc
                  name="Conselheira Financeira"
                  moduleKey="financeiro"
                  icon={DollarSign}
                  primaryColor="#3b82f6"
                  secondaryColor="#1d4ed8"
                  startX={28}
                  onClick={() => {
                    setActiveAgentPanel("financeiro");
                    open();
                  }}
                />
              )}
            />
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

          <PixelMeetingsPanel
            meetings={meetings}
            characters={characters}
            onNewMeeting={() => {
              setPreselectInvitee(null);
              setMeetingModalOpen(true);
            }}
          />
          <PixelCommunityPanel activeWorkspace={activeWorkspace} workspaces={workspaces} />
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
