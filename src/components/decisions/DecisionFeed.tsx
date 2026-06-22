"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  listDecisions,
  listDecisionTypes,
  type ClientDecisionType,
  type Decision,
  type DecisionStatus,
} from "@/lib/api";

const STATUS_OPTIONS: DecisionStatus[] = [
  "PROPOSED",
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
  "OVERRIDDEN",
  "EXPIRED",
  "ESCALATED",
];

const STATUS_VARIANT: Record<DecisionStatus, BadgeProps["variant"]> = {
  PROPOSED: "haze",
  PENDING_REVIEW: "haze",
  APPROVED: "mint",
  REJECTED: "ember",
  OVERRIDDEN: "ember",
  EXPIRED: "ink",
  ESCALATED: "ember",
};

const URGENCY_VARIANT: Record<string, BadgeProps["variant"]> = {
  LOW: "haze",
  NORMAL: "haze",
  HIGH: "ember",
  CRITICAL: "ember",
};

const PAGE_SIZE = 20;

export function DecisionFeed() {
  const { session, activeMembership } = useAuth();
  const accessToken = session?.access_token;
  const clientId = activeMembership?.client.id;
  const role = activeMembership?.role;
  const isStaff = role === "VIEWER" || role === "APPROVER";

  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [decisionType, setDecisionType] = useState<string>("");
  const [types, setTypes] = useState<ClientDecisionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !clientId) return;
    listDecisionTypes({ accessToken, clientId })
      .then(setTypes)
      .catch(() => setTypes([]));
  }, [accessToken, clientId]);

  const loadDecisions = useCallback(async () => {
    if (!accessToken || !clientId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await listDecisions(
        {
          page,
          limit: PAGE_SIZE,
          status: status || undefined,
          decision_type: decisionType || undefined,
          mine: isStaff,
        },
        { accessToken, clientId }
      );
      setDecisions(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load decisions");
    } finally {
      setLoading(false);
    }
  }, [accessToken, clientId, page, status, decisionType, isStaff]);

  useEffect(() => {
    loadDecisions();
  }, [loadDecisions]);

  if (!clientId) {
    return (
      <Card className="p-6">
        <p className="text-sm text-ink-300">Setting up your workspace…</p>
      </Card>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {isStaff && (
        <p className="text-sm text-ink-300">Showing decisions you logged.</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={status || "all"}
          onValueChange={(v) => {
            setStatus(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={decisionType || "all"}
          onValueChange={(v) => {
            setDecisionType(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {types.map((t) => (
              <SelectItem key={t.id} value={t.decision_type}>
                {t.label ?? t.decision_type.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-2xl bg-ember-50 px-4 py-3 text-sm text-ember-600">
          {error}
        </div>
      )}

      {loading ? (
        <Card className="p-6">
          <p className="text-sm text-ink-300">Loading decisions…</p>
        </Card>
      ) : decisions.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-ink-300">No decisions match these filters.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {decisions.map((decision) => (
            <Link key={decision.id} href={`/decisions/${decision.id}`}>
              <Card className="p-6 transition hover:shadow-panel">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-300">
                      {decision.decision_type.replace(/_/g, " ")}
                    </p>
                    <h3 className="text-lg font-semibold text-ink-900">
                      {decision.summary ?? "Untitled decision"}
                    </h3>
                    <p className="text-sm text-ink-300">
                      {decision.subject_company?.name ?? "No subject"}
                      {decision.subject_company?.domain
                        ? ` · ${decision.subject_company.domain}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={URGENCY_VARIANT[decision.urgency] ?? "haze"}>
                      {decision.urgency}
                    </Badge>
                    <Badge variant={STATUS_VARIANT[decision.status] ?? "haze"}>
                      {decision.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 border-t border-haze-100 pt-4 text-xs text-ink-300">
                  <span>Created {new Date(decision.created_at).toLocaleString()}</span>
                  {decision.decided_at && (
                    <span>Decided {new Date(decision.decided_at).toLocaleString()}</span>
                  )}
                  {!isStaff && decision.logged_by_user?.name && (
                    <span>Logged by {decision.logged_by_user.name}</span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <p className="text-sm text-ink-300">
            Page {page} of {totalPages}
          </p>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
