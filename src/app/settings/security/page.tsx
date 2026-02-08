import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const keys = [
  { name: "Primary webhook key", value: "cg_live_42b7..." },
  { name: "Internal staging key", value: "cg_stage_9f1a..." }
];

export default function SecurityPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <p className="section-title">Security</p>
          <h1 className="text-3xl font-semibold text-ink-900">API keys & secrets</h1>
          <p className="text-sm text-ink-300">Rotate keys and manage webhook access to keep decisions trusted.</p>
        </div>
        <Card className="p-6 space-y-4">
          {keys.map((key) => (
            <div
              key={key.name}
              className="flex flex-col gap-3 rounded-2xl border border-haze-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-ink-900">{key.name}</p>
                <p className="text-xs text-ink-300">{key.value}</p>
              </div>
              <Button variant="secondary" size="sm">Rotate</Button>
            </div>
          ))}
        </Card>
      </div>
    </AppShell>
  );
}
