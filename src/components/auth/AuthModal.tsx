"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AuthContent } from "./AuthContent";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "sign-in" | "register";
}

export function AuthModal({
  open,
  onOpenChange,
  defaultTab = "sign-in",
}: AuthModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        {/* Visually hidden — Radix Dialog requires a title for screen reader accessibility */}
        <DialogTitle className="sr-only">Sign in to ContextGrade</DialogTitle>
        <DialogDescription className="sr-only">
          Sign in or create a ContextGrade workspace.
        </DialogDescription>
        <AuthContent
          defaultTab={defaultTab}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
