import { NextResponse, type NextRequest } from "next/server";
import { cookieNames } from "@/modules/admin/auth/cookie-names";
import { decideGate } from "@/modules/admin/auth/gate";
import { NEXT_PATH_HEADER, NONCE_HEADER } from "@/modules/admin/auth/request-headers";
import { isAdminPath } from "@/modules/admin/navigation/paths";
import { buildAdminCsp, createNonce } from "@/modules/admin/security/csp";

/** Headers for every `/admin/*` response. The landing site never gets them. */
const ADMIN_HEADERS: Record<string, string> = {
  "X-Robots-Tag": "noindex, nofollow",
  "Cache-Control": "no-store",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  // Reset and setup links carry a token in the query string.
  "Referrer-Policy": "same-origin",
};

function withAdminHeaders(response: NextResponse, csp: string): NextResponse {
  response.headers.set("Content-Security-Policy", csp);
  for (const [name, value] of Object.entries(ADMIN_HEADERS)) response.headers.set(name, value);
  return response;
}

/**
 * The Admin app lives at `/admin` on the same origin as the landing site (plan 0002). This proxy does nothing
 * for any other path, so landing responses are untouched. For `/admin/*` it adds the noindex / no-store / frame
 * headers and runs the optimistic auth gate (cookie PRESENCE only; `requireAdmin()` and the backend decide).
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!isAdminPath(pathname)) return NextResponse.next();

  const nonce = createNonce();
  const csp = buildAdminCsp(nonce, process.env.NODE_ENV === "development");
  const names = cookieNames(process.env.NODE_ENV === "production");
  const gate = decideGate({
    pathname,
    search,
    hasSession: request.cookies.has(names.access) || request.cookies.has(names.refresh),
  });

  if (gate.action === "redirect") return withAdminHeaders(NextResponse.redirect(new URL(gate.location, request.nextUrl)), csp);
  if (gate.action === "unauthorized") {
    return withAdminHeaders(
      Response.json(
        { type: "about:blank", title: "Unauthorized", status: 401, detail: "No active session.", code: "MISSING_TOKEN" },
        { status: 401, headers: { "Content-Type": "application/problem+json" } },
      ) as NextResponse,
      csp,
    );
  }

  // Hand the requested path to Server Components (they cannot read it). Always overwritten, so a
  // client-supplied value is never trusted.
  const headers = new Headers(request.headers);
  headers.set(NEXT_PATH_HEADER, `${pathname}${search}`);
  // Next.js reads the nonce from the request's CSP header while rendering and stamps its own scripts with it;
  // `x-nonce` lets the root layout stamp the two inline pre-paint scripts.
  headers.set("Content-Security-Policy", csp);
  headers.set(NONCE_HEADER, nonce);
  return withAdminHeaders(NextResponse.next({ request: { headers } }), csp);
}

export const config = {
  // Everything except Next's static assets, the favicon and public/assets. Non-admin paths return early above.
  matcher: ["/((?!_next/static|_next/image|favicon\.ico|assets/).*)"],
};
