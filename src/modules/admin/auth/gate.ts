import { safeNextPath } from "./safe-next";

// The proxy's optimistic gate (plan 0001 §3): cookie PRESENCE only. It is a redirect for UX, not an
// authorization layer; `requireAdmin()` and the backend are the real checks.

/** Pages reachable without a session. `/login` additionally bounces authenticated users away. */
const PUBLIC_PAGES = new Set(["/login", "/forgot-password", "/reset-password", "/complete-account-setup", "/session-error"]);

export type GateDecision =
  | { action: "pass" }
  | { action: "redirect"; location: string }
  | { action: "unauthorized" };

function normalise(pathname: string): string {
  let path = pathname;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    // keep raw
  }
  const collapsed = path.replace(/\/{2,}/g, "/").toLowerCase();
  return collapsed.length > 1 ? collapsed.replace(/\/$/, "") : collapsed;
}

export function decideGate(input: { pathname: string; search: string; hasSession: boolean }): GateDecision {
  const { pathname, search, hasSession } = input;
  const path = normalise(pathname);

  // The auth handlers authenticate themselves (cookie + origin checks inside).
  if (path === "/api/auth" || path.startsWith("/api/auth/")) return { action: "pass" };

  if (PUBLIC_PAGES.has(path)) {
    if (path === "/login" && hasSession) {
      const params = new URLSearchParams(search);
      // `?reason=` means "you were just sent here because the session is bad": never bounce that back.
      if (!params.has("reason")) return { action: "redirect", location: safeNextPath(params.get("next")) };
    }
    return { action: "pass" };
  }

  if (hasSession) return { action: "pass" };

  // Data calls get a machine-readable answer; pages get the login redirect.
  if (path === "/api" || path.startsWith("/api/")) return { action: "unauthorized" };

  const next = safeNextPath(`${pathname}${search}`);
  return { action: "redirect", location: next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}` };
}
