"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import {
  createBackendUser,
  type ClientPlan,
  type CompanySize,
} from "@/lib/auth-api";
import { searchClients, type ClientSearchResult } from "@/lib/api";
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
import { Building2, Loader2, Search, X } from "lucide-react";

const companySchema = z.object({
  client_name: z.string().min(1, "Company name is required"),
  client_id: z.number().optional(),
  company_size: z
    .enum(["MICRO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE", "MEGA"])
    .optional(),
  plan: z.enum(["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"]).optional(),
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
    signOut,
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    client_name: "",
    client_id: undefined as number | undefined,
    company_size: undefined as CompanySize | undefined,
    plan: undefined as ClientPlan | undefined,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [searchResults, setSearchResults] = useState<ClientSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCompany, setSelectedCompany] =
    useState<ClientSearchResult | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runClientSearch = useCallback(
    async (query: string) => {
      if (!session?.access_token || query.length < 3) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      setSearching(true);
      try {
        const clients = await searchClients(query, {
          accessToken: session.access_token,
        });
        setSearchResults(Array.isArray(clients) ? clients : []);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    },
    [session?.access_token],
  );

  function handleCompanyNameChange(value: string) {
    setForm((p) => ({ ...p, client_name: value, client_id: undefined }));
    setSelectedCompany(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length >= 3) {
      debounceRef.current = setTimeout(() => runClientSearch(value), 300);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }

  function handleSelectCompany(client: ClientSearchResult) {
    setSelectedCompany(client);
    setForm((p) => ({
      ...p,
      client_name: client.name,
      client_id: client.id,
    }));
    setShowDropdown(false);
  }

  function clearSelectedCompany() {
    setSelectedCompany(null);
    setForm((p) => ({ ...p, client_name: "", client_id: undefined }));
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

    if (!user?.email) {
      setError("Session expired. Please sign in again.");
      return;
    }

    // Get the freshest token once right before submission — do NOT read from
    // React state (session.access_token) here. If TOKEN_REFRESHED fired since
    // the last render, React state has the old token and the backend will 401.
    // Calling getSession() returns whatever Supabase currently considers valid.
    const { data: freshData } = await createClient().auth.getSession();
    const accessToken = freshData.session?.access_token;

    if (!accessToken) {
      setError("Session expired. Please sign in again.");
      return;
    }

    setLoading(true);
    try {
      await createBackendUser(
        {
          email: user.email,
          name:
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            undefined,
          display_name: user.user_metadata?.name ?? undefined,
          client: {
            ...(result.data.client_id
              ? { client_id: result.data.client_id }
              : { client_name: result.data.client_name }),
            plan: result.data.plan ?? "STARTER",
            settings: result.data.company_size
              ? { company_size: result.data.company_size }
              : undefined,
          },
        },
        accessToken,
      );

      // Full page reload after registration — the backend is not ready to serve
      // /memberships/me for a brand-new user in the same page-load cycle (same
      // root cause as why a manual hard-refresh always fixes the 401). The auth
      // callback now correctly sets session cookies, so AuthProvider will
      // re-initialize cleanly: GET /users/me → 200, GET /memberships/me → 200.
      window.location.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed");
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
          {/* Company Name — search & select */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink-700">
              Company Name
            </label>
            <div className="relative" ref={dropdownRef}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
              <Input
                placeholder="Search or enter company name…"
                value={form.client_name}
                onChange={(e) => handleCompanyNameChange(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0 && !selectedCompany)
                    setShowDropdown(true);
                }}
                className="pl-10"
              />
              {searching && (
                <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-300" />
              )}

              {showDropdown && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-haze-200 bg-white shadow-lg">
                  {searchResults.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition hover:bg-haze-50"
                      onClick={() => handleSelectCompany(client)}
                    >
                      <Building2 className="h-4 w-4 shrink-0 text-accent-500" />
                      <span className="truncate font-medium text-ink-700">
                        {client.name}
                      </span>
                      {client.plan && (
                        <span className="ml-auto shrink-0 rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-600">
                          {client.plan}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {showDropdown &&
                !searching &&
                searchResults.length === 0 &&
                form.client_name.length >= 3 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-haze-200 bg-white px-3 py-3 shadow-lg">
                    <p className="text-sm text-ink-300">
                      No existing companies found. A new company will be
                      created.
                    </p>
                  </div>
                )}
            </div>

            {selectedCompany && (
              <div className="flex items-center gap-2 rounded-lg bg-accent-50 px-3 py-2">
                <Building2 className="h-4 w-4 shrink-0 text-accent-600" />
                <span className="text-sm font-medium text-accent-700">
                  Joining: {selectedCompany.name}
                </span>
                <button
                  type="button"
                  className="ml-auto rounded-md p-0.5 text-ink-400 transition hover:bg-accent-100 hover:text-ink-600"
                  onClick={clearSelectedCompany}
                  aria-label="Clear selection"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

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
