"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export type SettingsRow = {
  id: string;
  code: string;
  label?: string | null;
  is_reserved: boolean;
  active: boolean;
};

function previewCode(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

interface SettingsCrudPanelProps {
  description: string;
  rows: SettingsRow[];
  loading: boolean;
  error: string | null;
  onCreate: (name: string) => Promise<void>;
  onToggleActive: (row: SettingsRow, active: boolean) => Promise<void>;
  onDelete: (row: SettingsRow) => Promise<void>;
}

export function SettingsCrudPanel({
  description,
  rows,
  loading,
  error,
  onCreate,
  onToggleActive,
  onDelete,
}: SettingsCrudPanelProps) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [busyRowId, setBusyRowId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      await onCreate(newName.trim());
      setNewName("");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(row: SettingsRow, active: boolean) {
    setBusyRowId(row.id);
    try {
      await onToggleActive(row, active);
    } finally {
      setBusyRowId(null);
    }
  }

  async function handleDelete(row: SettingsRow) {
    setBusyRowId(row.id);
    try {
      await onDelete(row);
    } finally {
      setBusyRowId(null);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-300">{description}</p>

      <Card className="p-6">
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium text-ink-700">Add custom entry</label>
            <Input
              placeholder="e.g. Vendor Exception"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            {newName.trim() && (
              <p className="text-xs text-ink-300">
                Will be saved as <span className="font-mono">{previewCode(newName)}</span>
              </p>
            )}
          </div>
          <Button type="submit" disabled={creating || !newName.trim()}>
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
          <p className="text-sm text-ink-300">Nothing here yet.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex flex-col gap-3 rounded-2xl border border-haze-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-ink-900">{row.label ?? row.code}</p>
                  <p className="text-xs text-ink-300">{row.code}</p>
                </div>
                <div className="flex items-center gap-3">
                  {row.is_reserved ? (
                    <Badge variant="ink">Reserved</Badge>
                  ) : (
                    <>
                      <Switch
                        checked={row.active}
                        disabled={busyRowId === row.id}
                        onCheckedChange={(checked) => handleToggle(row, checked)}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={busyRowId === row.id}
                        onClick={() => handleDelete(row)}
                      >
                        Delete
                      </Button>
                    </>
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
