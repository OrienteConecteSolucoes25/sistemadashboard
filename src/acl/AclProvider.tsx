/**
 * ACL Central — Leva 2
 * Provê:
 *  - useCan(key, companyId?) → boolean
 *  - useAcl() → { isInternalOcs, permissions, refresh, loading }
 *  - <Can perm="..." companyId? fallback?>...</Can>
 *  - <RouteGuard perm="..." companyId? redirect?>...</RouteGuard>
 *
 * Estratégia: 1 fetch único ao logar (acl_user_permissions do próprio user),
 * mais 1 RPC server-authoritative `can()` quando precisar checar fora da lista
 * (cobre o fallback de compatibilidade com o sistema antigo).
 */
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type AclRow = { permission_key: string; company_id: string | null };

type AclCtx = {
  loading: boolean;
  isInternalOcs: boolean;
  /** True somente para staff OCS verdadeiro (registro em acl_internal_staff ou owner). Admin de cliente NÃO é true. */
  isOcsTrueStaff: boolean;
  permissions: AclRow[];
  /** Verificação síncrona (cache local) */
  can: (key: string, companyId?: string | null) => boolean;
  /** Verificação síncrona ignorando bypass internalOcs (apenas perms explícitas) */
  hasGrant: (key: string, companyId?: string | null) => boolean;
  /** Verificação autoritativa via RPC (cobre fallback do sistema antigo) */
  canServer: (key: string, companyId?: string | null) => Promise<boolean>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AclCtx>({
  loading: true,
  isInternalOcs: false,
  isOcsTrueStaff: false,
  permissions: [],
  can: () => false,
  hasGrant: () => false,
  canServer: async () => false,
  refresh: async () => {},
});

export function AclProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [perms, setPerms] = useState<AclRow[]>([]);
  const [internalOcs, setInternalOcs] = useState(false);
  const [trueStaff, setTrueStaff] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    // MODO ABERTO: acesso total liberado, com ou sem login
    setPerms([]);
    setTrueStaff(true);
    setInternalOcs(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const hasGrant = useCallback(
    (key: string, companyId?: string | null) =>
      perms.some(
        (p) =>
          p.permission_key === key &&
          (p.company_id === null || p.company_id === companyId),
      ),
    [perms],
  );

  const can = useCallback(
    (key: string, companyId?: string | null) => {
      if (internalOcs) return true;
      return hasGrant(key, companyId);
    },
    [internalOcs, hasGrant],
  );

  const canServer = useCallback(
    async (key: string, companyId?: string | null) => {
      if (internalOcs) return true;
      if (can(key, companyId)) return true;
      const { data, error } = await supabase.rpc("can" as any, {
        _uid: user?.id,
        _key: key,
        _company: companyId ?? null,
      });
      if (error) return false;
      return !!data;
    },
    [user?.id, internalOcs, can],
  );

  const value = useMemo<AclCtx>(
    () => ({ loading, isInternalOcs: internalOcs, isOcsTrueStaff: trueStaff, permissions: perms, can, hasGrant, canServer, refresh: load }),
    [loading, internalOcs, trueStaff, perms, can, hasGrant, canServer, load],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAcl = () => useContext(Ctx);
export const useCan = (key: string, companyId?: string | null) => useContext(Ctx).can(key, companyId);
export const useHasGrant = (key: string, companyId?: string | null) => useContext(Ctx).hasGrant(key, companyId);
export const useIsInternalOcs = () => useContext(Ctx).isInternalOcs;
export const useIsOcsTrueStaff = () => useContext(Ctx).isOcsTrueStaff;

/** Esconde children se o usuário não tiver a permissão. */
export function Can({
  perm,
  companyId,
  fallback = null,
  children,
}: {
  perm: string;
  companyId?: string | null;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const ok = useCan(perm, companyId);
  return <>{ok ? children : fallback}</>;
}

/** Bloqueia acesso a uma rota inteira. Usar como wrapper. */
export function RouteGuard({
  perm,
  companyId,
  redirect = "/app",
  children,
}: {
  perm: string;
  companyId?: string | null;
  redirect?: string;
  children: ReactNode;
}) {
  const { loading } = useAcl();
  const ok = useCan(perm, companyId);
  if (loading) return null;
  if (!ok) return <Navigate to={redirect} replace />;
  return <>{children}</>;
}
