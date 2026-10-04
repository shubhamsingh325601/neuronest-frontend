import { CSRF_HEADER, CSRF_VALUE } from "../auth/request-headers";
import { ApiError, ErrorCode } from "../lib/api-errors";

// Request checks shared by the BFF handler and the auth route handlers. Pure functions of the Request.

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function problemResponse(error: ApiError, extraHeaders: Record<string, string> = {}): Response {
  return new Response(
    JSON.stringify({
      type: "about:blank",
      title: error.title,
      status: error.status,
      detail: error.detail,
      code: error.code,
      requestId: error.requestId,
      ...(error.errors.length ? { errors: error.errors } : {}),
    }),
    {
      status: error.status,
      headers: {
        "Content-Type": "application/problem+json",
        "Cache-Control": "no-store",
        ...(error.retryAfter !== undefined ? { "Retry-After": String(error.retryAfter) } : {}),
        ...extraHeaders,
      },
    },
  );
}

const csrfRejected = (detail: string) =>
  new ApiError({ status: 403, code: ErrorCode.CsrfRejected, title: "Request rejected", detail });

/**
 * CSRF defence for cookie-authenticated calls (plan 0001 §16): SameSite=Lax cookies, plus a required custom
 * header (not sendable cross-origin without a preflight we never grant), plus, for state-changing methods,
 * an `Origin` that matches the `Host` the request arrived on. Returns the rejection, or null when fine.
 */
export function checkCsrf(request: Request): ApiError | null {
  if (request.headers.get(CSRF_HEADER) !== CSRF_VALUE) return csrfRejected(`Missing ${CSRF_HEADER} header.`);
  if (SAFE_METHODS.has(request.method.toUpperCase())) return null;

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return csrfRejected("Missing Origin.");
  try {
    if (new URL(origin).host.toLowerCase() !== host.toLowerCase()) return csrfRejected("Cross-origin request.");
  } catch {
    return csrfRejected("Invalid Origin.");
  }
  return null;
}

/**
 * For the GET auth handlers that a navigation (not fetch) reaches. Browsers label the request's origin
 * relationship; a link on another site is `cross-site`. Old clients that send no header are allowed.
 */
export function isCrossSiteNavigation(request: Request): boolean {
  return request.headers.get("sec-fetch-site") === "cross-site";
}

/** Link prefetches must never trigger a token rotation. */
export function isPrefetch(request: Request): boolean {
  const headers = request.headers;
  return (
    headers.get("next-router-prefetch") !== null ||
    headers.get("purpose")?.toLowerCase() === "prefetch" ||
    headers.get("sec-purpose")?.toLowerCase().startsWith("prefetch") === true
  );
}
