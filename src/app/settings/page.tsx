import { AppShell } from "@/components/layout/AppShell";
import { SettingsPanel } from "@/components/settings/SettingsPanel";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <p className="section-title">Settings</p>
          <h1 className="text-3xl font-semibold text-ink-900">Tenant configuration</h1>
          <p className="text-sm text-ink-300">
            Manage API keys, webhook secrets, and decision routing preferences.
          </p>
        </div>
        <SettingsPanel />
      </div>
    </AppShell>
  );
}
