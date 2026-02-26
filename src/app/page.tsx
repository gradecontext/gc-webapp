"use client";

import { useAuth } from "@/providers/AuthProvider";
import { LandingPage } from "@/components/landing/LandingPage";
import { AppShell } from "@/components/layout/AppShell";
import { DecisionQueue } from "@/components/decisions/DecisionQueue";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
        {/* Hero section */}
        <div className="flex flex-col gap-6 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-panel md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Badge variant="mint" className="badge">
              Live decisions
            </Badge>
            <h1 className="text-2xl font-semibold text-ink-900 md:text-3xl">
              Decision intelligence for onboarding, pricing, and trust.
            </h1>
            <p className="text-sm text-ink-300">
              You are in the execution path. Every decision is audited, replayable, and human-verified.
            </p>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Execution path",
              value: "98%",
              note: "Decisions processed within SLA"
            },
            {
              title: "Overrides",
              value: "14",
              note: "Human judgment captured this week"
            },
            {
              title: "Precedent reuse",
              value: "42%",
              note: "Decisions referencing prior cases"
            }
          ].map((stat) => (
            <Card key={stat.title} className="stat-card">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-300">
                {stat.title}
              </p>
              <p className="mt-4 text-3xl font-semibold text-ink-900">{stat.value}</p>
              <p className="mt-2 text-sm text-ink-300">{stat.note}</p>
            </Card>
          ))}
        </section>
        <DecisionQueue />
      </div>
    </AppShell>
  );
}
