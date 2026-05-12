// Cache leve de leituras com IndexedDB (idb-keyval).
// Uso: const { data, stale } = await cachedQuery("crea_arts:list", () => supabase.from(...).select(...));
import { get, set } from "idb-keyval";

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

interface Entry<T> {
  data: T;
  ts: number;
}

export interface CachedResult<T> {
  data: T | null;
  stale: boolean;
  cachedAt: number | null;
  error: any;
}

export async function cachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<CachedResult<T>> {
  const storageKey = `ocs-cache:${key}`;
  try {
    const data = await fetcher();
    try {
      await set(storageKey, { data, ts: Date.now() } satisfies Entry<T>);
    } catch {
      /* quota — ignora */
    }
    return { data, stale: false, cachedAt: Date.now(), error: null };
  } catch (err) {
    try {
      const cached = (await get(storageKey)) as Entry<T> | undefined;
      if (cached && Date.now() - cached.ts < TTL_MS) {
        return { data: cached.data, stale: true, cachedAt: cached.ts, error: err };
      }
    } catch {
      /* ignore */
    }
    return { data: null, stale: false, cachedAt: null, error: err };
  }
}

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const cached = (await get(`ocs-cache:${key}`)) as Entry<T> | undefined;
    return cached?.data ?? null;
  } catch {
    return null;
  }
}
