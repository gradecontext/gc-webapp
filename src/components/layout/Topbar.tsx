"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  ChevronDown,
  LogIn,
  LogOut,
  Menu,
  Search,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopbarProps {
  onMenuToggle: () => void;
  minimal?: boolean;
  transparent?: boolean;
  className?: string;
}

export function Topbar({ onMenuToggle, minimal, transparent, className }: TopbarProps) {
  const { user, backendUser, loading, signOut } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"sign-in" | "register">(
    "sign-in"
  );
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!transparent) return;

    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [transparent]);

  function openLogin() {
    setAuthModalTab("sign-in");
    setAuthModalOpen(true);
  }

  function openRegister() {
    setAuthModalTab("register");
    setAuthModalOpen(true);
  }

  const isAuthenticated = !!user;
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
          transparent && !scrolled
            ? "border-b border-transparent bg-transparent"
            : "border-b border-white/60 bg-white/70 backdrop-blur-xl",
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

        {minimal ? (
          <div className="flex-1" />
        ) : (
          <div className="relative flex flex-1 items-center">
            <Search className="absolute left-3 h-4 w-4 text-ink-300" />
            <input
              type="text"
              placeholder="Search decisions, contexts, signals…"
              className="h-10 w-full max-w-md rounded-xl border border-haze-200 bg-white/80 pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-300 transition focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400/30"
            />
          </div>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-full bg-haze-100" />
          ) : isAuthenticated ? (
            <>
              <button
                className="relative rounded-xl p-2.5 text-ink-400 transition hover:bg-haze-100 hover:text-ink-700"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gradient-accent shadow-sm" />
              </button>

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
