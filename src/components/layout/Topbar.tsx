import { Bell, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function Topbar() {
  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-panel md:flex-row md:items-center md:justify-between">
      <div className="space-y-2">
        <Badge variant="mint" className="badge">
          Live decisions
        </Badge>
        <h1 className="text-2xl font-semibold text-ink-900 md:text-3xl">
          Decision intelligence for onboarding, pricing, and trust.
        </h1>
        <p className="text-sm text-ink-300">
          You are in the execution path. Every decision is audited, replayable, and human-verified.
        </p>
      </div>
      <div className="flex flex-col items-start gap-3 md:items-end">
        <div className="flex w-full items-center gap-2 rounded-full border border-haze-200 bg-white px-3 py-2 md:w-[320px]">
          <Search className="h-4 w-4 text-ink-300" />
          <Input
            className="h-8 border-none bg-transparent p-0 shadow-none focus-visible:ring-0"
            placeholder="Search decision traces"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Bell className="h-4 w-4" />
            Alerts
          </Button>
          <Button size="sm">
            <Sparkles className="h-4 w-4" />
            New decision
          </Button>
        </div>
      </div>
    </div>
  );
}
