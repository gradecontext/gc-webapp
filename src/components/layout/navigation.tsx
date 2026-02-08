import type { LucideIcon } from "lucide-react";
import {
  Bolt,
  ShieldCheck,
  Layers,
  Settings,
  Users,
  MessageCircle,
  Workflow
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export const primaryNav: NavItem[] = [
  {
    label: "Decision Queue",
    href: "/",
    icon: Bolt,
    description: "Live decisions needing review"
  },
  {
    label: "Decision Trace",
    href: "/decisions",
    icon: Layers,
    description: "Searchable precedent library"
  },
  {
    label: "Contexts",
    href: "/contexts",
    icon: Workflow,
    description: "Decision domains and policies"
  },
  {
    label: "Signals",
    href: "/signals",
    icon: MessageCircle,
    description: "Source health and provenance"
  }
];

export const secondaryNav: NavItem[] = [
  {
    label: "People & Roles",
    href: "/settings/roles",
    icon: Users,
    description: "Approvers and escalation chains"
  },
  {
    label: "Security",
    href: "/settings/security",
    icon: ShieldCheck,
    description: "API keys and auth"
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Tenant preferences"
  }
];
