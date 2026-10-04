/**
 * Host/path routing decisions for `src/proxy.ts`, kept free of Next internals so they can be unit tested.
 * Plan: docs/plans/0001-admin-app.md §3.
 */

/** Internal URL prefix under which the Admin app lives (`src/app/(admin)/admin`). */
export const ADMIN_PREFIX = "/admin";

/** Path a "hide this route" decision is rewritten to. It matches no real route, so the host's own 404 renders. */
export const NOT_FOUND_PATH = "/__not-found";

export const ADMIN_ROBOTS_TXT = "User-agent: *\nDisallow: /\n";

export type RouteDecision = { adminHost: boolean } & (
  | { action: "pass" }
  | { action: "rewrite"; pathname: string }
  | { action: "notFound" }
  | { action: "robots" }
);

/** Lower-cases, strips a trailing dot and the port (IPv6 literals included). */
function stripPort(host: string): string {
  const value = host.trim().toLowerCase();
  const withoutPort = value.startsWith("[")
    ? value.slice(0, value.indexOf("]") + 1)
    : value.replace(/:\d*$/, "");
  return withoutPort.replace(/\.$/, "");
}

/** Parses the comma-separated `ADMIN_HOSTS` env value into bare, lower-cased hostnames. */
export function parseAdminHosts(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map(stripPort)
    .filter(Boolean);
}

/**
 * True when `host` (a Host header value, port allowed) is an Admin host: listed in `adminHosts`,
 * or any `admin.*` name. A missing host is never an admin host.
 */
export function isAdminHost(host: string | null | undefined, adminHosts: string[] = []): boolean {
  if (!host) return false;
  const hostname = stripPort(host);
  return adminHosts.includes(hostname) || hostname.startsWith("admin.");
}

/**
 * Decodes, collapses repeated slashes and lower-cases a path for *matching only*, so that
 * `/%61dmin`, `//admin` and `/ADMIN` cannot slip past a prefix check. The original path is
 * what gets rewritten.
 */
function normalizeForMatch(pathname: string): string {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // Malformed escape: match on the raw path.
  }
  return decoded.replace(/\/{2,}/g, "/").toLowerCase();
}

function isUnder(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function decideRoute(input: {
  host: string | null | undefined;
  pathname: string;
  adminHosts?: string[];
}): RouteDecision {
  const { host, pathname, adminHosts = [] } = input;
  const adminHost = isAdminHost(host, adminHosts);
  const path = normalizeForMatch(pathname);

  if (!adminHost) {
    // Public host: the Admin tree must be unreachable, including its API handlers.
    if (isUnder(path, ADMIN_PREFIX) || isUnder(path, "/api/admin")) {
      return { adminHost, action: "notFound" };
    }
    return { adminHost, action: "pass" };
  }

  if (path === "/robots.txt") return { adminHost, action: "robots" };
  if (path === "/sitemap.xml") return { adminHost, action: "notFound" };
  // `/admin/*` is an internal prefix: never addressable by its literal name on the admin host.
  if (isUnder(path, ADMIN_PREFIX)) return { adminHost, action: "notFound" };

  return {
    adminHost,
    action: "rewrite",
    pathname: pathname === "/" ? ADMIN_PREFIX : `${ADMIN_PREFIX}${pathname}`,
  };
}
