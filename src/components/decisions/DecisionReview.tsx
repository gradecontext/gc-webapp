import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { precedentDecisions } from "@/lib/mock-data";

export function DecisionReview() {
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-300">Decision proposal</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink-900">Northwind GPU Logistics</h2>
              <p className="text-sm text-ink-300">Discount · $120k · United States</p>
            </div>
            <Badge variant="mint" className="badge">Approve with conditions</Badge>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-haze-100 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-300">Confidence</p>
              <p className="text-lg font-semibold text-ink-900">Medium</p>
            </div>
            <div className="rounded-2xl bg-haze-100 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-300">Signal freshness</p>
              <p className="text-lg font-semibold text-ink-900">3 hours</p>
            </div>
            <div className="rounded-2xl bg-haze-100 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-300">Decision path</p>
              <p className="text-lg font-semibold text-ink-900">CRM webhook</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <p className="section-title">Why the agent recommends caution</p>
          <ul className="mt-4 space-y-3 text-sm text-ink-700">
            <li>Multiple recent complaints about delayed payments across community forums.</li>
            <li>No prior purchasing history with your organization.</li>
            <li>Similar company approved last quarter with a prepay condition and discounted cap.</li>
          </ul>
        </Card>

        <Card className="p-6">
          <p className="section-title">Suggested conditions</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="haze">Require upfront payment</Badge>
            <Badge variant="haze">Limit discount to 10%</Badge>
            <Badge variant="haze">Executive approval required</Badge>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-haze-200 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-300">Reddit complaints</p>
              <p className="text-sm font-semibold text-ink-900">5 recent</p>
            </div>
            <div className="rounded-2xl border border-haze-200 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-300">G2 rating</p>
              <p className="text-sm font-semibold text-ink-900">2.8</p>
            </div>
            <div className="rounded-2xl border border-haze-200 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-300">Payment history</p>
              <p className="text-sm font-semibold text-ink-900">Unknown</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <p className="section-title">Decision controls</p>
          <div className="mt-4 flex flex-col gap-3">
            <Button>Approve as recommended</Button>
            <Button variant="secondary">Reject proposal</Button>
            <Button variant="ghost">Escalate</Button>
          </div>
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-300">Override note</p>
            <Textarea className="mt-3" placeholder="Why you overrode the recommendation" />
          </div>
        </Card>

        <Card className="p-6">
          <p className="section-title">Relevant precedents</p>
          <div className="mt-4 space-y-3">
            {precedentDecisions.map((precedent) => (
              <div key={precedent.id} className="rounded-2xl border border-haze-200 bg-white px-4 py-3">
                <p className="text-sm font-semibold text-ink-900">{precedent.company}</p>
                <p className="text-xs text-ink-300">{precedent.action} · {precedent.outcome}</p>
                <p className="text-xs text-ink-300">{precedent.note}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
