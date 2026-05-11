import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Linkedin, MessageSquare, Video, Armchair, ExternalLink, Briefcase, LogOut, Store, Search, ShieldAlert, Cpu, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_COLOR, STATUS_LABEL, type PixelStatus } from "../core/constants";
import { PixelSprite } from "../renderer/PixelSprite";
import { AvatarLayeredSprite } from "../renderer/AvatarLayeredSprite";
import { PixelStatusBadge } from "../renderer/PixelStatusBadge";
import { roleFromSpriteKey } from "../core/pixelOfficeTheme";
import { useCharacterDetails } from "../data/useCharacterDetails";
import { useDeskActions } from "../data/useDeskActions";
import type { PixelCharacter, DeskLite } from "../data/usePixelWorkspaceData";
import { PixelGamificationPanel } from "../components/PixelGamificationPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


type Selected =
  | { kind: "character"; data: PixelCharacter }
  | { kind: "desk"; data: DeskLite }
  | null;

interface Props {
  selected: Selected;
  onClose: () => void;
  onFocusDesk?: (deskId: string) => void;
  onCallToMeeting?: (userId: string) => void;
  refresh?: () => void;
}

const isValidLinkedIn = (url: string | null | undefined): boolean => {
  if (!url) return false;
  try {
    const u = new URL(url);
    return (
      (u.protocol === "https:" || u.protocol === "http:") &&
      /(^|\.)linkedin\.com$/i.test(u.hostname)
    );
  } catch {
    return false;
  }
};

const formatRelativeTime = (iso: string | null): string => {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return `há ${d} d`;
};

export const PixelSidePanel = ({ selected, onClose, onFocusDesk, onCallToMeeting, refresh }: Props) => {
  const hasValid =
    selected?.kind === "character" ? !!selected.data?.user_id :
    selected?.kind === "desk" ? !!selected.data?.id : false;
  const open = selected !== null && hasValid;
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[380px] sm:w-[420px] overflow-y-auto p-0">
        {selected?.kind === "character" && selected.data?.user_id && (
          <Tabs defaultValue="profile" className="w-full h-full flex flex-col">
            <div className="p-6 pb-0">
              <SheetHeader className="mb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile">Perfil</TabsTrigger>
                  <TabsTrigger value="gamification" className="flex items-center gap-2">
                    <Trophy className="w-3 h-3" /> Progresso
                  </TabsTrigger>
                </TabsList>
              </SheetHeader>
            </div>
            
            <TabsContent value="profile" className="flex-1 overflow-y-auto p-6 pt-0">
              <CharacterPanel
                userId={selected.data.user_id}
                onFocusDesk={onFocusDesk}
                onCallToMeeting={onCallToMeeting}
              />
            </TabsContent>
            
            <TabsContent value="gamification" className="flex-1 overflow-y-auto p-6 pt-0">
              <div className="space-y-4 py-2">
                <PixelGamificationPanel userId={selected.data.user_id} />
              </div>
            </TabsContent>
          </Tabs>
        )}
        {selected?.kind === "desk" && (
          <div className="p-6">
            <DeskPanel desk={selected.data} refresh={refresh} />
          </div>
        )}
      </SheetContent>
    </Sheet>

  );
};

// ---------------------------------------------------------------
// Character panel
// ---------------------------------------------------------------
const CharacterPanel = ({
  userId,
  onFocusDesk,
  onCallToMeeting,
}: {
  userId: string;
  onFocusDesk?: (deskId: string) => void;
  onCallToMeeting?: (userId: string) => void;
}) => {
  const { user } = useAuth();
  const { data, loading } = useCharacterDetails(userId);
  const isMe = user?.id === userId;

  const updateStatus = async (newStatus: PixelStatus) => {
    const { error } = await supabase.from("pixel_profiles").update({ status: newStatus } as any).eq("user_id", userId);
    if (!error) {
      toast.success("Status atualizado");
      // O refresh acontece via realtime na página principal ou no usePixelWorkspaceData
    }
  };

  if (loading || !data) {
    return (
      <>
        <SheetHeader>
          <SheetTitle>Carregando…</SheetTitle>
          <SheetDescription>Buscando dados do personagem.</SheetDescription>
        </SheetHeader>
      </>
    );
  }

  const status = (data.status as PixelStatus) ?? "offline";
  const linkedinOk = isValidLinkedIn(data.linkedin_url);

  const handleLinkedIn = () => {
    if (!linkedinOk || !data.linkedin_url) {
      toast.error("Link do LinkedIn inválido");
      return;
    }
    window.open(data.linkedin_url, "_blank", "noopener,noreferrer");
  };

  const futureFeature = (label: string) =>
    toast(`${label} chega em breve`, {
      description: "Funcionalidade futura — ainda não implementada.",
    });

  return (
    <div className="space-y-6">
      <div className="text-left">
        <h2 className="text-lg font-bold">{data.display_name ?? "Sem nome"}</h2>
        <p className="text-sm text-muted-foreground">{data.job_title || "—"}</p>
      </div>


      {/* Avatar grande + status */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <div
          className="p-6 rounded-xl border shadow-inner relative"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted) / 0.5) 100%)",
          }}
        >
          <AvatarLayeredSprite customization={data.customization} size={144} grayscale={!data.is_online} />
          {!data.is_online && (
             <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] font-mono">OFFLINE</Badge>
          )}
          {data.is_online && (
             <Badge variant="default" className="absolute top-2 right-2 text-[10px] font-mono bg-green-500 hover:bg-green-600 border-none text-white">ONLINE</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <PixelStatusBadge status={data.is_online ? status : "offline"} />
          <span className="font-medium">{STATUS_LABEL[data.is_online ? status : "offline"]}</span>
          {data.current_action && data.current_action !== "idle" && data.is_online && (
            <span className="text-muted-foreground">· {data.current_action}</span>
          )}
        </div>
      </div>

      {isMe && (
        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {(["available", "busy", "meeting", "away", "focused"] as PixelStatus[]).map((s) => (
            <Button
              key={s}
              variant={status === s ? "default" : "outline"}
              size="sm"
              className="h-7 text-[10px] px-2 rounded-full"
              onClick={() => updateStatus(s)}
            >
              {STATUS_LABEL[s]}
            </Button>
          ))}
        </div>
      )}

      <Separator className="my-5" />

      {/* Bloco: identificação */}
      <Section title="Identificação">
        <Row label="Cargo" value={data.job_title} />
        {data.show_age && data.age != null && (
          <Row label="Idade" value={`${data.age} anos`} />
        )}
        <Row
          label="Grupo"
          value={
            data.group_name ? (
              <Badge
                variant="outline"
                style={{
                  borderColor: data.group_color ?? undefined,
                  color: data.group_color ?? undefined,
                }}
              >
                {data.group_name}
              </Badge>
            ) : (
              "—"
            )
          }
        />
      </Section>

      {/* Bloco: trabalho */}
      <Section title="Trabalho">
        <Row label="Setor" value={data.department} />
        <Row label="Mesa" value={data.desk_name ?? "Sem mesa atribuída"} />
        {data.sector_description && (
          <div className="pt-2">
            <div className="text-xs text-muted-foreground mb-1">O que faz no setor</div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {data.sector_description}
            </p>
          </div>
        )}
      </Section>

      {/* Bloco: contato */}
      <Section title="Contato">
        {data.linkedin_url ? (
          <button
            type="button"
            onClick={handleLinkedIn}
            disabled={!linkedinOk}
            className="flex items-center gap-2 text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
            title={linkedinOk ? data.linkedin_url : "URL inválida"}
          >
            <Linkedin className="w-4 h-4" />
            <span className="truncate max-w-[260px]">{data.linkedin_url}</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        ) : (
          <div className="text-sm text-muted-foreground">Sem LinkedIn cadastrado</div>
        )}
      </Section>

      {/* Bloco: atividade */}
      <Section title="Atividade">
        <Row label="Última atividade" value={formatRelativeTime(data.last_moved_at)} />
      </Section>

      <Separator className="my-5" />

      {/* Ações */}
      <div className="flex flex-col gap-2">
        <Button
          variant="default"
          className="justify-start"
          onClick={() => onCallToMeeting?.(userId)}
        >
          <Video className="w-4 h-4 mr-2" /> Chamar para reunião
        </Button>
        <Button
          variant="secondary"
          className="justify-start"
          onClick={() => futureFeature("Envio de mensagem")}
        >
          <MessageSquare className="w-4 h-4 mr-2" /> Enviar mensagem
        </Button>
        <Button
          variant="outline"
          className="justify-start"
          disabled={!data.desk_id}
          onClick={() => data.desk_id && onFocusDesk?.(data.desk_id)}
        >
          <Armchair className="w-4 h-4 mr-2" />
          {data.desk_id ? "Ver mesa" : "Sem mesa para visualizar"}
        </Button>

        <div className="h-px bg-muted my-2" />
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 px-1">Atalhos Operacionais</div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="h-9 text-[10px] uppercase font-bold" onClick={() => window.location.href='/app/ti/chamados?user=' + userId}>
            <Search className="w-3 h-3 mr-1" /> Chamados
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-[10px] uppercase font-bold" onClick={() => window.location.href='/app/marketplace?customer=' + userId}>
            <Store className="w-3 h-3 mr-1" /> Pedidos
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-[10px] uppercase font-bold" onClick={() => window.location.href='/app/ocs-guard?audit=' + userId}>
            <ShieldAlert className="w-3 h-3 mr-1" /> Auditoria
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-[10px] uppercase font-bold" onClick={() => window.location.href='/app/jarbas?context=' + userId}>
            <Cpu className="w-3 h-3 mr-1" /> Jarbas
          </Button>
        </div>
      </div>
    </div>

  );
};

// ---------------------------------------------------------------
// Desk panel — sentar / trabalhar / levantar
// ---------------------------------------------------------------
const DeskPanel = ({ desk, refresh }: { desk: DeskLite; refresh?: () => void }) => {
  const { sit, work, standUp, canControl, busy } = useDeskActions(refresh);
  const allowed = canControl(desk);
  const ownerStatus = (desk.owner_status as PixelStatus) ?? "offline";
  const isSitting = desk.owner_is_sitting === true;
  const isWorking = desk.owner_current_action === "working";

  return (
    <>
      <SheetHeader className="text-left">
        <SheetTitle>{desk.desk_name ?? "Mesa"}</SheetTitle>
        <SheetDescription>Tipo: {desk.desk_type}</SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-4">
        <Section title="Mesa">
          <Row label="Nome" value={desk.desk_name} />
          <Row label="Posição" value={`${desk.position_x}, ${desk.position_y}`} />
        </Section>

        <Section title="Dono">
          <Row label="Nome" value={desk.owner_display_name ?? "Sem dono"} />
          {desk.user_id && (
            <Row
              label="Status"
              value={
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: STATUS_COLOR[ownerStatus] }}
                  />
                  {STATUS_LABEL[ownerStatus]}
                  {isWorking && (
                    <Badge variant="secondary" className="ml-1">
                      Trabalhando
                    </Badge>
                  )}
                </div>
              }
            />
          )}
        </Section>

        <Separator />

        {!desk.user_id && (
          <p className="text-sm text-muted-foreground">
            Esta mesa ainda não tem dono. Um administrador precisa atribuí-la.
          </p>
        )}

        {desk.user_id && !allowed && (
          <p className="text-sm text-muted-foreground">
            Você só pode interagir com a sua própria mesa.
          </p>
        )}

        {desk.user_id && allowed && (
          <div className="flex flex-col gap-2">
            <Button
              variant="default"
              className="justify-start"
              disabled={busy || isWorking}
              onClick={() => work(desk)}
            >
              <Briefcase className="w-4 h-4" />
              Trabalhar
            </Button>
            <Button
              variant="secondary"
              className="justify-start"
              disabled={busy || (isSitting && !isWorking)}
              onClick={() => sit(desk)}
            >
              <Armchair className="w-4 h-4" />
              Sentar
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              disabled={busy || !isSitting}
              onClick={() => standUp(desk)}
            >
              <LogOut className="w-4 h-4" />
              Levantar
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-5">
    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
      {title}
    </h3>
    <div className="space-y-1.5">{children}</div>
  </div>
);

const Row = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode | string | null | undefined;
}) => (
  <div className="flex items-start justify-between gap-3 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right font-medium">{value || "—"}</span>
  </div>
);
