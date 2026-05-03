import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Trash2, MessagesSquare, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PixelSprite } from "../renderer/PixelSprite";
import { usePixelChat, messageSchema } from "../data/usePixelChat";
import type { WorkspaceLite } from "../data/usePixelWorkspaceData";

interface Props {
  /** Workspace atualmente visível na tela (default selecionado). */
  activeWorkspace: WorkspaceLite | null;
  /** Lista de workspaces visíveis (admin tem todos; comum só os seus). */
  workspaces: WorkspaceLite[];
}

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

/**
 * Painel de Comunidade — chat por workspace/grupo (mural geral).
 * Admin pode trocar o canal entre todos os grupos (Engenharia/Jurídico/Admin/Geral).
 * Usuário comum vê apenas os canais dos seus grupos (RLS).
 */
export const PixelCommunityPanel = ({ activeWorkspace, workspaces }: Props) => {
  const { user, isAdmin } = useAuth();
  const [channelId, setChannelId] = useState<string | null>(activeWorkspace?.id ?? null);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!channelId && activeWorkspace?.id) setChannelId(activeWorkspace.id);
  }, [activeWorkspace?.id, channelId]);

  const chat = usePixelChat(channelId);

  // Auto-scroll para o final quando chegam mensagens novas
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chat.messages.length, channelId]);

  const channels = useMemo(
    () => workspaces.map((w) => ({ id: w.id, name: w.name })),
    [workspaces],
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = messageSchema.safeParse(draft);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    try {
      await chat.send(parsed.data);
      setDraft("");
    } catch (err: any) {
      toast.error("Falha ao enviar", { description: err?.message });
    }
  };

  const handleDelete = async (m: Parameters<typeof chat.deleteMessage>[0]) => {
    try {
      await chat.deleteMessage(m);
    } catch (err: any) {
      toast.error("Falha ao apagar", { description: err?.message });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessagesSquare className="w-4 h-4" /> Comunidade
        </CardTitle>
        <div className="flex flex-wrap items-center gap-1.5">
          {channels.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={channelId === c.id ? "default" : "outline"}
              onClick={() => setChannelId(c.id)}
            >
              # {c.name}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {!channelId && (
          <p className="text-sm text-muted-foreground">Selecione um canal.</p>
        )}

        {channelId && (
          <>
            {chat.hasMore && (
              <div className="flex justify-center">
                <Button size="sm" variant="ghost" onClick={() => chat.loadMore()}>
                  <ChevronUp className="w-3.5 h-3.5" /> Carregar mais
                </Button>
              </div>
            )}

            <div
              ref={scrollRef}
              className="h-72 overflow-y-auto rounded-md border bg-muted/20 p-2 space-y-2"
            >
              {chat.loading && (
                <p className="text-sm text-muted-foreground">Carregando…</p>
              )}
              {!chat.loading && chat.messages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma mensagem ainda. Seja o primeiro!
                </p>
              )}
              {chat.messages.map((m) => {
                const mine = m.sender_user_id === user?.id;
                return (
                  <div key={m.id} className="flex items-start gap-2 group">
                    <div className="shrink-0 mt-0.5">
                      <PixelSprite spriteKey={m.sender_avatar_sprite_key ?? null} size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold truncate">
                          {m.sender_display_name ?? "Usuário"}
                        </span>
                        {mine && <Badge variant="secondary" className="h-4 px-1 text-[10px]">você</Badge>}
                        <span className="text-muted-foreground">{formatTime(m.created_at)}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words leading-snug">
                        {m.message}
                      </p>
                    </div>
                    {chat.canDelete(m) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        title={isAdmin && !mine ? "Moderar (apagar)" : "Apagar"}
                        onClick={() => handleDelete(m)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSend} className="flex items-center gap-2">
              <Input
                placeholder="Escreva uma mensagem (máx. 1000)"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={1000}
                disabled={chat.sending}
              />
              <Button type="submit" disabled={chat.sending || draft.trim().length === 0}>
                <Send className="w-4 h-4" />
                Enviar
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
};
