import { env } from "@/lib/env";

export type CompanySize =
  | "MICRO"
  | "SMALL"
  | "MEDIUM"
  | "LARGE"
  | "ENTERPRISE"
  | "MEGA";

export type ClientPlan = "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

export interface ClientInput {
  client_id?: number;
  client_name?: string;
  plan?: ClientPlan;
  details?: string;
  logo?: string;
  client_website?: string;
  client_linkedin?: string;
  settings?: Record<string, unknown>;
}

export interface CreateUserPayload {
  email: string;
  name?: string;
  display_name?: string;
  title?: string;
  role?: string;
  gender?: string;
  client: ClientInput;
}

export interface BackendUserResponse {
  id: number;
  email: string;
  name: string | null;
  display_name: string | null;
  role: string;
  active: boolean;
  client_id: number;
  client?: {
    id: number;
    name: string;
    slug: string;
    plan: string;
    domain: string | null;
  };
}

export interface CreateUserResult {
  user: BackendUserResponse;
  existing: boolean;
}

export async function createBackendUser(
  payload: CreateUserPayload,
  accessToken: string
): Promise<CreateUserResult> {
  const res = await fetch(`${env.apiBaseUrl}/api/v1/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      body?.message ?? body?.error ?? `Registration failed (${res.status})`
    );
  }

  return {
    user: body?.data ?? body,
    existing: body?.existing === true,
  };
}

/**
 * Fetch the current user from the backend.
 * Returns { user, notFound } to distinguish "user not registered" from "backend error".
 */
export async function fetchCurrentUser(
  accessToken: string
): Promise<{ user: BackendUserResponse | null; notFound: boolean }> {
  try {
    const res = await fetch(`${env.apiBaseUrl}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.ok) {
      const body = await res.json();
      const user = body?.data ?? body;
      return { user, notFound: false };
    }

    if (res.status === 404 || res.status === 401) {
      return { user: null, notFound: true };
    }

    return { user: null, notFound: false };
  } catch {
    return { user: null, notFound: false };
  }
}
