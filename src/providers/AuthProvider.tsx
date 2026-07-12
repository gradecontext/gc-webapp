"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { sendGAEvent } from "@next/third-parties/google";
import { createClient } from "@/lib/supabase/client";
import { BackendUserResponse, fetchCurrentUser, type ProfileMembership } from "@/lib/auth-api";
import { getMyMemberships, type Membership } from "@/lib/api";
import { env } from "@/lib/env";

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
  refreshMemberships: (tokenOverride?: string) => Promise<void>;
  /**
   * Call this after POST /users succeeds. Sets all auth state directly from
   * the registration response — no extra API calls, no page reload, no race
   * with the backend indexing the new user row.
   */
  completeRegistration: (user: BackendUserResponse, accessToken: string) => Promise<void>;
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

/** Map the richer ProfileMembership (from /users/me) to the leaner Membership shape. */
function toMembership(pm: ProfileMembership): Membership {
  return {
    id: pm.id,
    role: pm.role,
    status: pm.status,
    client: {
      id: pm.client.id,
      name: pm.client.name,
      slug: pm.client.slug,
      logo: pm.client.logo ?? null,
      plan: pm.client.plan,
      active: pm.client.active,
    },
  };
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [backendUser, setBackendUser] = useState<BackendUserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeClientId, setActiveClientIdState] = useState<number | null>(null);

  const supabase = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createClient();
  }, []);

  const applyMembershipList = useCallback((list: Membership[]) => {
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
  }, []);

  const loadMemberships = useCallback(async (accessToken: string) => {
    try {
      const list = await getMyMemberships({ accessToken });
      applyMembershipList(list);
    } catch {
      setMemberships([]);
      setActiveClientIdState(null);
    }
  }, [applyMembershipList]);

  // Coalesces calls that are genuinely concurrent for the same token (e.g. the
  // getSession()/onAuthStateChange race on mount) into one request. Cleared as
  // soon as it resolves, so it never masks a later, deliberate refresh.
  const inFlightCheckRef = useRef<{ token: string; promise: Promise<void> } | null>(null);

  const checkBackendUser = useCallback((accessToken: string): Promise<void> => {
    if (inFlightCheckRef.current?.token === accessToken) {
      return inFlightCheckRef.current.promise;
    }

    const promise = (async () => {
      const { user, notFound } = await fetchCurrentUser(accessToken);
      if (user) {
        setBackendUser(user);
        setNeedsRegistration(false);
        await loadMemberships(accessToken);
      } else if (notFound) {
        setNeedsRegistration(true);
      }
    })().finally(() => {
      if (inFlightCheckRef.current?.token === accessToken) {
        inFlightCheckRef.current = null;
      }
    });

    inFlightCheckRef.current = { token: accessToken, promise };
    return promise;
  }, [loadMemberships]);

  const setActiveClientId = useCallback((clientId: number) => {
    localStorage.setItem(ACTIVE_CLIENT_STORAGE_KEY, String(clientId));
    setActiveClientIdState(clientId);
  }, []);

  const refreshMemberships = useCallback(async (tokenOverride?: string) => {
    const token =
      tokenOverride ??
      (await supabase!.auth.getSession()).data.session?.access_token ??
      session?.access_token;
    if (token) {
      await loadMemberships(token);
    }
  }, [supabase, session?.access_token, loadMemberships]);

  /**
   * Bootstrap auth state directly from the POST /users response.
   *
   * The backend takes a moment to make a freshly-created user row visible to
   * subsequent authenticated endpoints (GET /users/me, GET /memberships/me).
   * Rather than retrying those endpoints after registration, we read the data
   * that was already returned by POST /users:
   *
   *   - backendUser  → set from the response directly (no GET /users/me)
   *   - memberships  → set from response.memberships if the backend includes
   *                    them; otherwise fall back to GET /memberships/me
   *   - needsRegistration → set to false
   *
   * This is equivalent to what a hard-refresh achieves (AuthProvider
   * re-initialises from a clean session) but without leaving the page.
   */
  const completeRegistration = useCallback(async (
    user: BackendUserResponse,
    accessToken: string,
  ) => {
    setBackendUser(user);

    if (user.memberships && user.memberships.length > 0) {
      applyMembershipList(user.memberships.map(toMembership));
    } else {
      // Backend has read-replica lag: GET /memberships/me can return 401 for
      // ~500ms after POST /users even with a valid token, then 200 on the next
      // identical request. Retry with backoff instead of giving up immediately.
      const delays = [400, 800, 1600, 3000];
      let loaded = false;
      for (let i = 0; i <= delays.length; i++) {
        try {
          const list = await getMyMemberships({ accessToken });
          applyMembershipList(list);
          loaded = true;
          break;
        } catch {
          if (i < delays.length) {
            await new Promise((r) => setTimeout(r, delays[i]));
          }
        }
      }
      if (!loaded) {
        setMemberships([]);
        setActiveClientIdState(null);
      }
    }

    setNeedsRegistration(false);

    // The extension's content script validates any session it captures by
    // calling GET /users/me — which 404s until this point, since no User row
    // exists yet. Re-broadcast the (unchanged) session now that registration
    // is done so the extension gets a fresh signal to retry validation.
    if (session) syncSessionToLocalStorage(session);
  }, [applyMembershipList, session]);

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
    } = supabase.auth.onAuthStateChange(async (event, s) => {
      // INITIAL_SESSION carries the same session getSession() above just
      // fetched — skip it here or every mount with an existing session
      // double-fires GET /users/me for identical data.
      if (event === "INITIAL_SESSION") return;

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

  // Attribute all GA hits on this domain to the signed-in backend user, so
  // registrations/conversions tracked here roll up under the same person GA
  // saw on the contextgrade.com landing site. Never send email/PII — just
  // the backend numeric id. Fires on initial session bootstrap and again
  // right after completeRegistration sets backendUser for a brand-new user.
  useEffect(() => {
    sendGAEvent("config", env.gaMeasurementId, {
      user_id: backendUser ? String(backendUser.id) : null,
    });
  }, [backendUser]);

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
      completeRegistration,
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
      completeRegistration,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
