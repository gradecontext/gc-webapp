"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type AuthMode = "sign-in" | "sign-up";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();

    const response =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (response.error) {
      setMessage(response.error.message);
    } else {
      setMessage(
        mode === "sign-in"
          ? "Signed in. Redirecting to decision queue."
          : "Check your email to confirm your account."
      );
    }

    setLoading(false);
  }

  return (
    <Card className="w-full max-w-md p-8">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-300">
            ContextGrade
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-ink-900">
            {mode === "sign-in" ? "Welcome back" : "Create your workspace"}
          </h1>
          <p className="text-sm text-ink-300">
            {mode === "sign-in"
              ? "Sign in to review live decisions."
              : "Start capturing decision traces for your team."}
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink-900">Work email</label>
          <Input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            type="email"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink-900">Password</label>
          <Input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            required
          />
        </div>
        {message ? <p className="text-sm text-ink-300">{message}</p> : null}
        <Button className="w-full" disabled={loading} type="submit">
          {loading ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
        </Button>
      </form>
    </Card>
  );
}
