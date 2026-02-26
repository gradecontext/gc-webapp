"use client";

import { useCallback, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className="relative min-h-screen bg-haze-50">
      {/* Subtle grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-grid-lines opacity-40" />

      <div className="relative flex min-h-screen">
        {/* Sidebar — sticky on desktop, drawer on mobile */}
        <Sidebar open={sidebarOpen} onClose={handleSidebarClose} />

        {/* Main area */}
        <div className="flex flex-1 flex-col">
          {/* Sticky top bar */}
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
