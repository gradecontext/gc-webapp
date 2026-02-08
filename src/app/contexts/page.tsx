import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const contexts = [
  { name: "Payment onboarding", category: "PAYMENT", active: true },
  { name: "Discount approvals", category: "SALES", active: true },
  { name: "Renewal risk", category: "CUSTOM", active: false }
];

export default function ContextsPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <p className="section-title">Decision contexts</p>
          <h1 className="text-3xl font-semibold text-ink-900">Domain playbooks</h1>
          <p className="text-sm text-ink-300">Context domains power policy application and precedent search.</p>
        </div>
        <Card className="p-6">
          <div className="space-y-4">
            {contexts.map((context) => (
              <div
                key={context.name}
                className="flex flex-col gap-3 rounded-2xl border border-haze-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-ink-900">{context.name}</p>
                  <p className="text-xs text-ink-300">Category: {context.category}</p>
                </div>
                <Badge variant={context.active ? "mint" : "haze"}>
                  {context.active ? "Active" : "Paused"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
