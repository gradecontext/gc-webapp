import { env } from "@/lib/env";
import type { MembershipRole, MembershipStatus } from "@/lib/api";

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

export type Gender = "MALE" | "FEMALE" | "NON_BINARY" | "PREFER_NOT_TO_SAY";

/**
 * Embedded client on GET /users/me — richer than `MembershipClient` in api.ts
 * (which backs the lighter `/memberships/me` roster picker), so kept separate
 * rather than widening that type for fields the roster endpoint may not return.
 */
export interface ProfileMembershipClient {
  id: number;
  name: string;
  slug: string;
  domain?: string | null;
  logo?: string | null;
  cover_image?: string | null;
  details?: string | null;
  client_website?: string | null;
  client_x?: string | null;
  client_linkedin?: string | null;
  client_instagram?: string | null;
  verified: boolean;
  plan: string;
  active: boolean;
}

export interface ProfileMembership {
  id: number;
  client_id: number;
  role: MembershipRole;
  status: MembershipStatus;
  created_at: string;
  updated_at: string;
  client: ProfileMembershipClient;
}

export interface BackendUserResponse {
  id: number;
  supabase_auth_id?: string;
  email: string;
  name: string | null;
  title?: string | null;
  active: boolean;
  verified?: boolean;
  display_name: string | null;
  user_name?: string | null;
  image_url?: string | null;
  user_image?: string | null;
  user_image_cover?: string | null;
  user_bio_detail?: string | null;
  user_bio_brief?: string | null;
  gender?: Gender | null;
  created_at?: string;
  updated_at?: string;
  memberships?: ProfileMembership[];
  /** Omitted (not null) when the caller has >1 ACTIVE membership and no X-Client-Id was sent. */
  client?: ProfileMembershipClient;
}

export interface UpdateProfilePayload {
  name?: string;
  title?: string;
  display_name?: string;
  user_name?: string;
  image_url?: string;
  user_image?: string;
  user_image_cover?: string;
  user_bio_detail?: string;
  user_bio_brief?: string;
  gender?: Gender;
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

/** Updates the caller's own profile. The backend verifies ownership by supabaseAuthId. */
export async function updateUserProfile(
  userId: number,
  payload: UpdateProfilePayload,
  accessToken: string
): Promise<BackendUserResponse> {
  const res = await fetch(`${env.apiBaseUrl}/api/v1/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      body?.message ?? body?.error ?? `Update failed (${res.status})`
    );
  }

  return body?.data ?? body;
}
