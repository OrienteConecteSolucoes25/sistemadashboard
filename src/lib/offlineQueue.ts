// Fila simples de mutações offline. Quando voltar a conexão, reprocessa.
import { get, set } from "idb-keyval";
import { supabase } from "@/integrations/supabase/client";

const QUEUE_KEY = "ocs-offline-queue";

export interface QueuedMutation {
  id: string;
  table: string;
  op: "insert" | "update" | "delete";
  payload: any;
  match?: Record<string, any>;
  createdAt: number;
}

async function readQueue(): Promise<QueuedMutation[]> {
  try {
    return ((await get(QUEUE_KEY)) as QueuedMutation[]) ?? [];
  } catch {
    return [];
  }
}

async function writeQueue(q: QueuedMutation[]) {
  try {
    await set(QUEUE_KEY, q);
  } catch {
    /* ignore */
  }
}

export async function enqueueMutation(m: Omit<QueuedMutation, "id" | "createdAt">) {
  const q = await readQueue();
  q.push({ ...m, id: crypto.randomUUID(), createdAt: Date.now() });
  await writeQueue(q);
}

export async function queueSize(): Promise<number> {
  return (await readQueue()).length;
}

let processing = false;
export async function processQueue(): Promise<{ ok: number; fail: number }> {
  if (processing) return { ok: 0, fail: 0 };
  if (typeof navigator !== "undefined" && !navigator.onLine) return { ok: 0, fail: 0 };
  processing = true;
  let ok = 0, fail = 0;
  try {
    const q = await readQueue();
    const remaining: QueuedMutation[] = [];
    for (const m of q) {
      try {
        const sb: any = supabase;
        let q2 = sb.from(m.table);
        if (m.op === "insert") {
          const { error } = await q2.insert(m.payload);
          if (error) throw error;
        } else if (m.op === "update") {
          let upd = q2.update(m.payload);
          for (const [k, v] of Object.entries(m.match ?? {})) upd = upd.eq(k, v);
          const { error } = await upd;
          if (error) throw error;
        } else if (m.op === "delete") {
          let del = q2.delete();
          for (const [k, v] of Object.entries(m.match ?? {})) del = del.eq(k, v);
          const { error } = await del;
          if (error) throw error;
        }
        ok++;
      } catch {
        fail++;
        remaining.push(m);
      }
    }
    await writeQueue(remaining);
  } finally {
    processing = false;
  }
  return { ok, fail };
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    processQueue().catch(() => {});
  });
}
