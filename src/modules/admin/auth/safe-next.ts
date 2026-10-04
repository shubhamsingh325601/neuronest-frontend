import { ADMIN_BASE, ADMIN_ROUTES } from "../navigation/paths";

// Post-login / post-refresh redirect targets come from the URL, so they are validated: a same-origin path
// INSIDE the Admin app only (`/admin` or `/admin/...`), never a protocol-relative URL, a backslash trick,
// the landing site, or an auth / API route.

const MAX_LENGTH = 512;
const FALLBACK = ADMIN_BASE;
// Control characters, space, DEL and backslash.
const UNSAFE_CHARS = /[\u0000- \u007f\\]/;

// Admin paths that must never be a `next` target: they would loop or expose internals.
const BLOCKED = [
  ADMIN_ROUTES.login,
  ADMIN_ROUTES.sessionError,
  ADMIN_ROUTES.forgotPassword,
  ADMIN_ROUTES.resetPassword,
  ADMIN_ROUTES.completeAccountSetup,
  `${ADMIN_BASE}/api`,
];

export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || raw.length > MAX_LENGTH) return FALLBACK;
  if (!raw.startsWith("/") || raw.startsWith("//")) return FALLBACK;
  // Spelled exactly `/admin` (routes are case-sensitive and a re-encoded prefix would 404 after login).
  if (!/^\/admin(?:[/?#]|$)/.test(raw)) return FALLBACK;
  // Control characters, whitespace and backslashes are interpreted inconsistently by browsers.
  if (UNSAFE_CHARS.test(raw)) return FALLBACK;

  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return FALLBACK;
  }
  if (decoded.startsWith("//") || UNSAFE_CHARS.test(decoded)) return FALLBACK;

  const path = decoded.split(/[?#]/, 1)[0]?.toLowerCase().replace(/\/$/, "") ?? "";
  // Must be the dashboard or a page under it; `/admin/../x` and the like are traversal.
  if (path !== ADMIN_BASE && !path.startsWith(`${ADMIN_BASE}/`)) return FALLBACK;
  if (path.split("/").includes("..") || path.split("/").includes(".")) return FALLBACK;
  if (BLOCKED.some((blocked) => path === blocked || path.startsWith(`${blocked}/`))) return FALLBACK;
  return raw;
}
