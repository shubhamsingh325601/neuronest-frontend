import { adminPath } from "../paths";

// One registry for every route (plan 0001 §11). Pages never declare their own breadcrumbs.
// Patterns use `:param` segments for dynamic routes; dynamic labels (child names, ...) arrive with the
// features that need them, via a `<DynamicCrumb>` that shares the page's query cache.
interface RouteEntry {
  pattern: string;
  label: string;
  /** Pattern of the parent route (must itself be registered). Omitted for the root. */
  parent?: string;
}

export const BREADCRUMB_ROUTES: RouteEntry[] = [
  { pattern: adminPath(), label: "Dashboard" },
  { pattern: adminPath("/clinicians"), label: "Clinicians", parent: adminPath() },
  { pattern: adminPath("/users"), label: "Users", parent: adminPath() },
  { pattern: adminPath("/children"), label: "Children", parent: adminPath() },
  { pattern: adminPath("/plan-templates"), label: "Plan templates", parent: adminPath() },
  { pattern: adminPath("/system"), label: "System", parent: adminPath() },
  { pattern: adminPath("/help"), label: "Help", parent: adminPath() },
  { pattern: adminPath("/settings"), label: "Settings", parent: adminPath() },
  { pattern: adminPath("/profile"), label: "Profile", parent: adminPath() },
  { pattern: adminPath("/login"), label: "Sign in" },
];

export interface Crumb {
  label: string;
  /** Concrete URL for this crumb (params filled in from the current path). */
  href: string;
  current: boolean;
}

function matches(pattern: string, path: string): boolean {
  const p = pattern.split("/").filter(Boolean);
  const s = path.split("/").filter(Boolean);
  return p.length === s.length && p.every((seg, i) => seg.startsWith(":") || seg === s[i]);
}

/** Resolves the breadcrumb trail for a pathname. Returns [] for unregistered paths. */
export function resolveBreadcrumbs(pathname: string): Crumb[] {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const segments = path.split("/").filter(Boolean);
  let entry = BREADCRUMB_ROUTES.find((route) => matches(route.pattern, path));
  if (!entry) return [];

  const trail: Crumb[] = [];
  let depth = entry.pattern.split("/").filter(Boolean).length;
  let current = true;
  while (entry) {
    trail.unshift({ label: entry.label, href: ["", ...segments.slice(0, depth)].join("/"), current });
    const parent: string | undefined = entry.parent;
    entry = parent ? BREADCRUMB_ROUTES.find((route) => route.pattern === parent) : undefined;
    depth = entry ? entry.pattern.split("/").filter(Boolean).length : 0;
    current = false;
  }
  return trail;
}
