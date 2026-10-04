import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

// The proxy's optimistic auth gate on the admin host: host x path x cookie matrix (cookie PRESENCE only).

function request(host: string, path: string, cookie?: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://127.0.0.1:3001${path}`, { headers: { host, ...(cookie ? { cookie } : {}), ...headers } });
}
const ADMIN = "admin.localhost:3001";
const location = (res: Response) => res.headers.get("location");
const rewrite = (res: Response) => res.headers.get("x-middleware-rewrite");

describe("proxy auth gate (admin host)", () => {
  it("redirects an anonymous page request to /login with next", () => {
    const res = proxy(request(ADMIN, "/users?role=PARENT"));
    expect(res.status).toBe(307);
    expect(location(res)).toMatch(/\/login\?next=%2Fusers%3Frole%3DPARENT$/);
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("redirects the anonymous dashboard to a bare /login", () => {
    expect(location(proxy(request(ADMIN, "/")))).toMatch(/\/login$/);
  });

  it("answers anonymous /api/backend calls with 401 problem+json, not a redirect", async () => {
    const res = proxy(request(ADMIN, "/api/backend/users"));
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toBe("application/problem+json");
    expect((await res.json()).code).toBe("MISSING_TOKEN");
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("lets anonymous visitors reach the auth pages and /api/auth/*", () => {
    for (const path of ["/login", "/forgot-password", "/reset-password?token=x", "/complete-account-setup?token=x", "/session-error", "/api/auth/refresh"]) {
      const res = proxy(request(ADMIN, path));
      expect(res.status, path).toBe(200);
      expect(rewrite(res), path).toMatch(/\/admin\//);
    }
  });

  it("passes a request that has either session cookie (presence only: it does not look at the value)", () => {
    for (const cookie of ["nn_at=anything", "nn_rt=anything"]) {
      const res = proxy(request(ADMIN, "/users", cookie));
      expect(res.status).toBe(200);
      expect(rewrite(res)).toMatch(/\/admin\/users$/);
    }
  });

  it("does not treat unrelated cookies as a session", () => {
    expect(proxy(request(ADMIN, "/users", "other=1; nn_atx=1")).status).toBe(307);
  });

  it("bounces an authenticated visitor off /login, but not when a reason is present", () => {
    const bounced = proxy(request(ADMIN, "/login", "nn_at=x"));
    expect(bounced.status).toBe(307);
    expect(location(bounced)).toMatch(/:3001\/$/);
    expect(location(proxy(request(ADMIN, "/login?next=%2Fchildren", "nn_rt=x")))).toMatch(/\/children$/);
    expect(location(proxy(request(ADMIN, "/login?next=https%3A%2F%2Fevil.example", "nn_rt=x")))).toMatch(/:3001\/$/);
    expect(proxy(request(ADMIN, "/login?reason=expired", "nn_rt=x")).status).toBe(200);
  });

  it("forwards the browser-visible path and overwrites a client-supplied one", () => {
    const res = proxy(request(ADMIN, "/children/abc?tab=plans", "nn_at=x", { "x-nn-path": "/spoofed" }));
    expect(res.headers.get("x-middleware-request-x-nn-path")).toBe("/children/abc?tab=plans");
  });

  it("never gates the public host and still 404s /admin there", () => {
    expect(proxy(request("localhost:3001", "/faq")).headers.get("x-middleware-next")).toBe("1");
    expect(rewrite(proxy(request("localhost:3001", "/admin")))).toMatch(/\/__not-found$/);
    expect(rewrite(proxy(request("localhost:3001", "/api/admin/x")))).toMatch(/\/__not-found$/);
  });

  it("keeps the literal /admin/* hidden on the admin host, session or not", () => {
    expect(rewrite(proxy(request(ADMIN, "/admin/users", "nn_at=x")))).toMatch(/\/admin\/__not-found$/);
    expect(rewrite(proxy(request(ADMIN, "/admin/users")))).toMatch(/\/admin\/__not-found$/);
  });
});
