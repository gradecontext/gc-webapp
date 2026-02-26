"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MailCheck } from "lucide-react";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

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

type SignInValues = z.infer<typeof signInSchema>;
type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
};

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "sign-in" | "register";
}

export function AuthModal({
  open,
  onOpenChange,
  defaultTab = "sign-in",
}: AuthModalProps) {
  const [tab, setTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);
  const { setBackendUser, setNeedsRegistration } = useAuth();

  const [signInForm, setSignInForm] = useState<SignInValues>({
    email: "",
    password: "",
  });
  const [signInErrors, setSignInErrors] = useState<
    Partial<Record<keyof SignInValues, string>>
  >({});

  const [registerForm, setRegisterForm] = useState<RegisterFormValues>({
    name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [registerErrors, setRegisterErrors] = useState<
    Partial<Record<keyof RegisterFormValues, string>>
  >({});

  useEffect(() => {
    if (open) {
      setTab(defaultTab);
      setError(null);
      setRegistered(false);
      setSignInErrors({});
      setRegisterErrors({});
    }
  }, [open, defaultTab]);

  function resetMessages() {
    setError(null);
    setRegistered(false);
    setSignInErrors({});
    setRegisterErrors({});
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();

    const result = signInSchema.safeParse(signInForm);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => {
        if (i.path[0]) errs[i.path[0] as string] = i.message;
      });
      setSignInErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      });

      if (authError) {
        setError(authError.message);
      } else {
        onOpenChange(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();

    const result = registerSchema.safeParse(registerForm);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => {
        if (i.path[0]) errs[i.path[0] as string] = i.message;
      });
      setRegisterErrors(errs);
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
    resetMessages();
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
        err instanceof Error ? err.message : "Google sign in failed"
      );
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-300">
            ContextGrade
          </p>
          <DialogTitle>
            {tab === "sign-in" ? "Welcome back" : "Create your workspace"}
          </DialogTitle>
          <DialogDescription>
            {tab === "sign-in"
              ? "Sign in to review live decisions."
              : "Start capturing decision traces for your team."}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v as "sign-in" | "register");
            resetMessages();
          }}
          className="mt-2"
        >
          <TabsList className="w-full">
            <TabsTrigger value="sign-in" className="flex-1">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="register" className="flex-1">
              Register
            </TabsTrigger>
          </TabsList>

          {/* ---------- SIGN IN ---------- */}
          <TabsContent value="sign-in">
            <form onSubmit={handleSignIn} className="space-y-4">
              <Field label="Email" error={signInErrors.email}>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={signInForm.email}
                  onChange={(e) =>
                    setSignInForm((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </Field>

              <Field label="Password" error={signInErrors.password}>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={signInForm.password}
                  onChange={(e) =>
                    setSignInForm((p) => ({
                      ...p,
                      password: e.target.value,
                    }))
                  }
                />
              </Field>

              {error && <Alert variant="error">{error}</Alert>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>

            <Divider />

            <Button
              type="button"
              variant="secondary"
              className="w-full gap-3"
              disabled={loading}
              onClick={handleGoogleAuth}
            >
              <GoogleIcon />
              Sign in with Google
            </Button>
          </TabsContent>

          {/* ---------- REGISTER ---------- */}
          <TabsContent value="register">
            {registered ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mint-50">
                  <MailCheck className="h-7 w-7 text-mint-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-ink-900">
                    Check your email
                  </p>
                  <p className="text-sm text-ink-400">
                    We&apos;ve sent a verification link to{" "}
                    <span className="font-medium text-ink-700">
                      {registerForm.email}
                    </span>
                    . Click the link to verify your account, then you&apos;ll be
                    able to complete your workspace setup.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Got it
                </Button>
              </div>
            ) : (
              <>
                <form onSubmit={handleRegister} className="space-y-4">
                  <Field label="Full Name" error={registerErrors.name}>
                    <Input
                      placeholder="Adam Smith"
                      value={registerForm.name}
                      onChange={(e) =>
                        setRegisterForm((p) => ({
                          ...p,
                          name: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="Email" error={registerErrors.email}>
                    <Input
                      type="email"
                      placeholder="you@company.com"
                      value={registerForm.email}
                      onChange={(e) =>
                        setRegisterForm((p) => ({
                          ...p,
                          email: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="Password" error={registerErrors.password}>
                    <Input
                      type="password"
                      placeholder="Min 8 characters"
                      value={registerForm.password}
                      onChange={(e) =>
                        setRegisterForm((p) => ({
                          ...p,
                          password: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field
                    label="Confirm Password"
                    error={registerErrors.confirm_password}
                  >
                    <Input
                      type="password"
                      placeholder="Re-enter your password"
                      value={registerForm.confirm_password}
                      onChange={(e) =>
                        setRegisterForm((p) => ({
                          ...p,
                          confirm_password: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  {error && <Alert variant="error">{error}</Alert>}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Creating account…" : "Create Account"}
                  </Button>
                </form>

                <Divider />

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
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
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

function Alert({
  variant,
  children,
}: {
  variant: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        variant === "error"
          ? "rounded-xl bg-ember-50 px-4 py-3 text-sm text-ember-600"
          : "rounded-xl bg-mint-50 px-4 py-3 text-sm text-mint-700"
      }
    >
      {children}
    </div>
  );
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-haze-200" />
      <span className="text-xs text-ink-300">or continue with</span>
      <div className="h-px flex-1 bg-haze-200" />
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
