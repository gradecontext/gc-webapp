"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { primaryNav, secondaryNav } from "./navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  className?: string;
}

export function Sidebar({ open, onClose, className }: SidebarProps) {
  const pathname = usePathname();
  const { activeMembership } = useAuth();
  const role = activeMembership?.role;

  const visibleSecondaryNav = secondaryNav.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  );

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-2">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logos/context-grade-logo.png"
            alt="ContextGrade"
            width={160}
            height={40}
            className="h-9 w-auto"
            priority
          />
        </Link>

        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="rounded-xl p-2 text-ink-400 transition hover:bg-haze-100 hover:text-ink-700 lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation — scrollable area */}
      <div className="sidebar-scroll -mx-2 flex-1 overflow-y-auto px-2">
        <div className="space-y-8 pb-6">
          {/* Core section */}
          <div className="space-y-3">
            <p className="section-title px-3">Core</p>
            <nav className="space-y-1">
              {primaryNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-start gap-3 rounded-2xl border border-transparent px-3 py-3 transition",
                      isActive
                        ? "border-accent-200 bg-accent-50 shadow-sm"
                        : "hover:border-haze-200 hover:bg-haze-100",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 rounded-xl p-2 transition",
                        isActive
                          ? "bg-gradient-accent text-white shadow-sm"
                          : "bg-haze-100 text-ink-700 group-hover:bg-white",
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          isActive ? "text-accent-700" : "text-ink-900",
                        )}
                      >
                        {item.label}
                      </p>
                      <p className="text-xs text-ink-300">{item.description}</p>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Operations section */}
          {visibleSecondaryNav.length > 0 && (
          <div className="space-y-3">
            <p className="section-title px-3">Operations</p>
            <nav className="space-y-1">
              {visibleSecondaryNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-start gap-3 rounded-2xl border border-transparent px-3 py-3 transition",
                      isActive
                        ? "border-accent-200 bg-accent-50 shadow-sm"
                        : "hover:border-haze-200 hover:bg-haze-100",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 rounded-xl p-2 transition",
                        isActive
                          ? "bg-gradient-accent text-white shadow-sm"
                          : "bg-haze-100 text-ink-700 group-hover:bg-white",
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          isActive ? "text-accent-700" : "text-ink-900",
                        )}
                      >
                        {item.label}
                      </p>
                      <p className="text-xs text-ink-300">{item.description}</p>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
          )}
        </div>
      </div>

      {/* Bottom accent bar */}
      <div className="mx-2 h-1 rounded-full bg-gradient-accent opacity-40" />
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:gap-6 lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:shrink-0 lg:border-r lg:border-white/70 lg:bg-white/70 lg:p-6 lg:backdrop-blur-xl",
          className,
        )}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile overlay ── */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          open ? "visible" : "invisible",
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-ink-900/30 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Drawer */}
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 flex-col gap-6 border-r border-white/70 bg-white/95 p-6 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  );
}
