import type { LucideIcon } from "lucide-react";
import { ListChecks, ShieldCheck, FileText, Users } from "lucide-react";
import type { MembershipRole } from "@/lib/api";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  /** Omit to show to every role. */
  roles?: MembershipRole[];
};

const ADMIN_ROLES: MembershipRole[] = ["ADMIN", "OWNER"];

export const primaryNav: NavItem[] = [
  {
    label: "Decisions",
    href: "/",
    icon: ListChecks,
    description: "Decision feed and review",
  },
  {
    label: "Reports",
    href: "/reports",
    icon: FileText,
    description: "AI-compiled decision.md per context",
  },
];

export const secondaryNav: NavItem[] = [
  {
    label: "Team",
    href: "/team",
    icon: Users,
    description: "Roster and pending approvals",
    roles: ADMIN_ROLES,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: ShieldCheck,
    description: "Decision types & context categories",
    roles: ADMIN_ROLES,
  },
];
