"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/providers/AuthProvider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, Copy } from "lucide-react";
import { ApiError, getMcpKey } from "@/lib/api";
import { env } from "@/lib/env";

const MCP_ENDPOINT = `${env.apiBaseUrl}/mcp`;

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button size="sm" variant="secondary" onClick={handleCopy} className="shrink-0">
      {copied ? (
        <>
          <Check className="h-4 w-4" /> Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" /> Copy
        </>
      )}
    </Button>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="flex items-start gap-2">
      <pre className="max-h-80 flex-1 overflow-auto rounded-2xl bg-haze-100 p-4 text-xs text-ink-700">
        <code>{code}</code>
      </pre>
      <CopyButton value={code} />
    </div>
  );
}

export default function McpIntegrationPage() {
  const { session, activeMembership } = useAuth();
  const accessToken = session?.access_token;
  const clientId = activeMembership?.client.id;
  const isAdmin = activeMembership?.role === "ADMIN";

  const [mcpKey, setMcpKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken || !clientId) return;
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const res = await getMcpKey({ accessToken, clientId });
      setMcpKey(res.mcp_api_key);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setForbidden(true);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load MCP key");
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, clientId]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const key = mcpKey ?? "<MCP_KEY>";

  const claudeCodeCli = `claude mcp add --transport http contextgrade ${MCP_ENDPOINT} --header "X-API-Key: ${key}"`;

  const claudeCodeJson = `{
  "mcpServers": {
    "contextgrade": {
      "type": "http",
      "url": "${MCP_ENDPOINT}",
      "headers": {
        "X-API-Key": "${key}"
      }
    }
  }
}`;

  const claudeDesktopJson = `{
  "mcpServers": {
    "contextgrade": {
      "url": "${MCP_ENDPOINT}",
      "headers": {
        "X-API-Key": "${key}"
      }
    }
  }
}`;

  const cursorJson = `{
  "mcpServers": {
    "contextgrade": {
      "url": "${MCP_ENDPOINT}",
      "headers": {
        "X-API-Key": "${key}"
      }
    }
  }
}`;

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <p className="section-title">Settings</p>
          <h1 className="text-3xl font-semibold text-ink-900">MCP Integration</h1>
          <p className="text-sm text-ink-300">
            Give AI tools read-only access to your compiled AI Decision Reports via the Model
            Context Protocol.
          </p>
        </div>

        {!isAdmin || forbidden ? (
          <Card className="p-6">
            <p className="text-sm text-ink-300">Only admins can view the MCP integration key.</p>
          </Card>
        ) : loading ? (
          <Card className="p-6">
            <p className="text-sm text-ink-300">Loading…</p>
          </Card>
        ) : error ? (
          <Card className="p-6">
            <p className="text-sm text-ember-600">{error}</p>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <p className="section-title">Your MCP key</p>
                <Badge variant="mint">Read-only</Badge>
              </div>
              <p className="mt-2 text-sm text-ink-300">
                This key gives read-only access to your compiled AI Decision Reports for AI tools
                like Claude Code, Claude Desktop, ChatGPT, and Cursor. Keep it secret — anyone with
                this key can read your organization&apos;s decision reports. It&apos;s separate
                from any other API key ContextGrade issues and grants nothing beyond report access.
                There&apos;s no rotate/regenerate option yet.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <input
                  readOnly
                  value={mcpKey ?? "Not available"}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 rounded-2xl border border-haze-200 bg-haze-100 px-4 py-2.5 font-mono text-sm text-ink-900 focus:outline-none"
                />
                {mcpKey && <CopyButton value={mcpKey} />}
              </div>
            </Card>

            <Card className="p-6">
              <p className="section-title">Connect your AI tools</p>
              <p className="mt-2 text-sm text-ink-300">
                Endpoint <code className="rounded bg-haze-100 px-1.5 py-0.5">{MCP_ENDPOINT}</code>{" "}
                over Streamable HTTP, authenticated with an{" "}
                <code className="rounded bg-haze-100 px-1.5 py-0.5">X-API-Key</code> header.
              </p>

              <Tabs defaultValue="claude-code" className="mt-6">
                <TabsList>
                  <TabsTrigger value="claude-code">Claude Code</TabsTrigger>
                  <TabsTrigger value="claude-desktop">Claude Desktop</TabsTrigger>
                  <TabsTrigger value="cursor">Cursor</TabsTrigger>
                  <TabsTrigger value="chatgpt">ChatGPT</TabsTrigger>
                  <TabsTrigger value="generic">Generic</TabsTrigger>
                </TabsList>

                <TabsContent value="claude-code" className="space-y-4">
                  <p className="text-sm text-ink-700">Add via the CLI:</p>
                  <CodeBlock code={claudeCodeCli} />
                  <p className="text-sm text-ink-700">
                    Or via a <code className="rounded bg-haze-100 px-1.5 py-0.5">.mcp.json</code>{" "}
                    in your project (or{" "}
                    <code className="rounded bg-haze-100 px-1.5 py-0.5">~/.claude.json</code> for
                    user-level):
                  </p>
                  <CodeBlock code={claudeCodeJson} />
                </TabsContent>

                <TabsContent value="claude-desktop" className="space-y-4">
                  <p className="text-sm text-ink-700">
                    Claude Desktop&apos;s built-in Connectors UI generally expects OAuth for remote
                    servers rather than a static header. Use the config file instead — Settings →
                    Developer → Edit Config, which opens{" "}
                    <code className="rounded bg-haze-100 px-1.5 py-0.5">
                      claude_desktop_config.json
                    </code>
                    :
                  </p>
                  <CodeBlock code={claudeDesktopJson} />
                  <p className="text-sm text-ink-300">
                    Restart the app fully after saving. Whether your installed version of Claude
                    Desktop accepts a remote <code>url</code> + <code>headers</code> config (vs.
                    only local stdio servers) varies by version — check Claude Desktop&apos;s
                    current docs if this doesn&apos;t connect.
                  </p>
                </TabsContent>

                <TabsContent value="cursor" className="space-y-4">
                  <p className="text-sm text-ink-700">
                    Add to{" "}
                    <code className="rounded bg-haze-100 px-1.5 py-0.5">.cursor/mcp.json</code>{" "}
                    (project-level) or{" "}
                    <code className="rounded bg-haze-100 px-1.5 py-0.5">~/.cursor/mcp.json</code>{" "}
                    (global):
                  </p>
                  <CodeBlock code={cursorJson} />
                </TabsContent>

                <TabsContent value="chatgpt" className="space-y-4">
                  <p className="text-sm text-ink-300">
                    ChatGPT&apos;s MCP/connector support is more restrictive about custom headers
                    than Claude or Cursor today — most entry points currently expect OAuth for
                    remote connectors rather than a raw API-key header. Support for header-based
                    auth may arrive later; check ChatGPT&apos;s current connector documentation
                    before relying on this.
                  </p>
                </TabsContent>

                <TabsContent value="generic" className="space-y-4">
                  <p className="text-sm text-ink-700">
                    For any other MCP-compatible client, use these connection parameters:
                  </p>
                  <ul className="space-y-1 text-sm text-ink-700">
                    <li>
                      <span className="text-ink-300">Transport:</span> Streamable HTTP
                    </li>
                    <li>
                      <span className="text-ink-300">URL:</span>{" "}
                      <code className="rounded bg-haze-100 px-1.5 py-0.5">{MCP_ENDPOINT}</code>
                    </li>
                    <li>
                      <span className="text-ink-300">Header:</span>{" "}
                      <code className="rounded bg-haze-100 px-1.5 py-0.5">
                        X-API-Key: {key}
                      </code>
                    </li>
                  </ul>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
