// The Admin app is served at `/admin` on the same origin as the landing site (plan 0002). Every admin path
// in code is the full browser path, built here, so what is in the address bar is what is in the code.

export const ADMIN_BASE = "/admin";

/** `adminPath("/users")` -> `/admin/users`; `adminPath()` -> `/admin`. Query strings pass through. */
export function adminPath(sub = "/"): string {
  return sub === "/" ? ADMIN_BASE : `${ADMIN_BASE}${sub}`;
}

export const ADMIN_ROUTES = {
  home: adminPath(),
  clinicians: adminPath("/clinicians"),
  users: adminPath("/users"),
  children: adminPath("/children"),
  planTemplates: adminPath("/plan-templates"),
  system: adminPath("/system"),
  profile: adminPath("/profile"),
  settings: adminPath("/settings"),
  login: adminPath("/login"),
  forgotPassword: adminPath("/forgot-password"),
  resetPassword: adminPath("/reset-password"),
  completeAccountSetup: adminPath("/complete-account-setup"),
  sessionError: adminPath("/session-error"),
  authRefresh: adminPath("/api/auth/refresh"),
  sessionEnded: adminPath("/api/auth/session-ended"),
  backendBase: adminPath("/api/backend"),
} as const;

/** Decodes, collapses repeated slashes and lower-cases a path for *matching only* (`/%61dmin`, `//admin`, `/ADMIN`). */
export function normalizeForMatch(pathname: string): string {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // Malformed escape: match on the raw path.
  }
  const collapsed = decoded.replace(/\/{2,}/g, "/").toLowerCase();
  return collapsed.length > 1 ? collapsed.replace(/\/$/, "") : collapsed;
}

/** True for `/admin` and anything under it (whole segments: `/adminx` is not admin). */
export function isAdminPath(pathname: string): boolean {
  const path = normalizeForMatch(pathname);
  return path === ADMIN_BASE || path.startsWith(`${ADMIN_BASE}/`);
}

/** Exact match for the dashboard root, segment-prefix match for everything else (`/admin/users` matches `/admin/users/42`). */
export function isPathActive(href: string, pathname: string): boolean {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (href === ADMIN_BASE) return path === ADMIN_BASE;
  return path === href || path.startsWith(`${href}/`);
}
