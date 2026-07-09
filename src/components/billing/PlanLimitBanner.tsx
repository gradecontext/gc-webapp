"use client";

import Link from "next/link";
import { ApiError } from "@/lib/api";

interface PlanLimitBannerProps {
  error: unknown;
  onDismiss?: () => void;
}

export function PlanLimitBanner({ error, onDismiss }: PlanLimitBannerProps) {
  if (!(error instanceof ApiError) || error.status !== 402) return null;
  const body = error.body as { message?: string } | null;
  const message = body?.message ?? error.message;

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-ember-400/30 bg-ember-400/10 px-4 py-3 text-sm text-ember-600">
      <span>{message}</span>
      <div className="flex shrink-0 items-center gap-3">
        <Link
          href="/settings/billing"
          className="font-semibold underline underline-offset-2 hover:text-ember-500"
        >
          Upgrade plan
        </Link>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-ember-400 hover:text-ember-600"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
