import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const roles = [
  { name: "Maya R.", role: "Admin", scope: "Global" },
  { name: "Jonas P.", role: "Approver", scope: "Payment terms" },
  { name: "Elena S.", role: "Viewer", scope: "Read-only" }
];

export default function RolesPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <p className="section-title">People & roles</p>
          <h1 className="text-3xl font-semibold text-ink-900">Decision team</h1>
          <p className="text-sm text-ink-300">Define who can approve, override, or escalate decisions.</p>
        </div>
        <Card className="p-6">
          <div className="space-y-4">
            {roles.map((member) => (
              <div
                key={member.name}
                className="flex flex-col gap-3 rounded-2xl border border-haze-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-ink-900">{member.name}</p>
                  <p className="text-xs text-ink-300">{member.scope}</p>
                </div>
                <Badge variant="haze">{member.role}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
