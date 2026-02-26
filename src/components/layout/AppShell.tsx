"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user && pathname !== "/") {
      router.replace("/");
    }
  }, [user, loading, pathname, router]);

  const handleMenuToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  if (!loading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-haze-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-400 border-t-transparent" />
          <p className="text-sm text-ink-300">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-haze-50">
      {/* Subtle grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-grid-lines opacity-40" />

      <div className="relative flex min-h-screen">
        <Sidebar open={sidebarOpen} onClose={handleSidebarClose} />

        {/* Main area */}
        <div className="flex flex-1 flex-col">
          <Topbar onMenuToggle={handleMenuToggle} />

          {/* Page content */}
          <main className="flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
