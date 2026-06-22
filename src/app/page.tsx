"use client";

import { useAuth } from "@/providers/AuthProvider";
import { LandingPage } from "@/components/landing/LandingPage";
import { AppShell } from "@/components/layout/AppShell";
import { DecisionFeed } from "@/components/decisions/DecisionFeed";

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-haze-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-400 border-t-transparent" />
          <p className="text-sm text-ink-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <p className="section-title">Decision feed</p>
          <h1 className="text-2xl font-semibold text-ink-900 md:text-3xl">
            Why your team decided what it decided.
          </h1>
          <p className="text-sm text-ink-300">
            Every decision here is immutable once finalized — overrides and reviews are new
            records layered on top, not edits.
          </p>
        </div>
        <DecisionFeed />
      </div>
    </AppShell>
  );
}
