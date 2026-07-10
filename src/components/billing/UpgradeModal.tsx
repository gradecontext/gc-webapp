"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  createCheckoutSession,
  type ApiAuth,
  type BillingCycle,
  type PlanCatalogEntry,
  type PlanTier,
} from "@/lib/api";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: PlanCatalogEntry[];
  auth: ApiAuth;
}

const UPGRADEABLE_PLANS: PlanTier[] = ["GROWTH", "SCALE"];

const PLAN_LABEL: Record<string, string> = {
  FREE: "Free",
  GROWTH: "Growth",
  SCALE: "Scale",
  ENTERPRISE: "Enterprise",
};

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function formatSeatPrice(dollars: number): string {
  return `$${dollars}/seat/mo`;
}

export function UpgradeModal({ open, onOpenChange, plans, auth }: UpgradeModalProps) {
  const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upgradeableCatalog = plans.filter((p) =>
    UPGRADEABLE_PLANS.includes(p.plan)
  );

  async function handleCheckout() {
    if (!selectedPlan) return;
    setLoading(true);
    setError(null);
    try {
      const successUrl = `${window.location.origin}/settings/billing?checkout=success`;
      const cancelUrl = `${window.location.origin}/settings/billing`;
      const { url } = await createCheckoutSession(
        { plan: selectedPlan, billing_cycle: cycle, success_url: successUrl, cancel_url: cancelUrl },
        auth
      );
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upgrade your plan</DialogTitle>
          <DialogDescription>
            Choose a plan that fits your team. Upgrade takes effect immediately via Stripe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
        {/* Billing cycle toggle */}
        <div className="flex items-center gap-1 self-start rounded-full border border-haze-200 bg-haze-50 p-1">
          {(["MONTHLY", "ANNUAL"] as BillingCycle[]).map((c) => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                cycle === c
                  ? "bg-ink-900 text-white"
                  : "text-ink-300 hover:text-ink-700"
              }`}
            >
              {c === "MONTHLY" ? "Monthly" : "Annual (2 mo free)"}
            </button>
          ))}
        </div>

        {/* Plan cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {upgradeableCatalog.map((plan) => {
            const price =
              cycle === "MONTHLY"
                ? plan.pricePerSeatMonthly
                : plan.pricePerSeatAnnual / 12;
            const minCharge =
              cycle === "MONTHLY"
                ? plan.minimumMonthlyCharge
                : Math.round((plan.minimumMonthlyCharge * plan.minSeats * plan.pricePerSeatAnnual) /
                    (plan.minSeats * plan.pricePerSeatMonthly));
            const isSelected = selectedPlan === plan.plan;

            return (
              <button
                key={plan.plan}
                onClick={() => setSelectedPlan(plan.plan)}
                className={`flex flex-col gap-3 rounded-2xl border-2 p-5 text-left transition-all ${
                  isSelected
                    ? "border-accent-400 bg-accent-50"
                    : "border-haze-200 bg-white hover:border-haze-400"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-semibold text-ink-900">
                      {PLAN_LABEL[plan.plan]}
                    </p>
                    <p className="text-xs text-ink-300">
                      {plan.minSeats}–{plan.maxSeats ?? "∞"} seats
                    </p>
                  </div>
                  {isSelected && (
                    <span className="rounded-full bg-accent-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Selected
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-2xl font-bold text-ink-900">
                    {formatSeatPrice(price)}
                  </p>
                  {plan.minimumMonthlyCharge > 0 && (
                    <p className="text-xs text-ink-300">
                      min {formatUsd(minCharge * 100)}/mo ({plan.minSeats} seats)
                    </p>
                  )}
                </div>

                <ul className="space-y-1 text-xs text-ink-300">
                  <li>
                    AI Reports:{" "}
                    <span className="text-ink-700">
                      {plan.features.AI_REPORTS === true ? "Unlimited" : String(plan.features.AI_REPORTS)}
                    </span>
                  </li>
                  <li>
                    Custom Types:{" "}
                    <span className="text-ink-700">
                      {plan.features.CUSTOM_TYPES === true ? "Unlimited" : String(plan.features.CUSTOM_TYPES)}
                    </span>
                  </li>
                  <li>
                    Decision Export:{" "}
                    <span className={plan.features.DECISION_EXPORT ? "text-mint-600" : "text-ink-300"}>
                      {plan.features.DECISION_EXPORT ? "✓" : "✗"}
                    </span>
                  </li>
                  <li>
                    API Access:{" "}
                    <span className={plan.features.API_ACCESS ? "text-mint-600" : "text-ink-300"}>
                      {plan.features.API_ACCESS ? "✓" : "✗"}
                    </span>
                  </li>
                  {plan.features.AUDIT_LOG && (
                    <li>
                      Audit Log: <span className="text-mint-600">✓</span>
                    </li>
                  )}
                  {plan.features.SSO && (
                    <li>
                      SSO: <span className="text-mint-600">✓</span>
                    </li>
                  )}
                </ul>
              </button>
            );
          })}
        </div>
        </div>

        {error && (
          <p className="text-sm text-ember-600">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCheckout} disabled={!selectedPlan || loading}>
            {loading ? "Redirecting…" : selectedPlan ? `Upgrade to ${PLAN_LABEL[selectedPlan]}` : "Select a plan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
