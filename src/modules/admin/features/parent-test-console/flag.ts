// parent-console: the one switch for the temporary Parent test console (plan 0003). Everything that exposes it
// (nav item, route, BFF allowlist entry, CSP origin) asks here, so flipping the variable off removes all of it.
//
// `process.env.NEXT_PUBLIC_*` must be written out in full so Next inlines the value; both variables are pinned
// in next.config.ts. Read at call time (not at import) so tests can stub them.

/** `NEXT_PUBLIC_ADMIN_PARENT_CONSOLE=1` turns the console on. Anything else is off. */
export function isParentConsoleEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ADMIN_PARENT_CONSOLE === "1";
}

/**
 * The backend origin the browser calls directly. next.config.ts copies the server's `API_BASE_URL` into
 * `NEXT_PUBLIC_ADMIN_PARENT_CONSOLE_API_URL` (an internal, derived name; do not set it) while the console is on.
 * Reduced to `scheme://host[:port]`. Null when empty or not an http(s) URL, in which case the console shows a
 * configuration message and the CSP gets no extra origin.
 */
export function parentConsoleApiOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_ADMIN_PARENT_CONSOLE_API_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

/** Extra `connect-src` origins the console needs: the backend origin, only while the console is on. */
export function parentConsoleConnectSrc(): string[] {
  const origin = isParentConsoleEnabled() ? parentConsoleApiOrigin() : null;
  return origin ? [origin] : [];
}
