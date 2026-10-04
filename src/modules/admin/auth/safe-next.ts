// Post-login / post-refresh redirect targets come from the URL, so they are validated: a same-origin
// absolute path only, never a protocol-relative URL, a backslash trick, or an internal / auth route.

const MAX_LENGTH = 512;
const FALLBACK = "/";
// Control characters, space, DEL and backslash.
const UNSAFE_CHARS = /[\u0000- \u007f\\]/;

// Paths that must never be a `next` target: they would loop or expose internals.
const BLOCKED = ["/login", "/api", "/admin", "/session-error", "/forgot-password", "/reset-password", "/complete-account-setup"];

export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || raw.length > MAX_LENGTH) return FALLBACK;
  if (!raw.startsWith("/") || raw.startsWith("//")) return FALLBACK;
  // Control characters, whitespace and backslashes are interpreted inconsistently by browsers.
  if (UNSAFE_CHARS.test(raw)) return FALLBACK;

  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return FALLBACK;
  }
  if (decoded.startsWith("//") || UNSAFE_CHARS.test(decoded)) return FALLBACK;

  const path = decoded.split(/[?#]/, 1)[0]?.toLowerCase() ?? "";
  if (BLOCKED.some((blocked) => path === blocked || path.startsWith(`${blocked}/`))) return FALLBACK;
  return raw;
}
