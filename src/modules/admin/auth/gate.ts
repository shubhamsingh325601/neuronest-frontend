import { ADMIN_BASE, ADMIN_ROUTES, normalizeForMatch } from "../navigation/paths";
import { safeNextPath } from "./safe-next";

// The proxy's optimistic gate (plan 0001 §3, plan 0002 §6): cookie PRESENCE only. It is a redirect for UX, not an
// authorization layer; `requireAdmin()` and the backend are the real checks. Only called for `/admin/*` paths.

/** Pages reachable without a session. `/admin/login` additionally bounces authenticated users away. */
const PUBLIC_PAGES = new Set<string>([
  ADMIN_ROUTES.login,
  ADMIN_ROUTES.forgotPassword,
  ADMIN_ROUTES.resetPassword,
  ADMIN_ROUTES.completeAccountSetup,
  ADMIN_ROUTES.sessionError,
]);

const AUTH_API = `${ADMIN_BASE}/api/auth`;
const API = `${ADMIN_BASE}/api`;

export type GateDecision =
  | { action: "pass" }
  | { action: "redirect"; location: string }
  | { action: "unauthorized" };

export function decideGate(input: { pathname: string; search: string; hasSession: boolean }): GateDecision {
  const { pathname, search, hasSession } = input;
  const path = normalizeForMatch(pathname);

  // The auth handlers authenticate themselves (cookie + origin checks inside).
  if (path === AUTH_API || path.startsWith(`${AUTH_API}/`)) return { action: "pass" };

  if (PUBLIC_PAGES.has(path)) {
    if (path === ADMIN_ROUTES.login && hasSession) {
      const params = new URLSearchParams(search);
      // `?reason=` means "you were just sent here because the session is bad": never bounce that back.
      if (!params.has("reason")) return { action: "redirect", location: safeNextPath(params.get("next")) };
    }
    return { action: "pass" };
  }

  if (hasSession) return { action: "pass" };

  // Data calls get a machine-readable answer; pages get the login redirect.
  if (path === API || path.startsWith(`${API}/`)) return { action: "unauthorized" };

  const next = safeNextPath(`${pathname}${search}`);
  return {
    action: "redirect",
    location: next === ADMIN_BASE ? ADMIN_ROUTES.login : `${ADMIN_ROUTES.login}?next=${encodeURIComponent(next)}`,
  };
}
