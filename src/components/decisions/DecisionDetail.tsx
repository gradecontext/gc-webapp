"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  addDecisionNote,
  getDecision,
  reviewDecision,
  type DecisionDetail as DecisionDetailType,
  type DecisionLinkType,
  type DecisionNote,
  type DecisionStatus,
} from "@/lib/api";

const STATUS_VARIANT: Record<DecisionStatus, BadgeProps["variant"]> = {
  PROPOSED: "haze",
  PENDING_REVIEW: "haze",
  APPROVED: "mint",
  REJECTED: "ember",
  OVERRIDDEN: "ember",
  EXPIRED: "ink",
  ESCALATED: "ember",
};

const LINK_TYPE_LABEL: Record<DecisionLinkType, string> = {
  PRECEDENT: "Precedent",
  SIMILAR_CASE: "Similar case",
  POLICY_EXCEPTION: "Policy exception",
  FOLLOW_UP: "Follow-up",
  CONTRADICTS: "Contradicts",
  SUPPORTS: "Supports",
};

export function DecisionDetail({ id }: { id: string }) {
  const { session, activeMembership } = useAuth();
  const accessToken = session?.access_token;
  const clientId = activeMembership?.client.id;
  const role = activeMembership?.role;
  // Only team-role management, subject companies, decision types, and context
  // categories are admin-only under the ADMIN/STAFF model — review actions are not.
  const canReview = role === "ADMIN" || role === "STAFF";

  const [decision, setDecision] = useState<DecisionDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [notes, setNotes] = useState<DecisionNote[]>([]);
  const [noteContent, setNoteContent] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  const [reviewNote, setReviewNote] = useState("");
  const [finalAction, setFinalAction] = useState("");
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || !clientId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getDecision(id, { accessToken, clientId });
      setDecision(result);
      setNotes(result.notes ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load decision");
    } finally {
      setLoading(false);
    }
  }, [accessToken, clientId, id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !clientId || !noteContent.trim()) return;
    setNoteSubmitting(true);
    setNoteError(null);
    try {
      const note = await addDecisionNote(
        id,
        { content: noteContent.trim() },
        { accessToken, clientId }
      );
      setNotes((prev) => [...prev, note]);
      setNoteContent("");
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : "Failed to add note");
    } finally {
      setNoteSubmitting(false);
    }
  }

  async function handleReview(action: "approve" | "reject" | "override" | "escalate") {
    if (!accessToken || !clientId) return;
    setReviewing(action);
    setReviewError(null);
    try {
      const updated = await reviewDecision(
        id,
        {
          action,
          note: reviewNote.trim() || undefined,
          final_action: action === "override" ? finalAction.trim() || undefined : undefined,
        },
        { accessToken, clientId }
      );
      setDecision(updated);
      setNotes(updated.notes ?? []);
      setReviewNote("");
      setFinalAction("");
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Review action failed");
    } finally {
      setReviewing(null);
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-ink-300">Loading decision…</p>
      </Card>
    );
  }

  if (error || !decision) {
    return (
      <Card className="p-6">
        <p className="text-sm text-ember-600">{error ?? "Decision not found."}</p>
      </Card>
    );
  }

  const linksByType = decision.links.reduce<Record<string, typeof decision.links>>(
    (acc, link) => {
      (acc[link.relationship_type] ??= []).push(link);
      return acc;
    },
    {}
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-300">
                {decision.decision_type.replace(/_/g, " ")}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-ink-900">
                {decision.summary ?? "Untitled decision"}
              </h2>
              <p className="text-sm text-ink-300">
                {decision.subject_company?.name ?? "No subject"}
                {decision.subject_company?.domain ? ` · ${decision.subject_company.domain}` : ""}
                {decision.subject_company?.country ? ` · ${decision.subject_company.country}` : ""}
              </p>
              {decision.logged_by_user?.name && (
                <p className="mt-1 text-xs text-ink-300">
                  Logged by {decision.logged_by_user.name}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={STATUS_VARIANT[decision.status] ?? "haze"}>
                {decision.status.replace(/_/g, " ")}
              </Badge>
              <Badge variant="haze">{decision.urgency}</Badge>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-haze-100 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-300">Category</p>
              <p className="text-sm font-semibold text-ink-900">
                {decision.context_category?.replace(/_/g, " ") ?? "—"}
              </p>
            </div>
            <div className="rounded-2xl bg-haze-100 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-300">Decided by</p>
              <p className="text-sm font-semibold text-ink-900">
                {decision.decided_by_user?.name ?? decision.decided_by_user?.email ?? "—"}
              </p>
            </div>
            <div className="rounded-2xl bg-haze-100 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-300">Decided at</p>
              <p className="text-sm font-semibold text-ink-900">
                {decision.decided_at ? new Date(decision.decided_at).toLocaleString() : "—"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <p className="section-title">Notes</p>
          {notes.length === 0 ? (
            <p className="mt-4 text-sm text-ink-300">No notes yet — the &quot;why&quot; behind this decision.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="rounded-2xl border border-haze-200 bg-white px-4 py-3">
                  <p className="text-sm text-ink-700">{note.content}</p>
                  <p className="mt-1 text-xs text-ink-300">
                    {note.author?.name ?? note.author?.email ?? "Unknown"} ·{" "}
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddNote} className="mt-4 space-y-3">
            <Textarea
              placeholder="Why was this decided? Add the rationale."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
            />
            {noteError && <p className="text-xs text-ember-500">{noteError}</p>}
            <Button type="submit" size="sm" disabled={noteSubmitting || !noteContent.trim()}>
              {noteSubmitting ? "Adding…" : "Add note"}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <p className="section-title">Context</p>
          {decision.context ? (
            <div className="mt-4 space-y-4">
              {decision.context.agent_model && (
                <Badge variant="mint">AI Insights · {decision.context.agent_model}</Badge>
              )}
              {decision.context.agent_rationale && (
                <p className="text-sm text-ink-700">{decision.context.agent_rationale}</p>
              )}
              {Boolean(decision.context.signals) && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-300">
                    Signals
                  </p>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-ink-700">
                    {JSON.stringify(decision.context.signals, null, 2)}
                  </pre>
                </div>
              )}
              {Boolean(decision.context.policies) && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-300">
                    Policies
                  </p>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-ink-700">
                    {JSON.stringify(decision.context.policies, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-300">
              No retroactive analysis snapshot yet for this decision.
            </p>
          )}
        </Card>

        <Card className="p-6">
          <p className="section-title">Overrides</p>
          {decision.overrides.length === 0 ? (
            <p className="mt-4 text-sm text-ink-300">No overrides recorded.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {decision.overrides.map((override) => (
                <div
                  key={override.id ?? `${override.user_id}-${override.created_at}`}
                  className="rounded-2xl border border-haze-200 bg-white px-4 py-3"
                >
                  <p className="text-sm font-semibold text-ink-900">
                    {override.override_action} ·{" "}
                    {override.user?.name ?? override.user?.email ?? "Unknown"}
                  </p>
                  <p className="text-xs text-ink-300">
                    {new Date(override.created_at).toLocaleString()}
                  </p>
                  {override.override_reason && (
                    <p className="mt-1 text-sm text-ink-700">{override.override_reason}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <p className="section-title">Context graph links</p>
          {Object.keys(linksByType).length === 0 ? (
            <p className="mt-4 text-sm text-ink-300">No linked decisions yet.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {Object.entries(linksByType).map(([type, links]) => (
                <div key={type}>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-300">
                    {LINK_TYPE_LABEL[type as DecisionLinkType] ?? type}
                  </p>
                  <div className="mt-2 space-y-2">
                    {links.map((link) => (
                      <div key={link.id} className="rounded-2xl border border-haze-200 bg-white px-4 py-3">
                        <p className="text-sm font-semibold text-ink-900">
                          {link.related_decision?.summary ?? link.target_decision_id}
                        </p>
                        {link.related_decision?.decision_type && (
                          <p className="text-xs text-ink-300">
                            {link.related_decision.decision_type.replace(/_/g, " ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-6">
        {canReview && (
          <Card className="p-6">
            <p className="section-title">Decision controls</p>
            <div className="mt-4 space-y-3">
              <Textarea
                placeholder="Note for this review action (optional)"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
              />
              <Input
                placeholder="Final action (override only)"
                value={finalAction}
                onChange={(e) => setFinalAction(e.target.value)}
              />
              {reviewError && <p className="text-xs text-ember-500">{reviewError}</p>}
              <div className="grid gap-2">
                <Button disabled={reviewing !== null} onClick={() => handleReview("approve")}>
                  {reviewing === "approve" ? "Approving…" : "Approve"}
                </Button>
                <Button
                  variant="secondary"
                  disabled={reviewing !== null}
                  onClick={() => handleReview("reject")}
                >
                  {reviewing === "reject" ? "Rejecting…" : "Reject"}
                </Button>
                <Button
                  variant="secondary"
                  disabled={reviewing !== null}
                  onClick={() => handleReview("override")}
                >
                  {reviewing === "override" ? "Overriding…" : "Override"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={reviewing !== null}
                  onClick={() => handleReview("escalate")}
                >
                  {reviewing === "escalate" ? "Escalating…" : "Escalate"}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
