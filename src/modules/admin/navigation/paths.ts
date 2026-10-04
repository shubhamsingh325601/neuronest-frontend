// The Admin app is served from `/admin/*` internally, but users see paths without the prefix
// (proxy rewrite, plan 0001 §3). `usePathname()` may return either form depending on how the page was
// reached, so everything that compares paths normalises first.
export function normalizeAdminPath(pathname: string): string {
  const stripped = pathname === "/admin" ? "/" : pathname.startsWith("/admin/") ? pathname.slice("/admin".length) : pathname;
  return stripped.length > 1 && stripped.endsWith("/") ? stripped.slice(0, -1) : stripped;
}

/** Exact match for the root, segment-prefix match for everything else (`/users` matches `/users/42`). */
export function isPathActive(href: string, pathname: string): boolean {
  const path = normalizeAdminPath(pathname);
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`);
}
