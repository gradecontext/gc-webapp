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
import { getMyMemberships, type Membership } from "@/lib/api";

const ACTIVE_CLIENT_STORAGE_KEY = "cg_active_client_id";

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
  memberships: Membership[];
  activeMembership: Membership | null;
  setActiveClientId: (clientId: number) => void;
  refreshMemberships: () => Promise<void>;
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
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeClientId, setActiveClientIdState] = useState<number | null>(null);

  const supabase = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createClient();
  }, []);

  const loadMemberships = useCallback(async (accessToken: string) => {
    try {
      const list = await getMyMemberships({ accessToken });
      setMemberships(list);

      const active = list.filter((m) => m.status === "ACTIVE");
      const stored = Number(localStorage.getItem(ACTIVE_CLIENT_STORAGE_KEY));
      const storedIsValid = active.some((m) => m.client.id === stored);

      if (storedIsValid) {
        setActiveClientIdState(stored);
      } else if (active.length === 1) {
        setActiveClientIdState(active[0].client.id);
        localStorage.setItem(ACTIVE_CLIENT_STORAGE_KEY, String(active[0].client.id));
      } else {
        setActiveClientIdState(null);
      }
    } catch {
      setMemberships([]);
      setActiveClientIdState(null);
    }
  }, []);

  const checkBackendUser = useCallback(async (accessToken: string) => {
    const { user, notFound } = await fetchCurrentUser(accessToken);
    if (user) {
      setBackendUser(user);
      setNeedsRegistration(false);
      await loadMemberships(accessToken);
    } else if (notFound) {
      setNeedsRegistration(true);
    }
  }, [loadMemberships]);

  const setActiveClientId = useCallback((clientId: number) => {
    localStorage.setItem(ACTIVE_CLIENT_STORAGE_KEY, String(clientId));
    setActiveClientIdState(clientId);
  }, []);

  const refreshMemberships = useCallback(async () => {
    // Always fetch a fresh token from Supabase rather than reading from React
    // state — the stored session can be stale if TOKEN_REFRESHED fired between
    // the last render and this call, which causes a 401 in production.
    const { data } = await supabase!.auth.getSession();
    const token = data.session?.access_token ?? session?.access_token;
    if (token) {
      await loadMemberships(token);
    }
  }, [supabase, session?.access_token, loadMemberships]);

  const activeMembership = useMemo(
    () => memberships.find((m) => m.client.id === activeClientId) ?? null,
    [memberships, activeClientId]
  );

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
        setMemberships([]);
        setActiveClientIdState(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, checkBackendUser]);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    setSession(null);
    setBackendUser(null);
    setNeedsRegistration(false);
    setMemberships([]);
    setActiveClientIdState(null);
    localStorage.removeItem(ACTIVE_CLIENT_STORAGE_KEY);
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
      memberships,
      activeMembership,
      setActiveClientId,
      refreshMemberships,
    }),
    [
      session,
      backendUser,
      loading,
      needsRegistration,
      signOut,
      refreshBackendUser,
      memberships,
      activeMembership,
      setActiveClientId,
      refreshMemberships,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
