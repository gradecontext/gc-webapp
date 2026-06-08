"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { BackendUserResponse, fetchCurrentUser } from "@/lib/auth-api";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  backendUser: BackendUserResponse | null;
  loading: boolean;
  needsRegistration: boolean;
  setNeedsRegistration: (v: boolean) => void;
  setBackendUser: (u: BackendUserResponse | null) => void;
  signOut: () => Promise<void>;
  refreshBackendUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function syncSessionToLocalStorage(session: Session | null) {
  if (session) {
    const payload = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      token_type: session.token_type ?? "bearer",
    };
    localStorage.setItem("cg_auth_signal", JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("cg:auth", { detail: payload }));
  } else {
    localStorage.removeItem("cg_auth_signal");
    window.dispatchEvent(new CustomEvent("cg:signout"));
  }
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [backendUser, setBackendUser] = useState<BackendUserResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [needsRegistration, setNeedsRegistration] = useState(false);

  const supabase = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createClient();
  }, []);

  const checkBackendUser = useCallback(async (accessToken: string) => {
    const { user, notFound } = await fetchCurrentUser(accessToken);
    if (user) {
      setBackendUser(user);
      setNeedsRegistration(false);
    } else if (notFound) {
      setNeedsRegistration(true);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      syncSessionToLocalStorage(s);
      if (s?.access_token) {
        checkBackendUser(s.access_token).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      syncSessionToLocalStorage(s);
      if (s?.access_token) {
        await checkBackendUser(s.access_token);
      } else {
        setBackendUser(null);
        setNeedsRegistration(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, checkBackendUser]);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    setSession(null);
    setBackendUser(null);
    setNeedsRegistration(false);
  }, [supabase]);

  const refreshBackendUser = useCallback(async () => {
    if (session?.access_token) {
      await checkBackendUser(session.access_token);
    }
  }, [session?.access_token, checkBackendUser]);

  const value = useMemo<AuthContextType>(
    () => ({
      session,
      user: session?.user ?? null,
      backendUser,
      loading,
      needsRegistration,
      setNeedsRegistration,
      setBackendUser,
      signOut,
      refreshBackendUser,
    }),
    [
      session,
      backendUser,
      loading,
      needsRegistration,
      signOut,
      refreshBackendUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
