import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-haze-50 px-6">
      <div className="absolute inset-0 bg-radial-glow" />
      <div className="relative flex w-full max-w-5xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4 text-ink-900">
          <p className="section-title">Decision intelligence</p>
          <h1 className="text-4xl font-semibold">Stay in the execution path.</h1>
          <p className="max-w-md text-sm text-ink-300">
            ContextGrade keeps decision traces, precedents, and approvals in one trusted system of record.
          </p>
          <Link href="/auth/sign-up">
            <Button variant="secondary" size="sm">Create a workspace</Button>
          </Link>
        </div>
        <AuthForm mode="sign-in" />
      </div>
    </div>
  );
}
