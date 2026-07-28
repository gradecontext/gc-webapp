"use client";

import { useEffect, useState } from "react";
import { Download, PlayCircle } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { listDecisions } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DISMISSED_STORAGE_KEY = "cg_extension_installed";

const EXTENSION_URL =
  "https://chromewebstore.google.com/detail/contextgrade-turn-decisio/lpojjgoghdibdlakmkjebeejoilompnb";

const DEMO_VIDEO_URL =
  "https://oogwlxlnpiolumozfkob.supabase.co/storage/v1/object/public/contextgrade-website-artifacts/contextgrade-porduct-demo-full-video.MP4";

/**
 * Nudges a signed-in user to install the Chrome extension — the only surface
 * that actually captures decisions (see CLAUDE.md "How Decisions Get Into
 * the System"). A client/user with >1 logged decision is already using the
 * extension (or another capture path), so the prompt stops appearing on its
 * own once that's true. Until then it reappears on every load unless the
 * user explicitly says they've already installed it — that choice is the
 * only thing persisted to localStorage; a plain "Cancel" is a snooze, not a
 * dismissal.
 */
export function InstallExtensionPrompt() {
  const { backendUser, needsRegistration, session, memberships, activeMembership } = useAuth();
  const [open, setOpen] = useState(false);
  const [dismissedForGood, setDismissedForGood] = useState(true);

  useEffect(() => {
    setDismissedForGood(localStorage.getItem(DISMISSED_STORAGE_KEY) === "true");
  }, []);

  const hasActiveMembership = memberships.some((m) => m.status === "ACTIVE");
  const accessToken = session?.access_token;

  useEffect(() => {
    if (dismissedForGood) return;
    if (needsRegistration || !backendUser || !hasActiveMembership) return;
    if (!accessToken || !activeMembership) return;

    let cancelled = false;

    listDecisions(
      { limit: 1 },
      { accessToken, clientId: activeMembership.client.id }
    )
      .then(({ total }) => {
        if (!cancelled && total <= 1) setOpen(true);
      })
      .catch(() => {
        // Backend hiccup — don't nag with a modal on top of whatever else
        // failed. It'll just get checked again next load.
      });

    return () => {
      cancelled = true;
    };
  }, [dismissedForGood, needsRegistration, backendUser, hasActiveMembership, accessToken, activeMembership]);

  function handleAlreadyInstalled() {
    localStorage.setItem(DISMISSED_STORAGE_KEY, "true");
    setDismissedForGood(true);
    setOpen(false);
  }

  if (dismissedForGood || !open) return null;

  return (
    <Dialog open onOpenChange={(next) => !next && setOpen(false)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-300">
            ContextGrade
          </p>
          <DialogTitle>Install the Chrome extension to get started</DialogTitle>
          <DialogDescription>
            Decisions are captured where you make them — in Figma, Jira, HubSpot, Salesforce,
            or any other tab. The extension records the decision and the reasoning behind it in
            one click, right from the page you&apos;re on.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          <a href={EXTENSION_URL} target="_blank" rel="noopener noreferrer" className="block">
            <Button className="w-full gap-2 bg-gradient-accent text-white shadow-glow-accent transition hover:brightness-90">
              <Download className="h-4 w-4" />
              Get the Chrome extension
            </Button>
          </a>

          <div className="overflow-hidden rounded-2xl border border-haze-200 bg-haze-100">
            <video
              autoPlay
              muted
              loop
              playsInline
              controls
              preload="auto"
              className="aspect-video w-full"
              src={DEMO_VIDEO_URL}
            >
              <a href={DEMO_VIDEO_URL} className="text-accent-600 underline">
                Watch the demo video
              </a>
            </video>
          </div>

          <a
            href={DEMO_VIDEO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-ink-300 hover:text-ink-500"
          >
            <PlayCircle className="h-3.5 w-3.5" />
            Video not playing? Open it directly.
          </a>
        </div>

        <div className="mt-4 flex justify-end gap-3 border-t border-haze-200 pt-4">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleAlreadyInstalled}>
            I already installed it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
