"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/providers/AuthProvider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { SettingsCrudPanel, type SettingsRow } from "@/components/settings/SettingsCrudPanel";
import {
  createContextCategory,
  createDecisionType,
  deleteContextCategory,
  deleteDecisionType,
  listContextCategories,
  listDecisionTypes,
  updateContextCategory,
  updateDecisionType,
  type ClientContextCategory,
  type ClientDecisionType,
} from "@/lib/api";

function typeRows(items: ClientDecisionType[]): SettingsRow[] {
  return items.map((t) => ({
    id: t.id,
    code: t.decision_type,
    label: t.label,
    is_reserved: t.is_reserved,
    active: t.active,
  }));
}

function categoryRows(items: ClientContextCategory[]): SettingsRow[] {
  return items.map((c) => ({
    id: c.id,
    code: c.category,
    label: c.label,
    is_reserved: c.is_reserved,
    active: c.active,
  }));
}

export default function SettingsPage() {
  const { session, activeMembership } = useAuth();
  const accessToken = session?.access_token;
  const clientId = activeMembership?.client.id;
  const role = activeMembership?.role;
  const isAdmin = role === "ADMIN" || role === "OWNER";

  const [types, setTypes] = useState<ClientDecisionType[]>([]);
  const [categories, setCategories] = useState<ClientContextCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || !clientId) return;
    setLoading(true);
    setError(null);
    try {
      const [t, c] = await Promise.all([
        listDecisionTypes({ accessToken, clientId }),
        listContextCategories({ accessToken, clientId }),
      ]);
      setTypes(t);
      setCategories(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [accessToken, clientId]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <p className="section-title">Settings</p>
          <h1 className="text-3xl font-semibold text-ink-900">Decision types & context categories</h1>
          <p className="text-sm text-ink-300">
            Reserved entries are seeded automatically per client and can&apos;t be edited or removed.
          </p>
        </div>

        {!isAdmin ? (
          <Card className="p-6">
            <p className="text-sm text-ink-300">
              Only admins and owners can manage decision types and context categories.
            </p>
          </Card>
        ) : (
          <Tabs defaultValue="types">
            <TabsList>
              <TabsTrigger value="types">Decision Types</TabsTrigger>
              <TabsTrigger value="categories">Context Categories</TabsTrigger>
            </TabsList>

            <TabsContent value="types">
              <SettingsCrudPanel
                description="The decision_type recorded on every decision logged by the extension or API."
                rows={typeRows(types)}
                loading={loading}
                error={error}
                onCreate={async (name) => {
                  if (!accessToken || !clientId) return;
                  await createDecisionType({ decision_type: name }, { accessToken, clientId });
                  await load();
                }}
                onToggleActive={async (row, active) => {
                  if (!accessToken || !clientId) return;
                  await updateDecisionType(row.id, { active }, { accessToken, clientId });
                  await load();
                }}
                onDelete={async (row) => {
                  if (!accessToken || !clientId) return;
                  await deleteDecisionType(row.id, { accessToken, clientId });
                  await load();
                }}
              />
            </TabsContent>

            <TabsContent value="categories">
              <SettingsCrudPanel
                description="Categories group decisions for AI Decision Reports and the context graph."
                rows={categoryRows(categories)}
                loading={loading}
                error={error}
                onCreate={async (name) => {
                  if (!accessToken || !clientId) return;
                  await createContextCategory({ category: name }, { accessToken, clientId });
                  await load();
                }}
                onToggleActive={async (row, active) => {
                  if (!accessToken || !clientId) return;
                  await updateContextCategory(row.id, { active }, { accessToken, clientId });
                  await load();
                }}
                onDelete={async (row) => {
                  if (!accessToken || !clientId) return;
                  await deleteContextCategory(row.id, { accessToken, clientId });
                  await load();
                }}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppShell>
  );
}
