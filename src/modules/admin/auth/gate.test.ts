import { describe, expect, it } from "vitest";
import { decideGate } from "./gate";
import { safeNextPath } from "./safe-next";

const gate = (pathname: string, hasSession: boolean, search = "") => decideGate({ pathname, search, hasSession });

describe("decideGate", () => {
  it("sends anonymous page requests to /login with the destination", () => {
    expect(gate("/users", false, "?role=PARENT")).toEqual({ action: "redirect", location: "/login?next=%2Fusers%3Frole%3DPARENT" });
    expect(gate("/", false)).toEqual({ action: "redirect", location: "/login" });
  });

  it("answers anonymous data calls with 401 instead of a redirect", () => {
    expect(gate("/api/backend/users", false)).toEqual({ action: "unauthorized" });
  });

  it("lets anonymous visitors reach the auth pages and handlers", () => {
    for (const path of ["/login", "/forgot-password", "/reset-password", "/complete-account-setup", "/session-error", "/api/auth/refresh", "/api/auth/session-ended"]) {
      expect(gate(path, false)).toEqual({ action: "pass" });
    }
  });

  it("matches case-insensitively and through encoding / duplicate slashes", () => {
    expect(gate("/LOGIN", false)).toEqual({ action: "pass" });
    expect(gate("//login", false)).toEqual({ action: "pass" });
    expect(gate("/%6cogin", false)).toEqual({ action: "pass" });
    expect(gate("/login/", false)).toEqual({ action: "pass" });
    // ...and does not let look-alikes through.
    expect(gate("/login-anything", false).action).toBe("redirect");
    expect(gate("/api/authx/refresh", false)).toEqual({ action: "unauthorized" });
  });

  it("passes authenticated requests", () => {
    expect(gate("/users", true)).toEqual({ action: "pass" });
    expect(gate("/api/backend/users", true)).toEqual({ action: "pass" });
  });

  it("bounces an authenticated visitor off /login, honouring a safe next", () => {
    expect(gate("/login", true)).toEqual({ action: "redirect", location: "/" });
    expect(gate("/login", true, "?next=%2Fchildren")).toEqual({ action: "redirect", location: "/children" });
    expect(gate("/login", true, "?next=https%3A%2F%2Fevil.example")).toEqual({ action: "redirect", location: "/" });
  });

  it("does not bounce /login when a reason is present (prevents a redirect loop)", () => {
    expect(gate("/login", true, "?reason=expired")).toEqual({ action: "pass" });
  });

  it("still allows reset / setup links for a signed-in browser", () => {
    expect(gate("/reset-password", true, "?token=abc")).toEqual({ action: "pass" });
  });
});

describe("safeNextPath", () => {
  it.each(["/", "/users", "/children/abc?tab=plans", "/plan-templates/new"])("keeps %s", (path) => {
    expect(safeNextPath(path)).toBe(path);
  });

  it.each([
    null,
    undefined,
    "",
    "users", // not absolute
    "//evil.example",
    "/\\evil.example",
    "/%2Fevil.example/../", // decodes to //evil...
    "https://evil.example",
    "javascript:alert(1)",
    "/ok\nSet-Cookie: a=b",
    "/login",
    "/login?next=/",
    "/api/auth/refresh",
    "/admin/users",
    "/session-error",
    "/%61pi/auth/refresh",
    `/${"a".repeat(600)}`,
  ])("rejects %j", (value) => {
    expect(safeNextPath(value as string | null | undefined)).toBe("/");
  });
});
