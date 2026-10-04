import { describe, expect, it } from "vitest";
import { decideGate } from "./gate";
import { safeNextPath } from "./safe-next";

const gate = (pathname: string, hasSession: boolean, search = "") => decideGate({ pathname, search, hasSession });

describe("decideGate", () => {
  it("sends anonymous page requests to /admin/login with the destination", () => {
    expect(gate("/admin/users", false, "?role=PARENT")).toEqual({
      action: "redirect",
      location: "/admin/login?next=%2Fadmin%2Fusers%3Frole%3DPARENT",
    });
    expect(gate("/admin", false)).toEqual({ action: "redirect", location: "/admin/login" });
  });

  it("answers anonymous data calls with 401 instead of a redirect", () => {
    expect(gate("/admin/api/backend/users", false)).toEqual({ action: "unauthorized" });
  });

  it("lets anonymous visitors reach the auth pages and handlers", () => {
    for (const path of [
      "/admin/login",
      "/admin/forgot-password",
      "/admin/reset-password",
      "/admin/complete-account-setup",
      "/admin/session-error",
      "/admin/api/auth/refresh",
      "/admin/api/auth/session-ended",
    ]) {
      expect(gate(path, false), path).toEqual({ action: "pass" });
    }
  });

  it("matches case-insensitively and through encoding / duplicate slashes", () => {
    expect(gate("/ADMIN/LOGIN", false)).toEqual({ action: "pass" });
    expect(gate("//admin//login", false)).toEqual({ action: "pass" });
    expect(gate("/admin/%6cogin", false)).toEqual({ action: "pass" });
    expect(gate("/admin/login/", false)).toEqual({ action: "pass" });
    // ...and does not let look-alikes through.
    expect(gate("/admin/login-anything", false).action).toBe("redirect");
    expect(gate("/admin/api/authx/refresh", false)).toEqual({ action: "unauthorized" });
  });

  it("passes authenticated requests", () => {
    expect(gate("/admin/users", true)).toEqual({ action: "pass" });
    expect(gate("/admin/api/backend/users", true)).toEqual({ action: "pass" });
  });

  it("bounces an authenticated visitor off /admin/login, honouring a safe next", () => {
    expect(gate("/admin/login", true)).toEqual({ action: "redirect", location: "/admin" });
    expect(gate("/admin/login", true, "?next=%2Fadmin%2Fchildren")).toEqual({ action: "redirect", location: "/admin/children" });
    expect(gate("/admin/login", true, "?next=https%3A%2F%2Fevil.example")).toEqual({ action: "redirect", location: "/admin" });
    expect(gate("/admin/login", true, "?next=%2Ffaq")).toEqual({ action: "redirect", location: "/admin" });
  });

  it("does not bounce /admin/login when a reason is present (prevents a redirect loop)", () => {
    expect(gate("/admin/login", true, "?reason=expired")).toEqual({ action: "pass" });
  });

  it("still allows reset / setup links for a signed-in browser", () => {
    expect(gate("/admin/reset-password", true, "?token=abc")).toEqual({ action: "pass" });
  });
});

describe("safeNextPath", () => {
  it.each(["/admin", "/admin/users", "/admin/children/abc?tab=plans", "/admin/plan-templates/new"])("keeps %s", (path) => {
    expect(safeNextPath(path)).toBe(path);
  });

  it.each([
    null,
    undefined,
    "",
    "admin/users", // not absolute
    "/", // the landing site is not an admin destination
    "/faq",
    "/administrators",
    "/ADMIN/users",
    "/%61dmin/users",
    "//evil.example",
    "/\\evil.example",
    "/%2Fevil.example/../", // decodes to //evil...
    "https://evil.example",
    "javascript:alert(1)",
    "/admin\nSet-Cookie: a=b",
    "/admin/../faq",
    "/admin/login",
    "/admin/login?next=/admin",
    "/admin/api/auth/refresh",
    "/admin/api/backend/users",
    "/admin/session-error",
    "/admin/forgot-password",
    "/admin/%6cogin",
    "/%61dmin/api/auth/refresh",
    `/admin/${"a".repeat(600)}`,
  ])("rejects %j", (value) => {
    expect(safeNextPath(value as string | null | undefined)).toBe("/admin");
  });
});
