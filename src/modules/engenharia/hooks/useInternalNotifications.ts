import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { markRead, markAllRead } from "@/modules/engenharia/lib/automations/internalNotifications";

export interface InternalNotif {
  id: string;
  user_id: string | null;
  origem: string;
  origem_id: string | null;
  modulo: string | null;
  titulo: string;
  detalhe: string | null;
  tipo: string;
  route: string | null;
  lida: boolean;
  created_at: string;
}

export function useInternalNotifications(limit = 50) {
  const { user } = useAuth() as any;
  const [items, setItems] = useState<InternalNotif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    const { data } = await supabase
      .from("eng_internal_notifications" as any)
      .select("*")
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(limit);
    setItems((data ?? []) as any);
    setLoading(false);
  }, [user, limit]);

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase.channel(`rt_eng_notifs_${user.id}_${Math.random().toString(36).slice(2)}`);
    ch.on("postgres_changes" as any,
        { event: "*", schema: "public", table: "eng_internal_notifications" },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  const unread = items.filter((i) => !i.lida).length;

  return {
    items,
    unread,
    loading,
    markRead: async (id: string) => { await markRead(id); load(); },
    markAllRead: async () => { await markAllRead(); load(); },
    reload: load,
  };
}
