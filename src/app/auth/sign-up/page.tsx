import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { Button } from "@/components/ui/button";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-haze-50 px-6">
      <div className="absolute inset-0 bg-radial-glow" />
      <div className="relative flex w-full max-w-5xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4 text-ink-900">
          <p className="section-title">ContextGrade</p>
          <h1 className="text-4xl font-semibold">Build your decision trace store.</h1>
          <p className="max-w-md text-sm text-ink-300">
            Capture why decisions are made, not just what happened. Unlock precedent-aware onboarding and pricing.
          </p>
          <Link href="/auth/sign-in">
            <Button variant="secondary" size="sm">Sign in instead</Button>
          </Link>
        </div>
        <AuthForm mode="sign-up" />
      </div>
    </div>
  );
}
