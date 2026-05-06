import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_KEY = "ocs_impersonation";
const sb: any = supabase;

type ImpersonationState = {
  active: boolean;
  companyId: string | null;
  companyName: string | null;
  sessionId: string | null;
  dataAccess: boolean; // se cliente liberou ver dados reais (default: false → mascarado)
  startedAt: string | null;
};

type Ctx = ImpersonationState & {
  start: (company: { id: string; nome: string }, opts: { reason: string; dataAccess: boolean }) => Promise<void>;
  end: () => Promise<void>;
  setDataAccess: (v: boolean) => void;
};

const ImpCtx = createContext<Ctx>({} as Ctx);

const initial: ImpersonationState = {
  active: false, companyId: null, companyName: null, sessionId: null, dataAccess: false, startedAt: null,
};

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<ImpersonationState>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? { ...initial, ...JSON.parse(raw) } : initial;
    } catch { return initial; }
  });

  useEffect(() => {
    if (state.active) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else sessionStorage.removeItem(STORAGE_KEY);
  }, [state]);

  const start = useCallback(async (company: { id: string; nome: string }, opts: { reason: string; dataAccess: boolean }) => {
    if (!user) return;
    const { data, error } = await sb.from("ocs_impersonation_sessions").insert({
      ocs_user_id: user.id, company_id: company.id, reason: opts.reason, data_access_granted: opts.dataAccess,
    }).select("id, started_at").single();
    if (error) throw error;
    setState({
      active: true, companyId: company.id, companyName: company.nome,
      sessionId: data.id, dataAccess: opts.dataAccess, startedAt: data.started_at,
    });
  }, [user]);

  const end = useCallback(async () => {
    if (state.sessionId) {
      await sb.from("ocs_impersonation_sessions").update({ ended_at: new Date().toISOString() }).eq("id", state.sessionId);
    }
    setState(initial);
  }, [state.sessionId]);

  const setDataAccess = useCallback((v: boolean) => setState(s => ({ ...s, dataAccess: v })), []);

  return <ImpCtx.Provider value={{ ...state, start, end, setDataAccess }}>{children}</ImpCtx.Provider>;
}

export const useImpersonation = () => useContext(ImpCtx);

/** Mascara um valor textual quando estamos impersonando sem acesso a dados reais. */
export function maskIfNeeded(value: any, imp: { active: boolean; dataAccess: boolean }): any {
  if (!imp.active || imp.dataAccess) return value;
  if (value == null) return value;
  if (typeof value === "number") return "•••";
  const s = String(value);
  if (s.length <= 2) return "••";
  return s.slice(0, 1) + "•".repeat(Math.min(6, s.length - 1));
}
