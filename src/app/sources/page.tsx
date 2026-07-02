"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/providers/AuthProvider";
import { Card } from "@/components/ui/card";
import { SubjectCompaniesPanel } from "@/components/settings/SubjectCompaniesPanel";
import {
  createSubjectCompany,
  deleteSubjectCompany,
  listSubjectCompanies,
  updateSubjectCompany,
  type ClientSubjectCompany,
} from "@/lib/api";

export default function SourcesPage() {
  const { session, activeMembership } = useAuth();
  const accessToken = session?.access_token;
  const clientId = activeMembership?.client.id;
  const role = activeMembership?.role;
  const isAdmin = role === "ADMIN";

  const [sources, setSources] = useState<ClientSubjectCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || !clientId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await listSubjectCompanies({ accessToken, clientId });
      setSources(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tracked sites");
    } finally {
      setLoading(false);
    }
  }, [accessToken, clientId]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  if (!isAdmin) {
    return (
      <AppShell>
        <Card className="p-6">
          <p className="text-sm text-ink-300">Only admins can manage tracked sites.</p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <p className="section-title">Tracked Sites</p>
          <h1 className="text-3xl font-semibold text-ink-900">Where the extension can capture</h1>
          <p className="text-sm text-ink-300">
            The Chrome extension only shows its capture icon on domains registered here.
          </p>
        </div>

        <SubjectCompaniesPanel
          rows={sources}
          loading={loading}
          error={error}
          onCreate={async ({ name, domain }) => {
            if (!accessToken || !clientId) return;
            await createSubjectCompany({ name, domain }, { accessToken, clientId });
            await load();
          }}
          onDelete={async (row) => {
            if (!accessToken || !clientId) return;
            await deleteSubjectCompany(row.id, { accessToken, clientId });
            await load();
          }}
          onReactivate={async (row) => {
            if (!accessToken || !clientId) return;
            await updateSubjectCompany(row.id, { active: true }, { accessToken, clientId });
            await load();
          }}
        />
      </div>
    </AppShell>
  );
}
