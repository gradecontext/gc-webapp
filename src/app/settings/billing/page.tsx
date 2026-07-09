"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/providers/AuthProvider";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import {
  cancelBilling,
  getBilling,
  getBillingPortal,
  getPlans,
  reactivateBilling,
  type BillingSubscription,
  type PlanCatalogEntry,
  type PlanTier,
  type SubStatus,
} from "@/lib/api";

const PLAN_LABEL: Record<PlanTier, string> = {
  FREE: "Free",
  GROWTH: "Growth",
  SCALE: "Scale",
  ENTERPRISE: "Enterprise",
};

const STATUS_VARIANT: Record<SubStatus, BadgeProps["variant"]> = {
  ACTIVE: "mint",
  TRIALING: "haze",
  PAST_DUE: "ember",
  CANCELED: "ink",
  INCOMPLETE: "haze",
};

function FeatureValue({ value }: { value: boolean | number }) {
  if (value === true) return <span className="text-mint-600">Unlimited</span>;
  if (value === false) return <span className="text-ink-300">Not included</span>;
  return <span className="text-ink-700">{String(value)} / month</span>;
}

function SeatBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const danger = pct >= 90;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-ink-300">
        <span>{used} of {limit} seats used</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-haze-200">
        <div
          className={`h-full rounded-full transition-all ${danger ? "bg-ember-500" : "bg-accent-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function BillingPage() {
  const { session, activeMembership } = useAuth();
  const accessToken = session?.access_token;
  const clientId = activeMembership?.client.id;
  const isAdmin = activeMembership?.role === "ADMIN";

  const auth = accessToken && clientId ? { accessToken, clientId } : null;

  const [sub, setSub] = useState<BillingSubscription | null>(null);
  const [plans, setPlans] = useState<PlanCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const load = useCallback(async () => {
    if (!auth) return;
    setLoading(true);
    setError(null);
    try {
      const [s, p] = await Promise.all([getBilling(auth), getPlans(auth)]);
      setSub(s);
      setPlans(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load billing");
    } finally {
      setLoading(false);
    }
  }, [auth?.accessToken, auth?.clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("checkout") === "success") {
        setCheckoutSuccess(true);
        window.history.replaceState({}, "", "/settings/billing");
      }
    }
  }, []);

  async function handlePortal() {
    if (!auth) return;
    setActionBusy(true);
    setActionError(null);
    try {
      const { url } = await getBillingPortal(window.location.href, auth);
      window.location.href = url;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to open billing portal");
      setActionBusy(false);
    }
  }

  async function handleCancel() {
    if (!auth) return;
    setActionBusy(true);
    setActionError(null);
    try {
      await cancelBilling(auth);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleReactivate() {
    if (!auth) return;
    setActionBusy(true);
    setActionError(null);
    try {
      await reactivateBilling(auth);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to reactivate");
    } finally {
      setActionBusy(false);
    }
  }

  const canUpgrade =
    sub && sub.plan !== "ENTERPRISE" && sub.plan !== "SCALE" && sub.status !== "CANCELED";
  const canManagePortal = sub?.stripeCustomerId != null;
  const canCancel =
    sub &&
    sub.status === "ACTIVE" &&
    !sub.cancelAtPeriodEnd &&
    sub.plan !== "FREE";

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <p className="section-title">Settings</p>
          <h1 className="text-3xl font-semibold text-ink-900">Billing & plan</h1>
          <p className="text-sm text-ink-300">
            Seat-based subscription billing. Plan changes take effect immediately via Stripe.
          </p>
        </div>

        {!isAdmin ? (
          <Card className="p-6">
            <p className="text-sm text-ink-300">Only admins can manage billing.</p>
          </Card>
        ) : loading ? (
          <Card className="p-6">
            <p className="text-sm text-ink-300">Loading…</p>
          </Card>
        ) : error ? (
          <Card className="p-6">
            <p className="text-sm text-ember-600">{error}</p>
          </Card>
        ) : sub ? (
          <div className="space-y-6">
            {checkoutSuccess && (
              <div className="rounded-2xl border border-mint-400/30 bg-mint-400/10 px-4 py-3 text-sm text-mint-600">
                Your plan has been upgraded. Welcome to {PLAN_LABEL[sub.plan]}!
              </div>
            )}

            {sub.cancelAtPeriodEnd && sub.currentPeriodEnd && (
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-ember-400/30 bg-ember-400/10 px-4 py-3 text-sm text-ember-600">
                <span>
                  Your plan will cancel on{" "}
                  {new Date(sub.currentPeriodEnd).toLocaleDateString()}. You can still
                  use all features until then.
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={actionBusy}
                  onClick={handleReactivate}
                >
                  Reactivate
                </Button>
              </div>
            )}

            {/* Current plan card */}
            <Card className="p-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-ink-900">
                      {PLAN_LABEL[sub.plan]}
                    </h2>
                    <Badge variant={STATUS_VARIANT[sub.status]}>{sub.status}</Badge>
                    {sub.billingCycle && sub.plan !== "FREE" && (
                      <Badge variant="haze">{sub.billingCycle}</Badge>
                    )}
                  </div>

                  {sub.currentPeriodEnd && !sub.cancelAtPeriodEnd && (
                    <p className="text-xs text-ink-300">
                      Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  )}

                  {sub.trialEndsAt && (
                    <p className="text-xs text-ink-300">
                      Trial ends {new Date(sub.trialEndsAt).toLocaleDateString()}
                    </p>
                  )}

                  <SeatBar used={sub.seatCount} limit={sub.seatLimit} />
                </div>

                <div className="flex flex-wrap gap-2">
                  {canUpgrade && (
                    <Button onClick={() => setUpgradeOpen(true)} disabled={actionBusy}>
                      Upgrade plan
                    </Button>
                  )}
                  {canManagePortal && (
                    <Button
                      variant="secondary"
                      disabled={actionBusy}
                      onClick={handlePortal}
                    >
                      Manage billing
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      variant="secondary"
                      disabled={actionBusy}
                      onClick={handleCancel}
                    >
                      Cancel plan
                    </Button>
                  )}
                </div>
              </div>

              {actionError && (
                <p className="mt-3 text-sm text-ember-600">{actionError}</p>
              )}
            </Card>

            {/* Feature overview */}
            <Card className="p-6">
              <p className="section-title mb-4">Features included</p>
              <div className="divide-y divide-haze-100">
                {[
                  { key: "AI_REPORTS", label: "AI Decision Reports" },
                  { key: "CUSTOM_TYPES", label: "Custom decision types" },
                  { key: "DECISION_EXPORT", label: "Decision export" },
                  { key: "API_ACCESS", label: "API access" },
                  { key: "AUDIT_LOG", label: "Audit log" },
                  { key: "SSO", label: "SSO" },
                ].map(({ key, label }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-3 text-sm"
                  >
                    <span className="text-ink-700">{label}</span>
                    <FeatureValue
                      value={sub.features[key as keyof typeof sub.features]}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : null}
      </div>

      {auth && (
        <UpgradeModal
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          plans={plans}
          auth={auth}
        />
      )}
    </AppShell>
  );
}
