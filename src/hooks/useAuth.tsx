import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type Ctx = {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({} as Ctx);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const intentionalSignOutRef = useRef(false);
  const lastSessionRef = useRef<Session | null>(null);

  const handleSession = (s: Session | null) => {
    const prev = lastSessionRef.current;
    // Evita re-render quando é só refresh de token do mesmo usuário
    if (prev && s && prev.user?.id === s.user?.id && prev.access_token === s.access_token) {
      return;
    }
    const sameUser = prev?.user?.id && s?.user?.id && prev.user.id === s.user.id;
    setSession(s);
    lastSessionRef.current = s;
    if (s?.user && !sameUser) {
      setTimeout(async () => {
        // Garante profile (idempotente)
        try {
          await supabase.rpc("ensure_current_profile" as any);
        } catch {
          /* noop */
        }
        // Verifica role admin
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", s.user.id)
          .eq("role", "admin")
          .maybeSingle();
        setIsAdmin(!!data);
      }, 0);
    } else if (!s?.user) {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      // Se receber SIGNED_OUT espontâneo (sem intenção do user), tenta restaurar
      if (event === "SIGNED_OUT" && !intentionalSignOutRef.current) {
        supabase.auth.getSession().then(({ data }) => {
          if (data.session) {
            handleSession(data.session);
          } else {
            handleSession(null);
          }
        });
        return;
      }
      handleSession(s);
    });

    supabase.auth.getSession().then(({ data }) => {
      handleSession(data.session);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        session,
        user: session?.user ?? null,
        isAdmin,
        loading,
        signOut: async () => {
          intentionalSignOutRef.current = true;
          await supabase.auth.signOut();
          window.location.assign("/auth");
        },
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);
