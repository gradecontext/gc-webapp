"use client";

import { useState } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  ChevronLeft,
  GitBranch,
  MailCheck,
  Shield,
  Sparkles,
} from "lucide-react";

const registerSchema = z
  .object({
    name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
};

export function LandingPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="relative min-h-screen bg-haze-50">
      <div className="pointer-events-none absolute inset-0 bg-grid-lines opacity-40" />

      <div className="relative flex min-h-screen flex-col">
        <Topbar onMenuToggle={() => {}} minimal transparent />

        <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
          <div className="w-full max-w-3xl">
            {!showForm ? (
              <HeroSection
                key="hero"
                onGetStarted={() => setShowForm(true)}
              />
            ) : (
              <FormSection key="form" onBack={() => setShowForm(false)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="text-center">
      <div className="animate-fade-up" style={{ animationDelay: "0ms" }}>
        <span className="inline-flex items-center gap-2 rounded-full border border-accent-200 bg-accent-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent-700">
          <Sparkles className="h-3.5 w-3.5" />
          Decision Intelligence Platform
        </span>
      </div>

      <h1
        className="mt-8 animate-fade-up font-display text-4xl font-bold text-ink-900 sm:text-5xl lg:text-6xl"
        style={{ animationDelay: "100ms" }}
      >
        Welcome to{" "}
        <span className="bg-gradient-accent bg-clip-text text-transparent">
          ContextGrade
        </span>
      </h1>

      <p
        className="mt-4 animate-fade-up font-display text-lg font-medium text-ink-400 sm:text-xl"
        style={{ animationDelay: "200ms" }}
      >
        Your personal decision intelligence platform
      </p>

      <p
        className="mx-auto mt-6 max-w-2xl animate-fade-up text-base leading-relaxed text-ink-300"
        style={{ animationDelay: "300ms" }}
      >
        Make smarter, faster, and more transparent business decisions.
        ContextGrade captures every decision across onboarding, pricing, and
        trust &mdash; making them auditable, replayable, and continuously
        improving with your team&apos;s collective intelligence.
      </p>

      <div className="mt-8 animate-fade-up" style={{ animationDelay: "400ms" }}>
        <Button
          size="lg"
          onClick={onGetStarted}
          className="gap-2 bg-gradient-accent text-white shadow-glow-accent transition-shadow hover:shadow-glow"
        >
          Let&apos;s get started
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div
        className="mx-auto mt-12 grid max-w-2xl gap-4 sm:grid-cols-3 animate-fade-up"
        style={{ animationDelay: "500ms" }}
      >
        {[
          {
            icon: GitBranch,
            title: "Decision Tracing",
            desc: "Capture & audit every decision in real-time",
          },
          {
            icon: Sparkles,
            title: "Context Signals",
            desc: "Smart signals to power intelligent decisions",
          },
          {
            icon: Shield,
            title: "Human Verified",
            desc: "Every decision is explainable & accountable",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition hover:shadow-panel"
          >
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-accent text-white shadow-sm">
              <feature.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-ink-900">
              {feature.title}
            </p>
            <p className="mt-1 text-xs text-ink-300">{feature.desc}</p>
          </div>
        ))}
      </div>

      <p
        className="mt-8 animate-fade-up text-sm text-ink-300"
        style={{ animationDelay: "600ms" }}
      >
        Learn more at{" "}
        <a
          href="https://contextgrade.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-accent-600 underline decoration-accent-200 underline-offset-2 hover:text-accent-700"
        >
          contextgrade.com
        </a>
      </p>
    </div>
  );
}

function FormSection({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);
  const [form, setForm] = useState<RegisterFormValues>({
    name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof RegisterFormValues, string>>
  >({});

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setErrors({});

    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => {
        if (i.path[0]) errs[i.path[0] as string] = i.message;
      });
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email: result.data.email,
          password: result.data.password,
          options: { data: { full_name: result.data.name } },
        });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (authData.user?.identities?.length === 0) {
        setError(
          "This email is already registered. Please sign in instead, or use Google if you originally signed up with Google."
        );
        return;
      }

      setRegistered(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Google sign up failed"
      );
      setLoading(false);
    }
  }

  if (registered) {
    return (
      <div className="mx-auto max-w-md animate-fade-in-scale">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-panel backdrop-blur-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mint-50">
            <MailCheck className="h-7 w-7 text-mint-600" />
          </div>
          <p className="mt-4 text-lg font-semibold text-ink-900">
            Check your email
          </p>
          <p className="mt-2 text-sm text-ink-400">
            We&apos;ve sent a verification link to{" "}
            <span className="font-medium text-ink-700">{form.email}</span>.
            Click the link to verify your account, then you&apos;ll be able to
            complete your workspace setup.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-6"
            onClick={onBack}
          >
            Back to home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <button
        onClick={onBack}
        className="mb-6 flex animate-fade-up items-center gap-1.5 text-sm text-ink-400 transition hover:text-ink-700"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      <div className="animate-fade-in-scale rounded-3xl border border-white/60 bg-white/80 p-8 shadow-panel backdrop-blur-xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-300">
            ContextGrade
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold text-ink-900">
            Create your workspace
          </h2>
          <p className="mt-1 text-sm text-ink-400">
            Start capturing decision traces for your team.
          </p>
        </div>

        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          <Field label="Full Name" error={errors.name}>
            <Input
              placeholder="Adam Smith"
              value={form.name}
              onChange={(e) =>
                setForm((p) => ({ ...p, name: e.target.value }))
              }
            />
          </Field>

          <Field label="Email" error={errors.email}>
            <Input
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <Input
              type="password"
              placeholder="Min 8 characters"
              value={form.password}
              onChange={(e) =>
                setForm((p) => ({ ...p, password: e.target.value }))
              }
            />
          </Field>

          <Field label="Confirm Password" error={errors.confirm_password}>
            <Input
              type="password"
              placeholder="Re-enter your password"
              value={form.confirm_password}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  confirm_password: e.target.value,
                }))
              }
            />
          </Field>

          {error && (
            <div className="rounded-xl bg-ember-50 px-4 py-3 text-sm text-ember-600">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-haze-200" />
          <span className="text-xs text-ink-300">or continue with</span>
          <div className="h-px flex-1 bg-haze-200" />
        </div>

        <Button
          type="button"
          variant="secondary"
          className="w-full gap-3"
          disabled={loading}
          onClick={handleGoogleAuth}
        >
          <GoogleIcon />
          Sign up with Google
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-ink-700">{label}</label>
      {children}
      {error && <p className="text-xs text-ember-500">{error}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
