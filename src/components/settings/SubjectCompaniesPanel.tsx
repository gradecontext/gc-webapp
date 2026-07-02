"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ClientSubjectCompany } from "@/lib/api";

function normalizeDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

interface SubjectCompaniesPanelProps {
  rows: ClientSubjectCompany[];
  loading: boolean;
  error: string | null;
  onCreate: (payload: { name: string; domain: string }) => Promise<void>;
  onDelete: (row: ClientSubjectCompany) => Promise<void>;
  onReactivate: (row: ClientSubjectCompany) => Promise<void>;
}

export function SubjectCompaniesPanel({
  rows,
  loading,
  error,
  onCreate,
  onDelete,
  onReactivate,
}: SubjectCompaniesPanelProps) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [busyRowId, setBusyRowId] = useState<number | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const normalizedDomain = normalizeDomain(domain);
    if (!trimmedName || !normalizedDomain) return;

    setCreating(true);
    setCreateError(null);
    try {
      await onCreate({ name: trimmedName, domain: normalizedDomain });
      setName("");
      setDomain("");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to add site");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(row: ClientSubjectCompany) {
    setBusyRowId(row.id);
    try {
      await onDelete(row);
    } finally {
      setBusyRowId(null);
    }
  }

  async function handleReactivate(row: ClientSubjectCompany) {
    setBusyRowId(row.id);
    try {
      await onReactivate(row);
    } finally {
      setBusyRowId(null);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-300">
        Domains the Chrome extension is allowed to show its capture icon on. Staff won&apos;t see the
        ContextGrade icon anywhere that isn&apos;t listed here.
      </p>

      <Card className="p-6">
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium text-ink-700">Name</label>
            <Input
              placeholder="BambooHR"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium text-ink-700">Domain</label>
            <Input
              placeholder="bamboohr.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={creating || !name.trim() || !domain.trim()}>
            {creating ? "Adding…" : "Add"}
          </Button>
        </form>
        {createError && <p className="mt-2 text-xs text-ember-500">{createError}</p>}
      </Card>

      {error && (
        <div className="rounded-2xl bg-ember-50 px-4 py-3 text-sm text-ember-600">{error}</div>
      )}

      <Card className="p-6">
        {loading ? (
          <p className="text-sm text-ink-300">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink-300">No tracked sites yet.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex flex-col gap-3 rounded-2xl border border-haze-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-ink-900">{row.name}</p>
                  <p className="text-xs text-ink-300">{row.domain ?? row.external_id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={row.active ? "mint" : "haze"}>
                    {row.active ? "Active" : "Inactive"}
                  </Badge>
                  {row.active ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busyRowId === row.id}
                      onClick={() => handleDelete(row)}
                    >
                      {busyRowId === row.id ? "Removing…" : "Delete"}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busyRowId === row.id}
                      onClick={() => handleReactivate(row)}
                    >
                      {busyRowId === row.id ? "Reactivating…" : "Reactivate"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
