import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "./proxy";

function request(path: string, cookie?: string) {
  return new NextRequest(`http://localhost:3001${path}`, { headers: { host: "localhost:3001", ...(cookie ? { cookie } : {}) } });
}

// Presence-only session cookie: these tests cover scope and headers; the gate matrix is in proxy.gate.test.ts.
const SESSION = "nn_at=x";

const ADMIN_HEADERS = ["x-robots-tag", "cache-control", "x-frame-options", "content-security-policy", "x-content-type-options", "referrer-policy"];

describe("proxy scope", () => {
  it("does nothing for landing requests: no rewrite, redirect or header", () => {
    for (const path of ["/", "/faq", "/for-parents", "/privacy", "/robots.txt", "/sitemap.xml", "/adminx", "/administrators", "/x/admin", "/faq/admin"]) {
      const res = proxy(request(path));
      expect(res.headers.get("x-middleware-next"), path).toBe("1");
      expect(res.headers.get("x-middleware-rewrite"), path).toBeNull();
      expect(res.headers.get("location"), path).toBeNull();
      for (const name of ADMIN_HEADERS) expect(res.headers.get(name), `${path} ${name}`).toBeNull();
    }
  });

  it("never sets the admin path header for landing requests", () => {
    expect(proxy(request("/faq", SESSION)).headers.get("x-middleware-request-x-nn-path")).toBeNull();
  });

  it("puts noindex, no-store and frame protection on every /admin response (pass, redirect and 401)", () => {
    const responses = [
      proxy(request("/admin", SESSION)),
      proxy(request("/admin/login")),
      proxy(request("/admin/users")), // redirect
      proxy(request("/admin/api/backend/users")), // 401
    ];
    expect(responses.map((r) => r.status)).toEqual([200, 200, 307, 401]);
    for (const res of responses) {
      expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
      expect(res.headers.get("cache-control")).toBe("no-store");
      expect(res.headers.get("x-frame-options")).toBe("DENY");
      expect(res.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
      expect(res.headers.get("referrer-policy")).toBe("same-origin");
    }
  });

  it("gives each /admin request its own nonce and hands it to the render", () => {
    const first = proxy(request("/admin", SESSION));
    const second = proxy(request("/admin", SESSION));
    const nonceOf = (res: Response) => /'nonce-([^']+)'/.exec(res.headers.get("content-security-policy") ?? "")?.[1];
    expect(nonceOf(first)).toBeTruthy();
    expect(nonceOf(first)).not.toBe(nonceOf(second));
    expect(first.headers.get("x-middleware-request-x-nonce")).toBe(nonceOf(first));
    expect(first.headers.get("x-middleware-request-content-security-policy")).toBe(first.headers.get("content-security-policy"));
  });

  it("serves /admin without any rewrite (the URL is the route)", () => {
    expect(proxy(request("/admin/users", SESSION)).headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("recognises encoded and re-cased admin paths", () => {
    for (const path of ["/%61dmin/users", "//admin/users", "/ADMIN/users", "/admin/"]) {
      expect(proxy(request(path)).headers.get("x-robots-tag"), path).toBe("noindex, nofollow");
    }
  });

  it("excludes Next's static assets from the matcher", () => {
    const regex = new RegExp(`^${config.matcher[0]}$`);
    expect(regex.test("/admin/users")).toBe(true);
    expect(regex.test("/_next/static/chunks/a.js")).toBe(false);
    expect(regex.test("/favicon.ico")).toBe(false);
    expect(regex.test("/assets/logo.png")).toBe(false);
  });
});
