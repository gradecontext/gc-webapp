import Link from "next/link";
import { decisionQueue } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DecisionQueue() {
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-ink-900">Decision queue</h2>
        <div className="grid gap-4">
          {decisionQueue.map((decision) => (
            <Card key={decision.id} className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-300">
                    {decision.decisionType}
                  </p>
                  <h3 className="text-xl font-semibold text-ink-900">{decision.company}</h3>
                  <p className="text-sm text-ink-300">{decision.domain} · {decision.country}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="mint" className="badge">{decision.recommendation}</Badge>
                  <Badge variant="haze" className="badge">{decision.confidence} confidence</Badge>
                </div>
              </div>
              <div className="mt-6 grid gap-4 border-t border-haze-100 pt-6 md:grid-cols-3">
                {decision.signals.map((signal) => (
                  <div key={signal.label} className="rounded-2xl bg-haze-100 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-ink-300">{signal.label}</p>
                    <p className="text-sm font-semibold text-ink-900">{signal.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2 text-sm text-ink-300">
                  <span>Suggested conditions:</span>
                  {decision.suggestedConditions.map((condition) => (
                    <span key={condition} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-700">
                      {condition}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">Reject</Button>
                  <Link href={`/decisions/${decision.id}`} className="inline-flex">
                    <Button size="sm">Review</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <Card className="flex h-full flex-col justify-between p-6">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-300">Live posture</p>
          <h3 className="text-xl font-semibold text-ink-900">Execution path health</h3>
          <p className="text-sm text-ink-300">
            Decisions are flowing from your CRM webhooks into human review within 4 minutes on average.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-haze-100 px-4 py-3">
              <span className="text-sm text-ink-300">Pending review</span>
              <span className="text-lg font-semibold text-ink-900">12</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-haze-100 px-4 py-3">
              <span className="text-sm text-ink-300">Escalations today</span>
              <span className="text-lg font-semibold text-ink-900">2</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-haze-100 px-4 py-3">
              <span className="text-sm text-ink-300">Avg review time</span>
              <span className="text-lg font-semibold text-ink-900">4m 12s</span>
            </div>
          </div>
        </div>
        <div className="mt-8 rounded-3xl bg-ink-900 p-5 text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">System of record</p>
          <p className="mt-3 text-lg font-semibold">Decisions are immutable, auditable, and precedent-aware.</p>
          <Button variant="secondary" size="sm" className="mt-4 bg-white text-ink-900 hover:bg-haze-100">
            View trace store
          </Button>
        </div>
      </Card>
    </div>
  );
}
