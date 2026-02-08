import { env } from "@/lib/env";

export type DecisionRequest = {
  tenant_id: string;
  subject_company: {
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
  decision_type: string;
  context_key?: string;
};

export type DecisionReviewRequest = {
  action: "approve" | "reject" | "override" | "escalate";
  note?: string;
  final_action?: string;
};

export async function createDecision(
  payload: DecisionRequest,
  apiKey?: string
) {
  const response = await fetch(`${env.apiBaseUrl}/api/v1/decisions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "X-API-Key": apiKey } : {})
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Failed to create decision");
  }

  return response.json();
}

export async function fetchDecision(id: string, apiKey?: string) {
  const response = await fetch(`${env.apiBaseUrl}/api/v1/decisions/${id}`, {
    headers: {
      ...(apiKey ? { "X-API-Key": apiKey } : {})
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch decision");
  }

  return response.json();
}

export async function reviewDecision(
  id: string,
  payload: DecisionReviewRequest,
  apiKey?: string
) {
  const response = await fetch(`${env.apiBaseUrl}/api/v1/decisions/${id}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "X-API-Key": apiKey } : {})
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Failed to review decision");
  }

  return response.json();
}
