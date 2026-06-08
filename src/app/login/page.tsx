"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { AuthContent } from "@/components/auth/AuthContent";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/decisions";
  const fromExtension = searchParams.get("from") === "extension";

  return (
    <div className="flex min-h-screen items-center justify-center bg-haze-50 px-6 py-12">
      <div className="absolute inset-0 bg-radial-glow" />
      <div className="relative flex w-full max-w-5xl flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
        {/* Brand panel */}
        <div className="w-full space-y-4 text-center text-ink-900 lg:max-w-sm lg:text-left">
          <p className="section-title">Decision memory</p>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
            The why behind every important decision.
          </h1>
          <p className="mx-auto max-w-sm text-sm text-ink-300 lg:mx-0">
            ContextGrade captures decision context across your tools so your
            team always knows why something was approved, rejected, or changed.
          </p>
          {fromExtension && (
            <div className="mx-auto max-w-sm rounded-2xl border border-haze-200 bg-white px-4 py-3 text-sm text-ink-400 lg:mx-0">
              Sign in to sync decisions captured by the ContextGrade extension.
            </div>
          )}
        </div>

        {/* Auth card */}
        <Card className="w-full max-w-md p-8">
          <AuthContent onSuccess={() => router.push(redirect)} />
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
