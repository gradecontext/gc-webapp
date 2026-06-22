"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  Building2,
  Check,
  ChevronDown,
  LogIn,
  LogOut,
  Menu,
  User,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { AuthModal } from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "@/lib/api";

interface TopbarProps {
  onMenuToggle: () => void;
  minimal?: boolean;
  transparent?: boolean;
  className?: string;
}

export function Topbar({ onMenuToggle, minimal, transparent, className }: TopbarProps) {
  const {
    user,
    backendUser,
    loading,
    signOut,
    session,
    memberships,
    activeMembership,
    setActiveClientId,
  } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"sign-in" | "register">(
    "sign-in"
  );
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const accessToken = session?.access_token;
  const clientId = activeMembership?.client.id;

  const refreshNotifications = useCallback(async () => {
    if (!accessToken) return;
    try {
      const list = await listNotifications({ accessToken, clientId });
      setNotifications(list);
    } catch {
      setNotifications([]);
    }
  }, [accessToken, clientId]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  async function handleMarkRead(id: string) {
    if (!accessToken) return;
    await markNotificationRead(id, { accessToken, clientId });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  async function handleMarkAllRead() {
    if (!accessToken) return;
    await markAllNotificationsRead({ accessToken, clientId });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function openLogin() {
    setAuthModalTab("sign-in");
    setAuthModalOpen(true);
  }

  function openRegister() {
    setAuthModalTab("register");
    setAuthModalOpen(true);
  }

  const isAuthenticated = !!user;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const activeOrgs = memberships.filter((m) => m.status === "ACTIVE");
  const displayName =
    backendUser?.name ??
    backendUser?.display_name ??
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "Account";

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-30 flex items-center gap-4 px-4 py-3 transition-[background-color,border-color,backdrop-filter] duration-300 sm:px-6",
          scrolled
            ? "border-b border-white/60 bg-white/70 backdrop-blur-xl"
            : transparent
              ? "border-b border-transparent bg-transparent"
              : "border-b border-transparent bg-haze-50",
          className
        )}
      >
        {minimal ? (
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logos/context-grade-logo.png"
              alt="ContextGrade"
              width={140}
              height={36}
              className="h-8 w-auto"
              priority
            />
          </Link>
        ) : (
          <button
            onClick={onMenuToggle}
            className="rounded-xl p-2 text-ink-400 transition hover:bg-haze-100 hover:text-ink-700 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-full bg-haze-100" />
          ) : isAuthenticated ? (
            <>
              {activeOrgs.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-700 transition hover:bg-haze-100">
                      <Building2 className="h-4 w-4 text-ink-400" />
                      <span className="hidden max-w-[140px] truncate sm:inline">
                        {activeMembership?.client.name ?? "Select organization"}
                      </span>
                      <ChevronDown className="h-4 w-4 text-ink-300" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {activeOrgs.map((m) => (
                      <DropdownMenuItem
                        key={m.client.id}
                        onClick={() => setActiveClientId(m.client.id)}
                      >
                        {m.client.id === activeMembership?.client.id && (
                          <Check className="h-4 w-4" />
                        )}
                        <span className={cn(m.client.id !== activeMembership?.client.id && "ml-6")}>
                          {m.client.name}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="relative rounded-xl p-2.5 text-ink-400 transition hover:bg-haze-100 hover:text-ink-700"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gradient-accent shadow-sm" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="flex items-center justify-between px-3 py-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-300">
                      Notifications
                    </p>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs font-medium text-accent-600 hover:text-accent-700"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <p className="px-3 py-4 text-center text-sm text-ink-300">
                      No notifications yet.
                    </p>
                  ) : (
                    <div className="max-h-80 space-y-1 overflow-y-auto">
                      {notifications.map((n) => (
                        <DropdownMenuItem
                          key={n.id}
                          onClick={() => !n.read && handleMarkRead(n.id)}
                          className={cn("flex-col items-start gap-0.5", !n.read && "bg-accent-50")}
                        >
                          <p className="text-sm font-semibold text-ink-900">{n.title}</p>
                          <p className="text-sm text-ink-700">{n.message}</p>
                          <p className="text-xs text-ink-300">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-ink-400 transition hover:bg-haze-100 hover:text-ink-700">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-accent text-white shadow-sm">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="hidden text-sm font-medium text-ink-700 sm:inline">
                      {displayName}
                    </span>
                    <ChevronDown className="hidden h-4 w-4 text-ink-300 sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    className="cursor-pointer text-ember-500 focus:text-ember-600"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={openLogin}>
                <LogIn className="mr-1.5 h-4 w-4" />
                Login
              </Button>
              <Button size="sm" onClick={openRegister}>
                <UserPlus className="mr-1.5 h-4 w-4" />
                Register
              </Button>
            </>
          )}
        </div>
      </header>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultTab={authModalTab}
      />
    </>
  );
}
