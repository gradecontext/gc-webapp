"use client";

import { useState } from "react";
import Image from "next/image";
import { Building2, Clock, RefreshCw } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";

export function PendingApprovalScreen() {
  const { backendUser, needsRegistration, memberships, signOut, refreshMemberships } = useAuth();
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);

  const pendingMembership = memberships.find((m) => m.status === "PENDING");
  const hasActiveMembership = memberships.some((m) => m.status === "ACTIVE");

  if (needsRegistration || !backendUser || hasActiveMembership || !pendingMembership) {
    return null;
  }

  async function handleCheckStatus() {
    setChecking(true);
    setChecked(false);
    try {
      await refreshMemberships();
      setChecked(true);
    } finally {
      setChecking(false);
    }
  }

  const orgName = pendingMembership.client.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-haze-50">
      {/* Subtle grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-grid-lines opacity-40" />

      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-haze-200 bg-white p-8 shadow-xl">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <Image
            src="/logos/context-grade-logo.png"
            alt="ContextGrade"
            width={140}
            height={36}
            className="h-8 w-auto"
            priority
          />
        </div>

        {/* Icon */}
        <div className="mb-5 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-50">
            <Clock className="h-8 w-8 text-accent-500" />
          </div>
        </div>

        {/* Heading */}
        <div className="mb-6 text-center">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-ink-300">
            Pending Approval
          </p>
          <h1 className="mb-2 text-xl font-semibold text-ink-900">
            Waiting for admin approval
          </h1>
          <p className="text-sm text-ink-500">
            Your request to join{" "}
            <span className="inline-flex items-center gap-1 font-medium text-ink-700">
              <Building2 className="inline h-3.5 w-3.5 text-accent-500" />
              {orgName}
            </span>{" "}
            has been sent. An admin needs to approve your membership before you
            can access the workspace.
          </p>
        </div>

        {/* Status card */}
        <div className="mb-6 rounded-xl border border-haze-200 bg-haze-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
            <div>
              <p className="text-sm font-medium text-ink-700">
                Membership request pending
              </p>
              <p className="mt-0.5 text-xs text-ink-400">
                You&apos;ll be notified once an admin of{" "}
                <span className="font-medium text-ink-600">{orgName}</span>{" "}
                approves your request.
              </p>
            </div>
          </div>
        </div>

        {/* Check status button */}
        <Button
          className="w-full"
          onClick={handleCheckStatus}
          disabled={checking}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${checking ? "animate-spin" : ""}`}
          />
          {checking ? "Checking…" : "Check approval status"}
        </Button>

        {checked && !checking && (
          <p className="mt-3 text-center text-xs text-ink-400">
            Still pending — reach out to your{" "}
            <span className="font-medium text-ink-600">{orgName}</span> admin
            directly if this is taking too long.
          </p>
        )}

        <button
          type="button"
          className="mt-4 w-full text-center text-xs text-ink-300 transition hover:text-ink-500"
          onClick={() => signOut()}
        >
          Sign out and try a different account
        </button>
      </div>
    </div>
  );
}
