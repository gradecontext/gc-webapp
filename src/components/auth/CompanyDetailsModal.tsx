"use client";

import { useState } from "react";
import { z } from "zod";
import { useAuth } from "@/providers/AuthProvider";
import {
  createBackendUser,
  type ClientPlan,
  type CompanySize,
} from "@/lib/auth-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const companySchema = z.object({
  client_name: z.string().min(1, "Company name is required"),
  company_size: z
    .enum(["MICRO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE", "MEGA"])
    .optional(),
  plan: z
    .enum(["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"])
    .optional(),
});

const COMPANY_SIZES: { value: CompanySize; label: string }[] = [
  { value: "MICRO", label: "Micro (1–10 employees)" },
  { value: "SMALL", label: "Small (11–50 employees)" },
  { value: "MEDIUM", label: "Medium (51–200 employees)" },
  { value: "LARGE", label: "Large (201–1,000 employees)" },
  { value: "ENTERPRISE", label: "Enterprise (1,001–5,000 employees)" },
  { value: "MEGA", label: "Mega (5,000+ employees)" },
];

const PLANS: { value: ClientPlan; label: string }[] = [
  { value: "FREE", label: "Free" },
  { value: "STARTER", label: "Starter" },
  { value: "PROFESSIONAL", label: "Professional" },
  { value: "ENTERPRISE", label: "Enterprise" },
];

export function CompanyDetailsModal() {
  const {
    session,
    user,
    needsRegistration,
    setBackendUser,
    setNeedsRegistration,
    signOut,
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    client_name: "",
    company_size: undefined as CompanySize | undefined,
    plan: undefined as ClientPlan | undefined,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const result = companySchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => {
        if (i.path[0]) errs[i.path[0] as string] = i.message;
      });
      setFieldErrors(errs);
      return;
    }

    if (!session?.access_token || !user?.email) {
      setError("Session expired. Please sign in again.");
      return;
    }

    setLoading(true);
    try {
      const { user: backendUser } = await createBackendUser(
        {
          email: user.email,
          name:
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            undefined,
          display_name: user.user_metadata?.name ?? undefined,
          client: {
            client_name: result.data.client_name,
            plan: result.data.plan ?? "STARTER",
            settings: result.data.company_size
              ? { company_size: result.data.company_size }
              : undefined,
          },
        },
        session.access_token
      );

      setBackendUser(backendUser);
      setNeedsRegistration(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setLoading(false);
    }
  }

  if (!needsRegistration || !session) return null;

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-300">
            ContextGrade
          </p>
          <DialogTitle>Complete your profile</DialogTitle>
          <DialogDescription>
            Tell us about your company to finish setting up your workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink-700">
              Company Name
            </label>
            <Input
              placeholder="Emergent Inc"
              value={form.client_name}
              onChange={(e) =>
                setForm((p) => ({ ...p, client_name: e.target.value }))
              }
            />
            {fieldErrors.client_name && (
              <p className="text-xs text-ember-500">
                {fieldErrors.client_name}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink-700">
              Company Size
            </label>
            <Select
              value={form.company_size ?? ""}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, company_size: v as CompanySize }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select company size" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SIZES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink-700">
              Subscription Plan
            </label>
            <Select
              value={form.plan ?? ""}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, plan: v as ClientPlan }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Starter (default)" />
              </SelectTrigger>
              <SelectContent>
                {PLANS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-xl bg-ember-50 px-4 py-3 text-sm text-ember-600">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Setting up…" : "Complete Setup"}
          </Button>

          <button
            type="button"
            className="w-full text-center text-xs text-ink-300 transition hover:text-ink-500"
            onClick={() => signOut()}
          >
            Sign out and try a different account
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
