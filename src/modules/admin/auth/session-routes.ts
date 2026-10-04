import "server-only";
import { checkCsrf, isCrossSiteNavigation, isPrefetch, problemResponse } from "../bff/guards";
import { ApiError, ErrorCode, isRefreshDead } from "../lib/api-errors";
import { logout } from "./backend-auth";
import { clearSessionCookies, readSessionCookies, writeSessionCookies, type CookieStore } from "./cookies";
import { isLoginReason } from "./login-notices";
import { refreshTokens } from "./refresh";
import { safeNextPath } from "./safe-next";
import { refreshAtFromExpiresIn } from "./token-timing";

// Logic for the cookie-changing auth route handlers (`/api/auth/refresh`, `/api/auth/session-ended`), kept out
// of the route files so it can be unit tested. Redirects use a relative Location: it resolves against the
// host the browser used, so no origin has to be reconstructed behind the proxy rewrite.

export interface RouteContext {
  cookieStore: CookieStore;
}

const redirectTo = (location: string) => new Response(null, { status: 307, headers: { Location: location, "Cache-Control": "no-store" } });

const forbiddenNavigation = () =>
  problemResponse(new ApiError({ status: 403, code: ErrorCode.CsrfRejected, title: "Request rejected", detail: "Cross-site request." }));

function refreshFailureLocation(error: ApiError, next: string): string {
  if (error.code === ErrorCode.AccountNotActive) return "/login?reason=suspended";
  if (isRefreshDead(error)) return "/login?reason=expired";
  // Throttled or backend trouble: the session itself may be fine, so do not clear it or send the user to
  // /login (the proxy would bounce them straight back). A dedicated page offers retry / sign out.
  const params = new URLSearchParams({ reason: error.code === ErrorCode.RateLimited ? "rate-limited" : "unavailable", next });
  if (error.retryAfter !== undefined) params.set("retry", String(error.retryAfter));
  return `/session-error?${params}`;
}

/** Navigation variant: the console layout redirects here when the access cookie is gone or rejected. */
export async function handleRefreshNavigation(request: Request, context: RouteContext): Promise<Response> {
  if (isPrefetch(request)) return new Response(null, { status: 204 });
  if (isCrossSiteNavigation(request)) return forbiddenNavigation();

  const next = safeNextPath(new URL(request.url).searchParams.get("next"));
  const { refreshToken } = readSessionCookies(context.cookieStore);
  if (!refreshToken) return redirectTo("/login");

  const outcome = await refreshTokens(refreshToken);
  if (outcome.ok) {
    writeSessionCookies(context.cookieStore, outcome.tokens);
    return redirectTo(next);
  }
  if (isRefreshDead(outcome.error)) clearSessionCookies(context.cookieStore);
  return redirectTo(refreshFailureLocation(outcome.error, next));
}

/** Fetch variant used by SessionKeeper. Returns when the next proactive refresh is due. */
export async function handleRefreshPost(request: Request, context: RouteContext): Promise<Response> {
  const csrf = checkCsrf(request);
  if (csrf) return problemResponse(csrf);

  const { refreshToken } = readSessionCookies(context.cookieStore);
  if (!refreshToken) {
    return problemResponse(
      new ApiError({ status: 401, code: ErrorCode.InvalidRefreshToken, title: "Unauthorized", detail: "No active session." }),
    );
  }

  const outcome = await refreshTokens(refreshToken);
  if (!outcome.ok) {
    if (isRefreshDead(outcome.error)) clearSessionCookies(context.cookieStore);
    return problemResponse(outcome.error);
  }
  writeSessionCookies(context.cookieStore, outcome.tokens);
  return Response.json(
    { expiresIn: outcome.tokens.expiresIn, refreshAt: Math.round(refreshAtFromExpiresIn(outcome.tokens.expiresIn)) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Revokes the refresh token (best effort) and clears the cookies. Never throws: the cookies always go. */
export async function endSession(context: RouteContext): Promise<void> {
  const { refreshToken } = readSessionCookies(context.cookieStore);
  clearSessionCookies(context.cookieStore);
  if (!refreshToken) return;
  try {
    await logout(refreshToken);
  } catch {
    // Already invalid, throttled (5/min) or backend down. The cookie is gone either way.
  }
}

/** Forced sign-out reached by redirect from the console layout (suspended / not an admin). */
export async function handleSessionEnded(request: Request, context: RouteContext): Promise<Response> {
  if (isCrossSiteNavigation(request)) return forbiddenNavigation();
  const reason = new URL(request.url).searchParams.get("reason") ?? "";
  await endSession(context);
  return redirectTo(isLoginReason(reason) ? `/login?reason=${reason}` : "/login");
}
