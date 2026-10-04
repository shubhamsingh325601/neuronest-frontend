import { adminPath, isPathActive } from "./paths";
import {
  Activity,
  Baby,
  ClipboardList,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";

// PERMANENT config (plan 0001 §18). Only each item's `status` is temporary: it flips from "placeholder"
// to "live" in the milestone that builds the page.
export type NavStatus = "live" | "placeholder";
export type NavBadgeKey = "invitedClinicians";

export interface NavLeaf {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  status: NavStatus;
  badgeKey?: NavBadgeKey;
}

export interface NavParent {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Path prefix shared by the children; used to open the submenu and mark the parent active. */
  prefix: string;
  children: NavLeaf[];
}

export type NavItem = NavLeaf | NavParent;

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export function isNavParent(item: NavItem): item is NavParent {
  return "children" in item;
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "main",
    label: "Main menu",
    items: [
      { id: "dashboard", label: "Dashboard", href: adminPath(), icon: LayoutDashboard, status: "live" },
      { id: "clinicians", label: "Clinicians", href: adminPath("/clinicians"), icon: Stethoscope, status: "placeholder" },
      { id: "users", label: "Users", href: adminPath("/users"), icon: Users, status: "placeholder" },
      { id: "children", label: "Children", href: adminPath("/children"), icon: Baby, status: "placeholder" },
      { id: "plan-templates", label: "Plan templates", href: adminPath("/plan-templates"), icon: ClipboardList, status: "placeholder" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [{ id: "system", label: "System", href: adminPath("/system"), icon: Activity, status: "live" }],
  },
  {
    id: "support",
    label: "Help & settings",
    items: [
      { id: "help", label: "Help", href: adminPath("/help"), icon: LifeBuoy, status: "placeholder" },
      { id: "settings", label: "Settings", href: adminPath("/settings"), icon: Settings, status: "placeholder" },
    ],
  },
];

/** Every navigable leaf, in display order. */
export function flattenNav(groups: NavGroup[] = NAV_GROUPS): NavLeaf[] {
  return groups.flatMap((group) => group.items.flatMap((item) => (isNavParent(item) ? item.children : [item])));
}

/** The single leaf that owns a path: the longest matching href wins (so a nested `/children/x/plans` route is not also `/children`). */
export function findActiveLeaf(pathname: string): NavLeaf | undefined {
  return flattenNav()
    .filter((leaf) => isPathActive(leaf.href, pathname))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
