import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_PREFIX,
  ADMIN_ROBOTS_TXT,
  NOT_FOUND_PATH,
  decideRoute,
  parseAdminHosts,
} from "@/lib/host";
import { cookieNames } from "@/modules/admin/auth/cookie-names";
import { decideGate } from "@/modules/admin/auth/gate";
import { NEXT_PATH_HEADER } from "@/modules/admin/auth/request-headers";

const NOINDEX = "noindex, nofollow";

/**
 * Host routing: the Admin app is served from its own host and rewritten under `/admin`;
 * the public host can never reach it. Host decisions live in `@/lib/host`, the auth gate in `@/modules/admin/auth/gate`.
 * Only the `Host` header is trusted (not `X-Forwarded-Host`, which a client can set).
 */
export function proxy(request: NextRequest) {
  const decision = decideRoute({
    host: request.headers.get("host"),
    pathname: request.nextUrl.pathname,
    adminHosts: parseAdminHosts(process.env.ADMIN_HOSTS),
  });

  let response: NextResponse;
  switch (decision.action) {
    case "pass":
      response = NextResponse.next();
      break;
    case "robots":
      response = new NextResponse(ADMIN_ROBOTS_TXT, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
      break;
    case "notFound": {
      // Rewrite to a path no route owns, so each host renders its own 404 page.
      const url = request.nextUrl.clone();
      url.pathname = decision.adminHost ? `${ADMIN_PREFIX}${NOT_FOUND_PATH}` : NOT_FOUND_PATH;
      response = NextResponse.rewrite(url);
      break;
    }
    case "rewrite": {
      // Optimistic auth gate: cookie PRESENCE only, never authorization (requireAdmin() and the backend decide).
      const names = cookieNames(process.env.NODE_ENV === "production");
      const gate = decideGate({
        pathname: request.nextUrl.pathname,
        search: request.nextUrl.search,
        hasSession: request.cookies.has(names.access) || request.cookies.has(names.refresh),
      });
      if (gate.action === "redirect") {
        response = NextResponse.redirect(new URL(gate.location, request.nextUrl));
        break;
      }
      if (gate.action === "unauthorized") {
        response = Response.json(
          { type: "about:blank", title: "Unauthorized", status: 401, detail: "No active session.", code: "MISSING_TOKEN" },
          { status: 401, headers: { "Content-Type": "application/problem+json" } },
        ) as NextResponse;
        break;
      }
      // Hand the browser-visible path to Server Components (they only see the rewritten /admin/... URL).
      // Always overwritten, so a client-supplied value is never trusted.
      const headers = new Headers(request.headers);
      headers.set(NEXT_PATH_HEADER, `${request.nextUrl.pathname}${request.nextUrl.search}`);
      const url = request.nextUrl.clone();
      url.pathname = decision.pathname;
      response = NextResponse.rewrite(url, { request: { headers } });
      break;
    }
  }

  if (decision.adminHost) response.headers.set("X-Robots-Tag", NOINDEX);
  return response;
}

export const config = {
  // Everything except Next's static assets, the favicon and public/assets.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|assets/).*)"],
};
