import { describe, expect, it } from "vitest";
import { decideRoute, isAdminHost, parseAdminHosts } from "./host";

describe("parseAdminHosts", () => {
  it("handles undefined and empty values", () => {
    expect(parseAdminHosts(undefined)).toEqual([]);
    expect(parseAdminHosts("")).toEqual([]);
    expect(parseAdminHosts(" , ")).toEqual([]);
  });

  it("trims, lower-cases and strips ports", () => {
    expect(parseAdminHosts(" Ops.Example.com:8080 , console.test ")).toEqual([
      "ops.example.com",
      "console.test",
    ]);
  });
});

describe("isAdminHost", () => {
  it("treats admin.* names as admin hosts, with or without a port", () => {
    expect(isAdminHost("admin.localhost")).toBe(true);
    expect(isAdminHost("admin.localhost:3001")).toBe(true);
    expect(isAdminHost("ADMIN.neuronest.co.uk")).toBe(true);
  });

  it("treats plain and look-alike hosts as public", () => {
    expect(isAdminHost("localhost")).toBe(false);
    expect(isAdminHost("localhost:3001")).toBe(false);
    expect(isAdminHost("neuronest.co.uk")).toBe(false);
    expect(isAdminHost("administrator.example.com")).toBe(false);
    expect(isAdminHost("notadmin.localhost")).toBe(false);
    expect(isAdminHost("admin")).toBe(false);
    expect(isAdminHost("example.com:admin.localhost")).toBe(false);
  });

  it("never treats a missing host as admin", () => {
    expect(isAdminHost(null)).toBe(false);
    expect(isAdminHost(undefined)).toBe(false);
    expect(isAdminHost("")).toBe(false);
  });

  it("honours the ADMIN_HOSTS list regardless of port", () => {
    const hosts = parseAdminHosts("ops.example.com,127.0.0.2");
    expect(isAdminHost("ops.example.com", hosts)).toBe(true);
    expect(isAdminHost("ops.example.com:3001", hosts)).toBe(true);
    expect(isAdminHost("127.0.0.2:3001", hosts)).toBe(true);
    expect(isAdminHost("example.com", hosts)).toBe(false);
  });

  it("copes with trailing dots and IPv6 literals", () => {
    expect(isAdminHost("admin.localhost.:3001")).toBe(true);
    expect(isAdminHost("[::1]:3001", ["[::1]"])).toBe(true);
    expect(isAdminHost("[::1]:3001")).toBe(false);
  });
});

const ADMIN = "admin.localhost:3001";
const PUBLIC = "localhost:3001";

describe("decideRoute: public host", () => {
  it.each([
    "/",
    "/faq",
    "/for-parents",
    "/robots.txt",
    "/sitemap.xml",
    "/administrator",
    "/api/other",
    "/some/unknown/path",
  ])("passes %s through untouched", (pathname) => {
    expect(decideRoute({ host: PUBLIC, pathname })).toEqual({ adminHost: false, action: "pass" });
  });

  it.each(["/admin", "/admin/", "/admin/login", "/admin/api/backend/x", "/api/admin", "/api/admin/users"])(
    "hides %s",
    (pathname) => {
      expect(decideRoute({ host: PUBLIC, pathname })).toEqual({ adminHost: false, action: "notFound" });
    },
  );

  it.each(["/Admin", "/ADMIN/x", "/%61dmin", "/%41dmin/x", "//admin", "/admin//x", "/api/%41dmin/x"])(
    "hides obfuscated %s",
    (pathname) => {
      expect(decideRoute({ host: PUBLIC, pathname })).toMatchObject({ action: "notFound" });
    },
  );

  it("hides /admin paths for an unlisted host and a missing host", () => {
    expect(decideRoute({ host: "evil.example.com", pathname: "/admin" })).toMatchObject({ action: "notFound" });
    expect(decideRoute({ host: null, pathname: "/admin" })).toMatchObject({ action: "notFound" });
  });

  it("survives a malformed escape", () => {
    expect(decideRoute({ host: PUBLIC, pathname: "/%E0%A4%A" })).toMatchObject({ action: "pass" });
    expect(decideRoute({ host: PUBLIC, pathname: "/admin/%E0%A4%A" })).toMatchObject({ action: "notFound" });
  });
});

describe("decideRoute: admin host", () => {
  it("rewrites / to /admin", () => {
    expect(decideRoute({ host: ADMIN, pathname: "/" })).toEqual({
      adminHost: true,
      action: "rewrite",
      pathname: "/admin",
    });
  });

  it.each([
    ["/login", "/admin/login"],
    ["/clinicians/applications", "/admin/clinicians/applications"],
    ["/api/auth/refresh", "/admin/api/auth/refresh"],
    ["/administrator", "/admin/administrator"],
    ["/faq", "/admin/faq"],
  ])("rewrites %s to %s", (pathname, expected) => {
    expect(decideRoute({ host: ADMIN, pathname })).toEqual({
      adminHost: true,
      action: "rewrite",
      pathname: expected,
    });
  });

  it("serves a disallow-all robots.txt", () => {
    expect(decideRoute({ host: ADMIN, pathname: "/robots.txt" })).toEqual({ adminHost: true, action: "robots" });
  });

  it("returns 404 for sitemap.xml", () => {
    expect(decideRoute({ host: ADMIN, pathname: "/sitemap.xml" })).toEqual({ adminHost: true, action: "notFound" });
  });

  it.each(["/admin", "/admin/", "/admin/login", "/ADMIN/login", "/%61dmin", "//admin/x"])(
    "returns 404 for the literal internal prefix %s",
    (pathname) => {
      expect(decideRoute({ host: ADMIN, pathname })).toEqual({ adminHost: true, action: "notFound" });
    },
  );

  it("uses ADMIN_HOSTS entries as admin hosts", () => {
    const adminHosts = parseAdminHosts("ops.example.com");
    expect(decideRoute({ host: "ops.example.com:3001", pathname: "/users", adminHosts })).toEqual({
      adminHost: true,
      action: "rewrite",
      pathname: "/admin/users",
    });
    expect(decideRoute({ host: "ops.example.com", pathname: "/admin", adminHosts })).toMatchObject({
      action: "notFound",
    });
  });
});
