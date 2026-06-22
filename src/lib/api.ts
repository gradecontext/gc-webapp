import { env } from "@/lib/env";

// ============================================================
// AUTH CONTEXT (passed explicitly into every call below)
// ============================================================

export type ApiAuth = {
  accessToken: string;
  clientId?: number | null;
};

// ============================================================
// CORE ENUMS (mirror backend per-client tables / Decision model)
// ============================================================

export type DecisionStatus =
  | "PROPOSED"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "OVERRIDDEN"
  | "EXPIRED"
  | "ESCALATED";

export type DecisionUrgency = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export type MembershipRole = "OWNER" | "ADMIN" | "APPROVER" | "VIEWER";

export type MembershipStatus = "ACTIVE" | "PENDING" | "REJECTED" | "REMOVED";

// ============================================================
// DECISIONS
// ============================================================

export type SubjectCompany = {
  id: number;
  name: string;
  domain?: string | null;
  external_id?: string | null;
  industry?: string | null;
  country?: string | null;
};

export type Decision = {
  id: string;
  summary: string | null;
  decision_type: string;
  status: DecisionStatus;
  urgency: DecisionUrgency;
  subject_company?: SubjectCompany | null;
  created_at: string;
  decided_at: string | null;
  logged_by?: number | null;
  logged_by_user?: { id: number; name: string | null } | null;
};

export type DecisionLinkType =
  | "PRECEDENT"
  | "SIMILAR_CASE"
  | "POLICY_EXCEPTION"
  | "CONTRADICTS"
  | "SUPPORTS"
  | "FOLLOW_UP";

export type DecisionOverride = {
  id?: string;
  user_id: number;
  override_action: string;
  override_reason?: string | null;
  created_at: string;
  user?: { id: number; name?: string | null; email: string; title?: string | null } | null;
};

export type DecisionLink = {
  id: string;
  relationship_type: DecisionLinkType;
  target_decision_id: string;
  confidence?: number | null;
  related_decision?: Pick<
    Decision,
    "id" | "status" | "summary" | "decision_type" | "created_at"
  > | null;
};

export type DecisionContextSnapshot = {
  signals?: unknown;
  policies?: unknown;
  agent_rationale?: string | null;
  agent_model?: string | null;
};

export type DecisionDetail = Decision & {
  decided_by_user?: { id: number; name: string | null; email: string } | null;
  overrides: DecisionOverride[];
  links: DecisionLink[];
  notes: DecisionNote[];
  context?: DecisionContextSnapshot | null;
};

export type DecisionReviewRequest = {
  action: "approve" | "reject" | "override" | "escalate";
  note?: string;
  final_action?: string;
};

export type DecisionNote = {
  id: string;
  decision_id: string;
  author_id?: number | null;
  author?: { id: number; name: string | null; email: string } | null;
  content: string;
  source_app?: string | null;
  source_url?: string | null;
  created_at: string;
};

export type CreateDecisionNoteRequest = {
  content: string;
  source_app?: string;
  source_url?: string;
};

export type DecisionContext = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  category: string;
  active: boolean;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};

// ============================================================
// CLIENT DECISION TYPES / CONTEXT CATEGORIES
// ============================================================

export type ClientDecisionType = {
  id: string;
  decision_type: string;
  label?: string | null;
  is_reserved: boolean;
  active: boolean;
};

export type ClientContextCategory = {
  id: string;
  category: string;
  label?: string | null;
  is_reserved: boolean;
  active: boolean;
};

// ============================================================
// AI DECISION REPORTS
// ============================================================

export type AiReportStatus = "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";

export type AiDecisionReport = {
  id: string;
  category_id: string;
  title?: string | null;
  status: AiReportStatus;
  content?: string | null;
  agent_model?: string | null;
  created_at: string;
};

// ============================================================
// MEMBERSHIPS
// ============================================================

export type MembershipClient = {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  plan: string;
  active: boolean;
};

export type Membership = {
  id: number;
  role: MembershipRole;
  status: MembershipStatus;
  client: MembershipClient;
};

export type RosterMember = {
  id: number;
  user_id: number;
  client_id: number;
  role: MembershipRole;
  status: MembershipStatus;
  created_at: string;
  updated_at: string;
  user?: { id: number; email: string; name: string | null; image_url?: string | null } | null;
};

// ============================================================
// NOTIFICATIONS
// ============================================================

export type Notification = {
  id: string;
  user_id: number;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
  updated_at: string;
};

// ============================================================
// CLIENT SEARCH
// ============================================================

export type ClientSearchResult = {
  id: number;
  name: string;
  slug?: string;
  plan?: string;
};

// ============================================================
// FETCH HELPERS
// ============================================================

function authHeaders(auth: ApiAuth): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${auth.accessToken}`,
  };
  if (auth.clientId != null) headers["X-Client-Id"] = String(auth.clientId);
  return headers;
}

/** Unwraps the `{ data: T }` envelope some endpoints use, falling back to the raw body. */
function unwrap<T>(body: unknown): T {
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

/**
 * Defensively coerces a list response into an array. The exact envelope for
 * list endpoints isn't fully pinned down by the docs, so this tries a few
 * common shapes (`{ items }`, `{ results }`, bare array) before giving up to
 * an empty list rather than crashing callers that do `.map`/`.filter`.
 */
function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    for (const key of ["items", "results", "data"]) {
      const candidate = (value as Record<string, unknown>)[key];
      if (Array.isArray(candidate)) return candidate as T[];
    }
  }
  return [];
}

/**
 * GET /decisions responds with `{ data: DecisionSummary[], total, page, limit }` —
 * note `total`/`page`/`limit` are siblings of `data`, not nested inside it, so this
 * must run on the raw body rather than after the generic `unwrap()`.
 */
function asPaginated<T>(body: unknown): Paginated<T> {
  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>;
    const items = Array.isArray(obj.data) ? (obj.data as T[]) : [];
    return {
      items,
      page: Number(obj.page) || 1,
      limit: Number(obj.limit) || items.length,
      total: Number(obj.total) || items.length,
    };
  }
  return { items: [], page: 1, limit: 0, total: 0 };
}

async function requestJson(
  path: string,
  auth: ApiAuth,
  options: RequestInit = {}
): Promise<unknown> {
  const res = await fetch(`${env.apiBaseUrl}/api/v1${path}`, {
    ...options,
    headers: { ...authHeaders(auth), ...(options.headers as Record<string, string> ?? {}) },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (body as { message?: string; error?: string } | null)?.message ??
      (body as { message?: string; error?: string } | null)?.error ??
      `API error ${res.status}: ${path}`;
    throw new Error(message);
  }

  return body;
}

async function apiFetch<T>(
  path: string,
  auth: ApiAuth,
  options: RequestInit = {}
): Promise<T> {
  return unwrap<T>(await requestJson(path, auth, options));
}

async function apiFetchArray<T>(
  path: string,
  auth: ApiAuth,
  options: RequestInit = {}
): Promise<T[]> {
  return asArray<T>(unwrap(await requestJson(path, auth, options)));
}

function query(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || value === false) continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// ============================================================
// DECISIONS
// ============================================================

export async function listDecisions(
  params: {
    page?: number;
    limit?: number;
    status?: string;
    decision_type?: string;
    mine?: boolean;
    logged_by?: number;
    decided_by?: number;
  },
  auth: ApiAuth
): Promise<Paginated<Decision>> {
  return asPaginated<Decision>(await requestJson(`/decisions${query(params)}`, auth));
}

export function getDecision(id: string, auth: ApiAuth) {
  return apiFetch<DecisionDetail>(`/decisions/${id}`, auth);
}

export function reviewDecision(
  id: string,
  payload: DecisionReviewRequest,
  auth: ApiAuth
) {
  return apiFetch<DecisionDetail>(`/decisions/${id}/review`, auth, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function addDecisionNote(
  id: string,
  payload: CreateDecisionNoteRequest,
  auth: ApiAuth
) {
  return apiFetch<DecisionNote>(`/decisions/${id}/notes`, auth, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listDecisionContexts(auth: ApiAuth) {
  return apiFetchArray<DecisionContext>("/decisions/contexts", auth);
}

// ============================================================
// CLIENT DECISION TYPES
// ============================================================

export function listDecisionTypes(auth: ApiAuth) {
  return apiFetchArray<ClientDecisionType>("/decisions/types", auth);
}

export function createDecisionType(
  payload: { decision_type: string; label?: string },
  auth: ApiAuth
) {
  return apiFetch<ClientDecisionType>("/decisions/types", auth, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDecisionType(
  typeId: string,
  payload: { decision_type?: string; label?: string; active?: boolean },
  auth: ApiAuth
) {
  return apiFetch<ClientDecisionType>(`/decisions/types/${typeId}`, auth, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteDecisionType(typeId: string, auth: ApiAuth) {
  return apiFetch<void>(`/decisions/types/${typeId}`, auth, { method: "DELETE" });
}

// ============================================================
// CLIENT CONTEXT CATEGORIES
// ============================================================

export function listContextCategories(auth: ApiAuth) {
  return apiFetchArray<ClientContextCategory>("/decisions/context-categories", auth);
}

export function createContextCategory(
  payload: { category: string; label?: string },
  auth: ApiAuth
) {
  return apiFetch<ClientContextCategory>("/decisions/context-categories", auth, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateContextCategory(
  categoryId: string,
  payload: { category?: string; label?: string; active?: boolean },
  auth: ApiAuth
) {
  return apiFetch<ClientContextCategory>(`/decisions/context-categories/${categoryId}`, auth, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteContextCategory(categoryId: string, auth: ApiAuth) {
  return apiFetch<void>(`/decisions/context-categories/${categoryId}`, auth, {
    method: "DELETE",
  });
}

// ============================================================
// AI DECISION REPORTS
// ============================================================

export function listAiReports(
  params: { category_id?: string; status?: string },
  auth: ApiAuth
) {
  return apiFetchArray<AiDecisionReport>(`/ai-reports${query(params)}`, auth);
}

export function generateAiReport(categoryId: string, auth: ApiAuth) {
  return apiFetch<AiDecisionReport>("/ai-reports/generate", auth, {
    method: "POST",
    body: JSON.stringify({ category_id: categoryId }),
  });
}

export function getAiReport(id: string, auth: ApiAuth) {
  return apiFetch<AiDecisionReport>(`/ai-reports/${id}`, auth);
}

// ============================================================
// MEMBERSHIPS
// ============================================================

export function getMyMemberships(auth: ApiAuth) {
  return apiFetchArray<Membership>("/memberships/me", auth);
}

export function getClientRoster(
  clientId: number,
  params: { status?: string },
  auth: ApiAuth
) {
  return apiFetchArray<RosterMember>(`/memberships/client/${clientId}${query(params)}`, auth);
}

export function approveMembership(membershipId: number, auth: ApiAuth) {
  return apiFetch<RosterMember>(`/memberships/${membershipId}/approve`, auth, {
    method: "PATCH",
  });
}

export function rejectMembership(membershipId: number, auth: ApiAuth) {
  return apiFetch<RosterMember>(`/memberships/${membershipId}/reject`, auth, {
    method: "PATCH",
  });
}

export function changeMembershipRole(
  membershipId: number,
  role: MembershipRole,
  auth: ApiAuth
) {
  return apiFetch<RosterMember>(`/memberships/${membershipId}/role`, auth, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function removeMembership(membershipId: number, auth: ApiAuth) {
  return apiFetch<void>(`/memberships/${membershipId}`, auth, { method: "DELETE" });
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export function listNotifications(auth: ApiAuth) {
  return apiFetchArray<Notification>("/notifications", auth);
}

export function markNotificationRead(id: string, auth: ApiAuth) {
  return apiFetch<Notification>(`/notifications/${id}/read`, auth, { method: "PATCH" });
}

export function markAllNotificationsRead(auth: ApiAuth) {
  return apiFetch<void>("/notifications/read-all", auth, { method: "PATCH" });
}

// ============================================================
// CLIENTS
// ============================================================

export function searchClients(name: string, auth: ApiAuth) {
  return apiFetchArray<ClientSearchResult>(
    `/clients/search${query({ name, page: 1, limit: 10 })}`,
    auth
  );
}
