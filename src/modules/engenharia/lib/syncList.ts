import { supabase } from "@/integrations/supabase/client";
import { lsGet, lsSet, uid, isUuid } from "./storage";

const MIGRATED = (k: string) => `__migrated_eng_v2_${k}`;
const TABLE = "eng_shared_records" as const;

async function waitForSession(timeoutMs = 4000): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) return session.user.id;
  return new Promise((resolve) => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s?.user?.id) { clearTimeout(t); data.subscription.unsubscribe(); resolve(s.user.id); }
    });
    const t = setTimeout(() => { data.subscription.unsubscribe(); resolve(null); }, timeoutMs);
  });
}

function normalizeIds<T extends { id: string }>(items: T[]): { items: T[]; changed: boolean } {
  let changed = false;
  const out = items.map((it) => {
    if (!isUuid(it.id)) { changed = true; return { ...it, id: uid() }; }
    return it;
  });
  return { items: out, changed };
}

export async function loadListFromShared<T extends { id: string }>(kind: string, legacyKey: string): Promise<T[]> {
  const userId = await waitForSession();
  if (!userId) return lsGet<T[]>(legacyKey, []);

  if (!localStorage.getItem(MIGRATED(legacyKey))) {
    const local = lsGet<T[]>(legacyKey, []);
    if (Array.isArray(local) && local.length > 0) {
      const { items: normalized } = normalizeIds(local);
      lsSet(legacyKey, normalized);
      const rows = normalized.map((item) => ({ kind, data: item as any, created_by: userId, id: item.id }));
      const { error } = await (supabase.from(TABLE as any).upsert(rows as any, { onConflict: "id" }) as any);
      if (error) console.error("loadListFromShared migrate", kind, error);
      else localStorage.setItem(MIGRATED(legacyKey), "1");
    } else {
      localStorage.setItem(MIGRATED(legacyKey), "1");
    }
  }

  const { data, error } = await (supabase.from(TABLE as any).select("id, data").eq("kind", kind).order("created_at", { ascending: false }) as any);
  if (error) { console.error("loadListFromShared", kind, error); return lsGet<T[]>(legacyKey, []); }
  const items = (data ?? []).map((r: any) => ({ ...(r.data as object), id: r.id })) as T[];

  if (items.length === 0) {
    const local = lsGet<T[]>(legacyKey, []);
    if (local.length > 0) {
      const { items: normalized } = normalizeIds(local);
      lsSet(legacyKey, normalized);
      const rows = normalized.map((item) => ({ kind, data: item as any, created_by: userId, id: item.id }));
      const { error: e2 } = await (supabase.from(TABLE as any).upsert(rows as any, { onConflict: "id" }) as any);
      if (e2) console.error("loadListFromShared re-push", kind, e2);
      return normalized;
    }
  }

  lsSet(legacyKey, items);
  return items;
}

export async function saveListToShared<T extends { id: string }>(kind: string, legacyKey: string, next: T[], prev: T[]): Promise<T[]> {
  const { items: normalizedNext } = normalizeIds(next);
  lsSet(legacyKey, normalizedNext);

  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return normalizedNext;

  const prevMap = new Map(prev.map((p) => [p.id, p]));
  const nextMap = new Map(normalizedNext.map((n) => [n.id, n]));

  const toInsert: Array<{ id: string; kind: string; data: T; created_by: string }> = [];
  const toUpdate: Array<{ id: string; data: T }> = [];
  const toDelete: string[] = [];

  for (const [id, n] of nextMap) {
    const p = prevMap.get(id);
    if (!p) toInsert.push({ id, kind, data: n, created_by: userId });
    else if (JSON.stringify(p) !== JSON.stringify(n)) toUpdate.push({ id, data: n });
  }
  for (const [id] of prevMap) {
    if (!nextMap.has(id) && isUuid(id)) toDelete.push(id);
    else if (!nextMap.has(id) && !isUuid(id)) {
      try { await (supabase.from(TABLE as any).delete().eq("id", id as any) as any); } catch { /* ignore */ }
    }
  }

  if (toInsert.length) {
    const { error } = await (supabase.from(TABLE as any).upsert(toInsert as any, { onConflict: "id" }) as any);
    if (error) { console.error("syncList insert", kind, error); throw error; }
  }
  for (const u of toUpdate) {
    const { error } = await (supabase.from(TABLE as any).update({ data: u.data as any }).eq("id", u.id) as any);
    if (error) { console.error("syncList update", kind, error); throw error; }
  }
  if (toDelete.length) {
    const { error } = await (supabase.from(TABLE as any).delete().in("id", toDelete) as any);
    if (error) { console.error("syncList delete", kind, error); throw error; }
  }
  return normalizedNext;
}
