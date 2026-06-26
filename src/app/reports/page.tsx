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
  generateAiReport,
  getAiReport,
  listAiReports,
  listContextCategories,
  type AiDecisionReport,
  type AiReportStatus,
  type ClientContextCategory,
} from "@/lib/api";

const STATUS_OPTIONS: AiReportStatus[] = ["PENDING", "GENERATING", "COMPLETED", "FAILED"];

const STATUS_VARIANT: Record<AiReportStatus, BadgeProps["variant"]> = {
  PENDING: "haze",
  GENERATING: "haze",
  COMPLETED: "mint",
  FAILED: "ember",
};

function slugify(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function ReportsPage() {
  const { session, activeMembership } = useAuth();
  const accessToken = session?.access_token;
  const clientId = activeMembership?.client.id;

  const [categories, setCategories] = useState<ClientContextCategory[]>([]);
  const [reports, setReports] = useState<AiDecisionReport[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingCategoryId, setGeneratingCategoryId] = useState<string | null>(null);

  const [selected, setSelected] = useState<AiDecisionReport | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!accessToken || !clientId) return;
    listContextCategories({ accessToken, clientId })
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [accessToken, clientId]);

  const loadReports = useCallback(async () => {
    if (!accessToken || !clientId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await listAiReports(
        { category_id: categoryFilter || undefined, status: statusFilter || undefined },
        { accessToken, clientId }
      );
      setReports(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [accessToken, clientId, categoryFilter, statusFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  async function handleGenerate(categoryId: string) {
    if (!accessToken || !clientId) return;
    setGeneratingCategoryId(categoryId);
    setError(null);
    try {
      const report = await generateAiReport(categoryId, { accessToken, clientId });
      await loadReports();
      setSelected(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setGeneratingCategoryId(null);
    }
  }

  async function handleSelect(report: AiDecisionReport) {
    if (!accessToken || !clientId) return;
    setSelectedLoading(true);
    try {
      const full = await getAiReport(report.id, { accessToken, clientId });
      setSelected(full);
    } catch {
      setSelected(report);
    } finally {
      setSelectedLoading(false);
    }
  }

  function handlePublicLink() {
    if (!selected) return;
    const url = `${window.location.origin}/decision/context/reports/${selected.id}.md`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function handleDownload() {
    if (!selected?.content) return;
    const base = selected.title ?? `${selected.category_id}-${selected.id}`;
    const filename = `${slugify(base)}.md`;
    const blob = new Blob([selected.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <p className="section-title">AI Decision Reports</p>
          <h1 className="text-3xl font-semibold text-ink-900">context.md, compiled on demand</h1>
          <p className="text-sm text-ink-300">
            Every decision under a context category, compiled into one Markdown document you can
            feed back into any AI tool as organizational context.
          </p>
        </div>

        <div className="rounded-2xl border border-haze-200 bg-white px-4 py-3 text-sm text-ink-300">
          Reports compile from decisions tagged with a context category at creation time. If a
          report shows zero decisions, it&apos;s likely because nothing has been logged with a &nbsp;
          <span className="font-mono">context_key</span> yet.
        </div>

        <Card className="p-6">
          <p className="section-title">Generate a report</p>
          {categories.length === 0 ? (
            <p className="mt-3 text-sm text-ink-300">No context categories yet.</p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((c) => (
                <Button
                  key={c.id}
                  variant="secondary"
                  size="sm"
                  disabled={generatingCategoryId !== null}
                  onClick={() => handleGenerate(c.id)}
                >
                  {generatingCategoryId === c.id
                    ? "Generating…"
                    : `Generate · ${c.label ?? c.category}`}
                </Button>
              ))}
            </div>
          )}
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Select
                value={categoryFilter || "all"}
                onValueChange={(v) => setCategoryFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label ?? c.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <Card className="p-4">
              {loading ? (
                <p className="p-2 text-sm text-ink-300">Loading…</p>
              ) : reports.length === 0 ? (
                <p className="p-2 text-sm text-ink-300">No reports yet.</p>
              ) : (
                <div className="space-y-2">
                  {reports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => handleSelect(report)}
                      className="flex w-full flex-col gap-2 rounded-2xl border border-haze-200 bg-white px-4 py-3 text-left transition hover:bg-haze-50 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-ink-900">
                          {report.title ?? report.id}
                        </p>
                        <p className="text-xs text-ink-300">
                          {new Date(report.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANT[report.status] ?? "haze"}>
                        {report.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card className="p-6">
            {selectedLoading ? (
              <p className="text-sm text-ink-300">Loading report…</p>
            ) : !selected ? (
              <p className="text-sm text-ink-300">Select a report to view its contents.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-ink-900">
                      {selected.title ?? selected.id}
                    </h2>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge variant={STATUS_VARIANT[selected.status] ?? "haze"}>
                        {selected.status}
                      </Badge>
                      {selected.agent_model && (
                        <Badge variant="mint">AI Insights · {selected.agent_model}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={selected.status !== "COMPLETED"}
                      onClick={handlePublicLink}
                    >
                      {linkCopied ? "Link copied" : "Copy public link"}
                    </Button>
                    <Button size="sm" disabled={!selected.content} onClick={handleDownload}>
                      Download .md
                    </Button>
                  </div>
                </div>
                {selected.content ? (
                  <pre className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-2xl bg-haze-100 p-4 text-xs text-ink-700">
                    {selected.content}
                  </pre>
                ) : (
                  <p className="text-sm text-ink-300">No content yet.</p>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
