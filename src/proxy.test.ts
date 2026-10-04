import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { config, proxy } from "./proxy";

function request(host: string, path: string, cookie?: string) {
  return new NextRequest(`http://127.0.0.1:3001${path}`, { headers: { host, ...(cookie ? { cookie } : {}) } });
}

// Presence-only session cookie, so these tests exercise host routing rather than the auth gate (see proxy.gate.test.ts).
const SESSION = "nn_at=x";

const rewriteTarget = (res: Response) => res.headers.get("x-middleware-rewrite");

afterEach(() => vi.unstubAllEnvs());

describe("proxy", () => {
  it("lets public requests through without touching them", () => {
    const res = proxy(request("localhost:3001", "/faq"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(rewriteTarget(res)).toBeNull();
    expect(res.headers.get("x-robots-tag")).toBeNull();
  });

  it("rewrites a public /admin request to a path no route owns", () => {
    const res = proxy(request("localhost:3001", "/admin"));
    expect(rewriteTarget(res)).toMatch(/\/__not-found$/);
    expect(res.headers.get("x-robots-tag")).toBeNull();
  });

  it("rewrites admin-host paths under /admin and marks them noindex", () => {
    const home = proxy(request("admin.localhost:3001", "/", SESSION));
    expect(rewriteTarget(home)).toMatch(/:3001\/admin$/);
    expect(home.headers.get("x-robots-tag")).toBe("noindex, nofollow");

    const login = proxy(request("admin.localhost:3001", "/login?next=%2Fusers"));
    expect(rewriteTarget(login)).toMatch(/\/admin\/login\?next=%2Fusers$/);
  });

  it("answers robots.txt on the admin host with Disallow: /", async () => {
    const res = proxy(request("admin.localhost:3001", "/robots.txt"));
    expect(await res.text()).toBe("User-agent: *\nDisallow: /\n");
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("sends the literal /admin prefix and sitemap.xml on the admin host to the admin 404", () => {
    for (const path of ["/admin/login", "/sitemap.xml"]) {
      const res = proxy(request("admin.localhost:3001", path));
      expect(rewriteTarget(res)).toMatch(/\/admin\/__not-found$/);
      expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    }
  });

  it("reads ADMIN_HOSTS from the environment", () => {
    vi.stubEnv("ADMIN_HOSTS", "ops.example.com");
    const res = proxy(request("ops.example.com", "/users", SESSION));
    expect(rewriteTarget(res)).toMatch(/\/admin\/users$/);
  });

  it("ignores X-Forwarded-Host", () => {
    const req = new NextRequest("http://127.0.0.1:3001/admin", {
      headers: { host: "localhost:3001", "x-forwarded-host": "admin.localhost" },
    });
    expect(rewriteTarget(proxy(req))).toMatch(/\/__not-found$/);
  });
});

describe("proxy matcher", () => {
  const [source] = config.matcher;
  const matches = (path: string) => new RegExp(`^${source}$`).test(path);

  it("covers pages, robots and sitemap", () => {
    for (const path of ["/", "/faq", "/robots.txt", "/sitemap.xml", "/admin", "/api/auth/refresh"]) {
      expect(matches(path)).toBe(true);
    }
  });

  it("skips static assets, images and the favicon", () => {
    for (const path of ["/_next/static/chunks/a.js", "/_next/image", "/favicon.ico", "/assets/hero-nest.png"]) {
      expect(matches(path)).toBe(false);
    }
  });
});
