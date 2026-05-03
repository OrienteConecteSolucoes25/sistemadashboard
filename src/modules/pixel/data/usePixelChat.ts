import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ChatMessage {
  id: string;
  workspace_id: string;
  sender_user_id: string;
  message: string;
  created_at: string;
  is_deleted: boolean;
  deleted_by: string | null;
  // hidratado em memória
  sender_display_name?: string | null;
  sender_avatar_sprite_key?: string | null;
}

const PAGE_SIZE = 50;

export const messageSchema = z
  .string()
  .trim()
  .min(1, "Mensagem vazia")
  .max(1000, "Máximo 1000 caracteres");

/**
 * Hook de chat por workspace.
 * - Carrega últimas 50 (ordem desc) e expõe "carregar mais".
 * - Realtime para INSERT/UPDATE.
 * - Não busca avatars/nomes de outras tabelas via join: hidrata via pixel_profiles
 *   em uma única query agrupada (evita N+1).
 */
export function usePixelChat(workspaceId: string | null) {
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sending, setSending] = useState(false);
  const profileCache = useRef<Map<string, { display_name: string | null; avatar_sprite_key: string | null }>>(
    new Map(),
  );

  const hydrateSenders = useCallback(async (rows: ChatMessage[]) => {
    const missing = Array.from(
      new Set(rows.map((r) => r.sender_user_id).filter((id) => !profileCache.current.has(id))),
    );
    if (missing.length > 0) {
      const { data } = await supabase
        .from("pixel_profiles")
        .select("user_id, display_name, avatar_sprite_key")
        .in("user_id", missing);
      (data ?? []).forEach((p) =>
        profileCache.current.set(p.user_id, {
          display_name: p.display_name,
          avatar_sprite_key: p.avatar_sprite_key,
        }),
      );
    }
    return rows.map((r) => {
      const p = profileCache.current.get(r.sender_user_id);
      return {
        ...r,
        sender_display_name: p?.display_name ?? null,
        sender_avatar_sprite_key: p?.avatar_sprite_key ?? null,
      };
    });
  }, []);

  // Carga inicial
  useEffect(() => {
    if (!workspaceId) {
      setMessages([]);
      setHasMore(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      profileCache.current.clear();
      const { data, error } = await supabase
        .from("pixel_messages")
        .select("id, workspace_id, sender_user_id, message, created_at, is_deleted, deleted_by")
        .eq("workspace_id", workspaceId)
        .eq("message_type", "group")
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      if (cancelled) return;
      if (error) {
        console.error(error);
        setMessages([]);
        setHasMore(false);
        setLoading(false);
        return;
      }
      const hydrated = await hydrateSenders((data ?? []) as ChatMessage[]);
      if (cancelled) return;
      // Ordem ASC para exibição
      setMessages(hydrated.reverse());
      setHasMore((data ?? []).length === PAGE_SIZE);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, hydrateSenders]);

  // Realtime
  useEffect(() => {
    if (!workspaceId) return;
    const channel = supabase
      .channel(`pixel-chat-${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pixel_messages",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        async (payload) => {
          const row = payload.new as ChatMessage;
          const [hydrated] = await hydrateSenders([row]);
          setMessages((prev) =>
            prev.some((m) => m.id === hydrated.id) ? prev : [...prev, hydrated],
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pixel_messages",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          const row = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.map((m) => (m.id === row.id ? { ...m, ...row } : m)).filter((m) => !m.is_deleted),
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, hydrateSenders]);

  const loadMore = useCallback(async () => {
    if (!workspaceId || messages.length === 0 || !hasMore) return;
    const oldest = messages[0];
    const { data } = await supabase
      .from("pixel_messages")
      .select("id, workspace_id, sender_user_id, message, created_at, is_deleted, deleted_by")
      .eq("workspace_id", workspaceId)
      .eq("message_type", "group")
      .lt("created_at", oldest.created_at)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    const hydrated = await hydrateSenders((data ?? []) as ChatMessage[]);
    setMessages((prev) => [...hydrated.reverse(), ...prev]);
    setHasMore((data ?? []).length === PAGE_SIZE);
  }, [workspaceId, messages, hasMore, hydrateSenders]);

  const send = useCallback(
    async (text: string) => {
      if (!workspaceId || !user) return;
      const parsed = messageSchema.safeParse(text);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      setSending(true);
      try {
        const { error } = await supabase.from("pixel_messages").insert({
          workspace_id: workspaceId,
          sender_user_id: user.id,
          message: parsed.data,
          message_type: "group",
        });
        if (error) throw error;
      } finally {
        setSending(false);
      }
    },
    [workspaceId, user],
  );

  const canDelete = useCallback(
    (m: ChatMessage) => isAdmin || m.sender_user_id === user?.id,
    [isAdmin, user?.id],
  );

  const deleteMessage = useCallback(
    async (m: ChatMessage) => {
      if (!user || !canDelete(m)) return;
      const { error } = await supabase
        .from("pixel_messages")
        .update({ is_deleted: true, deleted_by: user.id })
        .eq("id", m.id);
      if (error) throw error;
      setMessages((prev) => prev.filter((x) => x.id !== m.id));
    },
    [user, canDelete],
  );

  return {
    loading,
    sending,
    hasMore,
    messages,
    send,
    loadMore,
    deleteMessage,
    canDelete,
  };
}
