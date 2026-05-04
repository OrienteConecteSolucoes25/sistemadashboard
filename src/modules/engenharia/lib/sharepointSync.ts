// STUB do sharepointSync. As edge functions sharepoint-sync/list-create
// não foram portadas para o ERP OCS. Esta versão preserva a API pública
// mas todas as operações remotas são no-op (retornam ok=false com mensagem).
// Quando alguém integrar SharePoint/OneDrive, basta substituir as chamadas.

import { supabase } from "@/integrations/supabase/client";
import { lsGet, lsSet } from "./storage";
import { fireAudit } from "./audit";

export type SyncMode = "replace" | "diff";

export interface Destination {
  id: string; label: string; type: "onedrive" | "sharepoint";
  siteId?: string; siteName?: string; driveId?: string; driveName?: string;
  folderPath: string; webUrl?: string;
}

export interface ModuleConfig {
  enabled: boolean; fileName: string; sheetName: string; destinationId?: string;
}

export interface SharepointConfig {
  enabled: boolean; folderPath: string; mode: SyncMode;
  modules: Record<string, ModuleConfig>;
  destinations: Destination[];
  defaultDestinationId?: string;
}

const CFG_KEY = "eng_sp_config_v3";
const LOG_KEY = "eng_sp_log";

export const DEFAULT_MODULE_LABELS: Record<string, string> = {
  art: "ART", atividades: "Atividades", demandas: "Demandas",
  ocs_solicits: "Solicitações de Engenharia", ocs_arts: "ART (legado)",
  ocs_atividades: "Atividades (legado)", ocs_demandas: "Demandas (legado)",
  ocs_emails: "E-mails", ocs_relatorios: "Relatórios",
  ocs_ligacoes_energia: "Ligações de Energia", ocs_rfi: "RFI",
  projetos: "Projetos", sites: "Sites", tasks: "Tarefas",
};

const DEFAULT_KINDS = Object.keys(DEFAULT_MODULE_LABELS);
function defaultModules(): Record<string, ModuleConfig> {
  return Object.fromEntries(DEFAULT_KINDS.map((k) => [k, { enabled: true, fileName: `eng-${k}.xlsx`, sheetName: k.slice(0, 31) }]));
}
function defaultOneDriveDestination(folderPath = "Engenharia"): Destination {
  return { id: "default-onedrive", label: "OneDrive (não conectado)", type: "onedrive", folderPath };
}

export function getSpConfig(): SharepointConfig {
  const cur = lsGet<SharepointConfig | null>(CFG_KEY, null);
  if (cur && cur.modules) {
    const merged = { ...defaultModules(), ...cur.modules };
    const dests = cur.destinations?.length ? cur.destinations : [defaultOneDriveDestination(cur.folderPath)];
    return { ...cur, modules: merged, destinations: dests, defaultDestinationId: cur.defaultDestinationId ?? dests[0].id };
  }
  const def = defaultOneDriveDestination();
  return { enabled: false, folderPath: "Engenharia", mode: "replace",
    modules: defaultModules(), destinations: [def], defaultDestinationId: def.id };
}
export function saveSpConfig(cfg: SharepointConfig) { lsSet(CFG_KEY, cfg); }

export interface SpLogEntry { ts: string; kind: string; ok: boolean; message: string; rowCount?: number; mode?: SyncMode }
export function getSpLog(): SpLogEntry[] { return lsGet<SpLogEntry[]>(LOG_KEY, []); }
export function clearSpLog() { lsSet(LOG_KEY, []); notify(); }

const pending = new Set<string>();
const listeners = new Set<() => void>();
function notify() { for (const l of listeners) try { l(); } catch { /* noop */ } }
export function subscribeSp(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
export function getPendingKinds(): string[] { return Array.from(pending); }

export function scheduleSpSync(_kind: string) {
  // STUB: SharePoint sync não disponível no ERP OCS.
  // Preserva a interface para o resto do código não quebrar.
}

export async function retryKind(_kind: string): Promise<{ ok: boolean; message: string }> {
  return { ok: false, message: "SharePoint sync não configurado neste ambiente." };
}

export async function syncAllNow(): Promise<{ ok: number; fail: number }> {
  return { ok: 0, fail: 0 };
}

export async function testSpConnection(): Promise<{ ok: boolean; message: string }> {
  return { ok: false, message: "Integração SharePoint ainda não disponível no ERP OCS." };
}

export interface MeInfo { user: { id: string; displayName: string; mail?: string }; drive: { id: string; name: string; driveType: string; webUrl: string } | null }
export interface SpSite { id: string; name: string; webUrl: string; description?: string }
export interface SpDrive { id: string; name: string; driveType: string; webUrl: string }
export interface SpChild { id: string; name: string; isFolder: boolean; childCount?: number; webUrl?: string }

export const spApi = {
  me: async () => { throw new Error("SharePoint não disponível"); },
  listSites: async (_search?: string) => { throw new Error("SharePoint não disponível"); },
  listDrives: async (_siteId: string) => { throw new Error("SharePoint não disponível"); },
  listChildren: async (_opts: { driveId?: string; siteId?: string; itemId?: string; path?: string }) => { throw new Error("SharePoint não disponível"); },
  createFolder: async (_opts: { driveId?: string; siteId?: string; parentId?: string; parentPath?: string; name: string }) => { throw new Error("SharePoint não disponível"); },
};

export interface SyncRunRow { id: string; kind: string; status: string; message: string | null; row_count: number | null; mode: string | null; ran_at: string }
export async function getLastRunsByKind(): Promise<Record<string, SyncRunRow>> {
  const { data } = await (supabase.from("eng_sync_runs" as any).select("id,kind,status,message,row_count,mode,ran_at").order("ran_at", { ascending: false }).limit(500) as any);
  if (!data) return {};
  const out: Record<string, SyncRunRow> = {};
  for (const r of data as SyncRunRow[]) if (!out[r.kind]) out[r.kind] = r;
  return out;
}
export async function getRecentRuns(limit = 100): Promise<SyncRunRow[]> {
  const { data } = await (supabase.from("eng_sync_runs" as any).select("id,kind,status,message,row_count,mode,ran_at").order("ran_at", { ascending: false }).limit(limit) as any);
  return (data ?? []) as SyncRunRow[];
}

// Suprimir auditoria não-usada do linter
void fireAudit;
