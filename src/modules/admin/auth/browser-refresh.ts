import { ADMIN_ROUTES } from "../navigation/paths";
import { CSRF_HEADER, CSRF_VALUE } from "./request-headers";

// Browser-side session refresh, shared by SessionKeeper (proactive) and the API client (after a 401).
// - One refresh at a time in this tab (shared promise) and across tabs (`navigator.locks`).
// - A shared "next refresh due" timestamp lets a tab that waited for the lock see that another tab already
//   refreshed, and skip. Cookies are httpOnly, so this is the only signal available to JS.
// - /v1/auth/* allows 5 requests / 60 s per identity: callers back off on 429 rather than loop.

const LOCK_NAME = "nn-admin-session-refresh";
export const DUE_STORAGE_KEY = "nn-admin-refresh-due";
export const FALLBACK_DELAY_MS = 10 * 60 * 1000;
export const RETRY_DELAY_MS = 30 * 1000;
const MIN_GAP_MS = 2000;

/** `next`: epoch ms the next refresh is due. `redirect`: the session is over, go here. */
export type RefreshOutcome = { next: number } | { redirect: string };

export function readDue(): number {
  try {
    return Number(window.localStorage.getItem(DUE_STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeDue(due: number) {
  try {
    window.localStorage.setItem(DUE_STORAGE_KEY, String(due));
  } catch {
    // Storage unavailable: tabs just rely on the server-side memo.
  }
}

async function requestRefresh(): Promise<RefreshOutcome> {
  try {
    const response = await fetch(ADMIN_ROUTES.authRefresh, {
      method: "POST",
      headers: { [CSRF_HEADER]: CSRF_VALUE },
      credentials: "same-origin",
      cache: "no-store",
    });
    if (response.ok) {
      const body = (await response.json()) as { refreshAt?: number };
      return { next: body.refreshAt ?? Date.now() + FALLBACK_DELAY_MS };
    }
    const problem = (await response.json().catch(() => ({}))) as { code?: string };
    if (problem.code === "ACCOUNT_NOT_ACTIVE") return { redirect: `${ADMIN_ROUTES.login}?reason=suspended` };
    if (problem.code === "INVALID_REFRESH_TOKEN" || problem.code === "VALIDATION_ERROR") return { redirect: `${ADMIN_ROUTES.login}?reason=expired` };
    if (response.status === 429) {
      const seconds = Number(response.headers.get("retry-after"));
      return { next: Date.now() + (Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 60_000) + Math.random() * 2000 };
    }
  } catch {
    // Offline or the server restarted: fall through to a retry.
  }
  return { next: Date.now() + RETRY_DELAY_MS };
}

async function refreshOnce(): Promise<RefreshOutcome> {
  // Another tab may have refreshed while this one waited for the lock.
  const stored = readDue();
  if (stored > Date.now() + MIN_GAP_MS) return { next: stored };
  const outcome = await requestRefresh();
  if ("next" in outcome) writeDue(outcome.next);
  return outcome;
}

let inFlight: Promise<RefreshOutcome> | null = null;

/** Refreshes the session (single-flight per tab, lock across tabs). Never throws. */
export function refreshSession(): Promise<RefreshOutcome> {
  inFlight ??= (async () => (typeof navigator !== "undefined" && navigator.locks ? navigator.locks.request(LOCK_NAME, refreshOnce) : refreshOnce()))().finally(
    () => {
      inFlight = null;
    },
  );
  return inFlight;
}
