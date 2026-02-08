import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export function SettingsPanel() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <Card className="p-6">
        <p className="section-title">Tenant settings</p>
        <div className="mt-6 space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-ink-900">Organization name</label>
            <Input placeholder="ContextGrade Demo" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-ink-900">Primary domain</label>
            <Input placeholder="contextgrade.com" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-ink-900">Webhook secret</label>
            <Input placeholder="cg_live_xxx" />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <Button>Save updates</Button>
          <Button variant="secondary">Reset</Button>
        </div>
      </Card>

      <Card className="p-6">
        <p className="section-title">Decision flow</p>
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-haze-200 bg-white px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink-900">Auto-assign approver</p>
              <p className="text-xs text-ink-300">Route by deal size thresholds</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-haze-200 bg-white px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink-900">Escalation alerts</p>
              <p className="text-xs text-ink-300">Notify executives on critical decisions</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-haze-200 bg-white px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink-900">Precedent reminders</p>
              <p className="text-xs text-ink-300">Surface similar past decisions automatically</p>
            </div>
            <Switch />
          </div>
        </div>
      </Card>
    </div>
  );
}
