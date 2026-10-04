import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

// The proxy's optimistic auth gate for /admin/*: path x cookie matrix (cookie PRESENCE only).

function request(path: string, cookie?: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost:3001${path}`, { headers: { host: "localhost:3001", ...(cookie ? { cookie } : {}), ...headers } });
}
const location = (res: Response) => res.headers.get("location");

describe("proxy auth gate", () => {
  it("redirects an anonymous page request to /admin/login with next", () => {
    const res = proxy(request("/admin/users?role=PARENT"));
    expect(res.status).toBe(307);
    expect(location(res)).toMatch(/\/admin\/login\?next=%2Fadmin%2Fusers%3Frole%3DPARENT$/);
  });

  it("redirects the anonymous dashboard to a bare /admin/login", () => {
    expect(location(proxy(request("/admin")))).toMatch(/\/admin\/login$/);
  });

  it("answers anonymous /admin/api/backend calls with 401 problem+json, not a redirect", async () => {
    const res = proxy(request("/admin/api/backend/users"));
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toBe("application/problem+json");
    expect((await res.json()).code).toBe("MISSING_TOKEN");
  });

  it("does not reveal whether an unknown admin URL exists: anonymous visitors get the login redirect", () => {
    expect(location(proxy(request("/admin/nope/nothing")))).toMatch(/\/admin\/login\?next=/);
  });

  it("lets anonymous visitors reach the auth pages and /admin/api/auth/*", () => {
    for (const path of [
      "/admin/login",
      "/admin/forgot-password",
      "/admin/reset-password?token=x",
      "/admin/complete-account-setup?token=x",
      "/admin/session-error",
      "/admin/api/auth/refresh",
    ]) {
      const res = proxy(request(path));
      expect(res.status, path).toBe(200);
      expect(res.headers.get("x-middleware-next"), path).toBe("1");
    }
  });

  it("passes a request that has either session cookie (presence only: it does not look at the value)", () => {
    for (const cookie of ["nn_at=anything", "nn_rt=anything"]) {
      const res = proxy(request("/admin/users", cookie));
      expect(res.status).toBe(200);
      expect(res.headers.get("x-middleware-next")).toBe("1");
    }
  });

  it("does not treat unrelated cookies as a session", () => {
    expect(proxy(request("/admin/users", "other=1; nn_atx=1")).status).toBe(307);
  });

  it("bounces an authenticated visitor off /admin/login, but not when a reason is present", () => {
    const bounced = proxy(request("/admin/login", "nn_at=x"));
    expect(bounced.status).toBe(307);
    expect(location(bounced)).toMatch(/:3001\/admin$/);
    expect(location(proxy(request("/admin/login?next=%2Fadmin%2Fchildren", "nn_rt=x")))).toMatch(/\/admin\/children$/);
    expect(location(proxy(request("/admin/login?next=https%3A%2F%2Fevil.example", "nn_rt=x")))).toMatch(/:3001\/admin$/);
    expect(location(proxy(request("/admin/login?next=%2Ffaq", "nn_rt=x")))).toMatch(/:3001\/admin$/);
    expect(proxy(request("/admin/login?reason=expired", "nn_rt=x")).status).toBe(200);
  });

  it("forwards the requested path and overwrites a client-supplied one", () => {
    const res = proxy(request("/admin/children/abc?tab=plans", "nn_at=x", { "x-nn-path": "/spoofed" }));
    expect(res.headers.get("x-middleware-request-x-nn-path")).toBe("/admin/children/abc?tab=plans");
  });

  it("gates path tricks the same way as the plain path", () => {
    for (const path of ["/%61dmin/users", "//admin/users", "/ADMIN/users", "/admin/users/"]) {
      expect(proxy(request(path)).status, path).toBe(307);
    }
  });
});
