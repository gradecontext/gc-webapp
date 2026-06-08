import { env } from "@/lib/env";

// ============================================================
// CORE ENUMS (mirror backend Prisma enums)
// ============================================================

export type DecisionType =
  | "DISCOUNT"
  | "ONBOARDING"
  | "PAYMENT_TERMS"
  | "CREDIT_EXTENSION"
  | "PARTNERSHIP"
  | "RENEWAL"
  | "ESCALATION"
  | "CUSTOM";

export type DecisionStatus =
  | "PROPOSED"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "OVERRIDDEN"
  | "EXPIRED"
  | "ESCALATED";

export type DecisionConfidence = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export type DecisionUrgency = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export type OutcomeType =
  | "PAID_ON_TIME"
  | "PAID_LATE"
  | "CHURNED"
  | "FRAUD"
  | "EXPANDED"
  | "DOWNGRADED"
  | "DEFAULTED"
  | "POSITIVE"
  | "NEGATIVE"
  | "NEUTRAL";

// ============================================================
// DECISION TYPES
// ============================================================

export type DecisionRequest = {
  client_id: number;
  subject_company?: {                    // Optional — non-company decisions don't need this
    external_id: string;
    name: string;
    domain?: string;
    industry?: string;
    country?: string;
    metadata?: Record<string, unknown>;
  };
  deal?: {
    crm_deal_id?: string;
    amount?: number;
    currency?: string;
    discount_requested?: number;
  };
  decision_type: DecisionType;
  context_key?: string;
  summary?: string;
  urgency?: DecisionUrgency;
};

export type DecisionReviewRequest = {
  action: "approve" | "reject" | "override" | "escalate";
  note?: string;
  final_action?: string;
};

// ============================================================
// BROWSER EXTENSION LAYER TYPES
// ============================================================

export type SourceApplication = {
  id: string;                            // UUID
  clientId: number;
  name: string;
  slug: string;
  domainPattern?: string | null;
  active: boolean;
  settings?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type ObservedEvent = {
  id: string;                            // UUID
  clientId: number;
  sourceApp: string;                     // e.g. "salesforce", "jira"
  sourceApplicationId?: string | null;   // UUID → source_applications
  eventType: string;                     // e.g. "discount_changed", "ticket_closed"
  sourceUrl?: string | null;
  externalEntityId?: string | null;      // entity ID in the external system
  title?: string | null;
  description?: string | null;
  occurredByUserId?: number | null;
  rawPayload?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  convertedToDecisionId?: string | null; // UUID — set when promoted to a Decision
  occurredAt: string;                    // ISO timestamp
  createdAt: string;
};

export type CreateObservedEventRequest = {
  client_id: number;
  source_app: string;
  source_application_id?: string;
  event_type: string;
  source_url?: string;
  external_entity_id?: string;
  title?: string;
  description?: string;
  occurred_by_user_id?: number;
  raw_payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  occurred_at: string;
};

export type DecisionNote = {
  id: string;                            // UUID
  decisionId: string;                    // UUID
  authorId?: number | null;
  content: string;
  sourceApp?: string | null;
  sourceUrl?: string | null;
  createdAt: string;
};

export type CreateDecisionNoteRequest = {
  content: string;
  source_app?: string;
  source_url?: string;
};

export type DecisionEntity = {
  id: string;                            // UUID
  decisionId: string;                    // UUID
  entityType: string;                    // e.g. "jira_ticket", "figma_file", "github_pr"
  entityId: string;                      // external system ID
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

export type CreateDecisionEntityRequest = {
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, unknown>;
};

// ============================================================
// API HELPERS
// ============================================================

function authHeaders(apiKey?: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(apiKey ? { "X-API-Key": apiKey } : {}),
  };
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  apiKey?: string
): Promise<T> {
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    headers: { ...authHeaders(apiKey), ...(options.headers as Record<string, string> ?? {}) },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

// ============================================================
// DECISIONS
// ============================================================

export function createDecision(payload: DecisionRequest, apiKey?: string) {
  return apiFetch<unknown>("/api/v1/decisions", {
    method: "POST",
    body: JSON.stringify(payload),
  }, apiKey);
}

export function fetchDecision(id: string, apiKey?: string) {
  return apiFetch<unknown>(`/api/v1/decisions/${id}`, {}, apiKey);
}

export function reviewDecision(
  id: string,
  payload: DecisionReviewRequest,
  apiKey?: string
) {
  return apiFetch<unknown>(`/api/v1/decisions/${id}/review`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, apiKey);
}

// ============================================================
// DECISION NOTES
// ============================================================

export function createDecisionNote(
  decisionId: string,
  payload: CreateDecisionNoteRequest,
  apiKey?: string
) {
  return apiFetch<DecisionNote>(`/api/v1/decisions/${decisionId}/notes`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, apiKey);
}

export function fetchDecisionNotes(decisionId: string, apiKey?: string) {
  return apiFetch<DecisionNote[]>(`/api/v1/decisions/${decisionId}/notes`, {}, apiKey);
}

// ============================================================
// DECISION ENTITIES
// ============================================================

export function createDecisionEntity(
  decisionId: string,
  payload: CreateDecisionEntityRequest,
  apiKey?: string
) {
  return apiFetch<DecisionEntity>(`/api/v1/decisions/${decisionId}/entities`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, apiKey);
}

// ============================================================
// OBSERVED EVENTS
// ============================================================

export function createObservedEvent(
  payload: CreateObservedEventRequest,
  apiKey?: string
) {
  return apiFetch<ObservedEvent>("/api/v1/observed-events", {
    method: "POST",
    body: JSON.stringify(payload),
  }, apiKey);
}

export function promoteObservedEvent(
  eventId: string,
  decisionPayload: Partial<DecisionRequest>,
  apiKey?: string
) {
  return apiFetch<unknown>(`/api/v1/observed-events/${eventId}/promote`, {
    method: "POST",
    body: JSON.stringify(decisionPayload),
  }, apiKey);
}

// ============================================================
// SOURCE APPLICATIONS
// ============================================================

export function fetchSourceApplications(clientId: number, apiKey?: string) {
  return apiFetch<SourceApplication[]>(
    `/api/v1/clients/${clientId}/source-applications`,
    {},
    apiKey
  );
}

export function createSourceApplication(
  clientId: number,
  payload: Pick<SourceApplication, "name" | "slug" | "domainPattern" | "settings">,
  apiKey?: string
) {
  return apiFetch<SourceApplication>(
    `/api/v1/clients/${clientId}/source-applications`,
    { method: "POST", body: JSON.stringify(payload) },
    apiKey
  );
}
