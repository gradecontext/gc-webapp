import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const decisions = [
  {
    id: "dec-10024",
    company: "Northwind GPU Logistics",
    status: "Proposed",
    type: "Discount",
    outcome: "Pending",
    updatedAt: "Feb 7, 2026"
  },
  {
    id: "dec-10012",
    company: "VectorForge",
    status: "Overridden",
    type: "Payment terms",
    outcome: "Expanded",
    updatedAt: "Feb 5, 2026"
  },
  {
    id: "dec-09901",
    company: "Nimbus Compute",
    status: "Approved",
    type: "Onboarding",
    outcome: "Paid on time",
    updatedAt: "Jan 28, 2026"
  }
];

export default function DecisionsPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-3">
          <p className="section-title">Decision trace store</p>
          <h1 className="text-3xl font-semibold text-ink-900">Searchable, replayable decisions</h1>
          <p className="text-sm text-ink-300">
            Every decision is stored with its context snapshot, human override, and eventual outcome.
          </p>
        </div>
        <Card className="p-6">
          <div className="grid gap-4">
            {decisions.map((decision) => (
              <div
                key={decision.id}
                className="flex flex-col gap-3 rounded-2xl border border-haze-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-ink-900">{decision.company}</p>
                  <p className="text-xs text-ink-300">{decision.type} · {decision.updatedAt}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="haze">{decision.status}</Badge>
                  <Badge variant="mint">{decision.outcome}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
