import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sources = [
  { name: "Reddit", status: "Healthy", lastSync: "5 min ago" },
  { name: "G2", status: "Degraded", lastSync: "2 hours ago" },
  { name: "Trustpilot", status: "Healthy", lastSync: "12 min ago" },
  { name: "Court records", status: "Paused", lastSync: "Manual" }
];

export default function SignalsPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <p className="section-title">Signals</p>
          <h1 className="text-3xl font-semibold text-ink-900">Source reliability</h1>
          <p className="text-sm text-ink-300">Track every external source used in decision context.</p>
        </div>
        <Card className="p-6">
          <div className="space-y-4">
            {sources.map((source) => (
              <div
                key={source.name}
                className="flex flex-col gap-3 rounded-2xl border border-haze-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-ink-900">{source.name}</p>
                  <p className="text-xs text-ink-300">Last sync: {source.lastSync}</p>
                </div>
                <Badge variant={source.status === "Healthy" ? "mint" : "haze"}>{source.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
