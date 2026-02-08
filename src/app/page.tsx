import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { DecisionQueue } from "@/components/decisions/DecisionQueue";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <Topbar />
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
