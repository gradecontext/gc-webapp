"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/providers/AuthProvider";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  approveMembership,
  changeMembershipRole,
  getClientRoster,
  rejectMembership,
  removeMembership,
  type MembershipRole,
  type MembershipStatus,
  type RosterMember,
} from "@/lib/api";

const ROLE_OPTIONS: MembershipRole[] = ["ADMIN", "STAFF"];
const STATUS_OPTIONS: MembershipStatus[] = ["ACTIVE", "PENDING", "REJECTED", "REMOVED"];

const STATUS_VARIANT: Record<MembershipStatus, BadgeProps["variant"]> = {
  ACTIVE: "mint",
  PENDING: "haze",
  REJECTED: "ember",
  REMOVED: "ink",
};

export default function TeamPage() {
  const { session, activeMembership } = useAuth();
  const accessToken = session?.access_token;
  const clientId = activeMembership?.client.id;
  const role = activeMembership?.role;
  const isAdmin = role === "ADMIN";

  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [removeTarget, setRemoveTarget] = useState<RosterMember | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || !clientId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await getClientRoster(
        clientId,
        { status: statusFilter || undefined },
        { accessToken, clientId }
      );
      setRoster(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }, [accessToken, clientId, statusFilter]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  async function handleApprove(member: RosterMember) {
    if (!accessToken || !clientId) return;
    setBusyId(member.id);
    setError(null);
    try {
      await approveMembership(member.id, { accessToken, clientId });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve member");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(member: RosterMember) {
    if (!accessToken || !clientId) return;
    setBusyId(member.id);
    setError(null);
    try {
      await rejectMembership(member.id, { accessToken, clientId });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject member");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRoleChange(member: RosterMember, newRole: MembershipRole) {
    if (!accessToken || !clientId) return;
    setBusyId(member.id);
    setError(null);
    try {
      await changeMembershipRole(member.id, newRole, { accessToken, clientId });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change role");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove() {
    if (!accessToken || !clientId || !removeTarget) return;
    setBusyId(removeTarget.id);
    setError(null);
    try {
      await removeMembership(removeTarget.id, { accessToken, clientId });
      setRemoveTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setBusyId(null);
    }
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <Card className="p-6">
          <p className="text-sm text-ink-300">Only admins can manage the team.</p>
        </Card>
      </AppShell>
    );
  }

  const pending = roster.filter((m) => m.status === "PENDING");

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <p className="section-title">Team</p>
          <h1 className="text-3xl font-semibold text-ink-900">Roster & approvals</h1>
          <p className="text-sm text-ink-300">A view of who can act on decisions, not of their activity.</p>
        </div>

        {pending.length > 0 && (
          <Card className="p-6">
            <p className="section-title">Pending approval</p>
            <div className="mt-4 space-y-3">
              {pending.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col gap-3 rounded-2xl border border-haze-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      {member.user?.name ?? member.user?.email ?? "Unknown"}
                    </p>
                    <p className="text-xs text-ink-300">{member.user?.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={busyId === member.id} onClick={() => handleApprove(member)}>
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busyId === member.id}
                      onClick={() => handleReject(member)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="flex flex-wrap gap-3">
          <Select
            value={statusFilter || "all"}
            onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="rounded-2xl bg-ember-50 px-4 py-3 text-sm text-ember-600">{error}</div>
        )}

        <Card className="p-6">
          {loading ? (
            <p className="text-sm text-ink-300">Loading…</p>
          ) : roster.length === 0 ? (
            <p className="text-sm text-ink-300">No members match this filter.</p>
          ) : (
            <div className="space-y-3">
              {roster.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col gap-3 rounded-2xl border border-haze-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      {member.user?.name ?? member.user?.email ?? "Unknown"}
                    </p>
                    <p className="text-xs text-ink-300">{member.user?.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={STATUS_VARIANT[member.status] ?? "haze"}>{member.status}</Badge>
                    <Select
                      value={member.role}
                      disabled={busyId === member.id}
                      onValueChange={(v) => handleRoleChange(member, v as MembershipRole)}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busyId === member.id}
                      onClick={() => setRemoveTarget(member)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Dialog open={removeTarget !== null} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove member</DialogTitle>
            <DialogDescription>
              {removeTarget &&
                `Remove ${removeTarget.user?.name ?? removeTarget.user?.email ?? "this member"} from this organization? This can't be undone from here.`}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" disabled={busyId === removeTarget?.id} onClick={handleRemove}>
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
