import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, ErrorCode, isAccessTokenRejected, isSessionOver, parseApiError, parseRetryAfter } from "../lib/api-errors";
import { getAdminEnv } from "../config/env";
import { cookieNames } from "./cookie-names";
import { clearSessionCookies, writeSessionCookies } from "./cookies";
import { readTokenWindow, refreshAtFor } from "./token-timing";

afterEach(() => vi.unstubAllEnvs());

describe("parseApiError", () => {
  it("reads RFC 9457 problem+json", async () => {
    const response = new Response(
      JSON.stringify({ title: "Validation Error", status: 400, detail: "a; b", code: "VALIDATION_ERROR", requestId: "r1", errors: ["a", "b"] }),
      { status: 400, headers: { "content-type": "application/problem+json" } },
    );
    const error = await parseApiError(response);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: "VALIDATION_ERROR", requestId: "r1", errors: ["a", "b"], detail: "a; b" });
  });

  it("falls back to the status for non-problem bodies and keeps Retry-After", async () => {
    const error = await parseApiError(new Response("<html>Bad gateway</html>", { status: 502, headers: { "retry-after": "5" } }));
    expect(error).toMatchObject({ status: 502, code: "HTTP_502", retryAfter: 5 });
  });

  it("classifies session codes by code, not status", () => {
    expect(isAccessTokenRejected(new ApiError({ status: 401, code: ErrorCode.InvalidToken }))).toBe(true);
    expect(isAccessTokenRejected(new ApiError({ status: 401, code: ErrorCode.InvalidCredentials }))).toBe(false);
    expect(isSessionOver(new ApiError({ status: 401, code: ErrorCode.InvalidCredentials }))).toBe(false);
    expect(isSessionOver(new ApiError({ status: 403, code: ErrorCode.AccountNotActive }))).toBe(true);
    expect(isSessionOver(new ApiError({ status: 401, code: ErrorCode.InvalidRefreshToken }))).toBe(true);
  });

  it("parses Retry-After seconds and dates", () => {
    expect(parseRetryAfter("30")).toBe(30);
    expect(parseRetryAfter(new Date(10_000 + 20_000).toUTCString(), 10_000)).toBe(20);
    expect(parseRetryAfter("soon")).toBeUndefined();
    expect(parseRetryAfter(null)).toBeUndefined();
  });
});

describe("getAdminEnv", () => {
  it("defaults to the local backend and no client IP header in development", () => {
    expect(getAdminEnv({ NODE_ENV: "development" })).toEqual({ apiBaseUrl: "http://localhost:4000", production: false });
  });

  it("treats empty values as unset and trims a trailing slash", () => {
    expect(getAdminEnv({ API_BASE_URL: "" }).apiBaseUrl).toBe("http://localhost:4000");
    expect(getAdminEnv({ API_BASE_URL: "https://api.example.com/" }).apiBaseUrl).toBe("https://api.example.com");
  });

  it("rejects a base URL carrying a path such as /v1, and requires one in production", () => {
    expect(() => getAdminEnv({ API_BASE_URL: "https://api.example.com/v1" })).toThrow(/without a path/);
    expect(() => getAdminEnv({ NODE_ENV: "production" })).toThrow(/API_BASE_URL is required/);
  });

});


describe("session cookies", () => {
  function recorder() {
    const sets: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
    return {
      sets,
      store: { get: () => undefined, delete: () => undefined, set: (name: string, value: string, options: Record<string, unknown>) => void sets.push({ name, value, options }) },
    };
  }

  it("uses __Host- names, Secure and no Domain in production", () => {
    const { store, sets } = recorder();
    writeSessionCookies(store, { accessToken: "a", refreshToken: "r", expiresIn: 900 }, true);
    expect(sets.map((c) => c.name)).toEqual(["__Host-nn_at", "__Host-nn_rt"]);
    for (const cookie of sets) {
      expect(cookie.options).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/" });
      expect(cookie.options).not.toHaveProperty("domain");
    }
    expect(sets[1].options.maxAge).toBe(30 * 24 * 60 * 60);
  });

  it("uses plain names and no Secure flag in development", () => {
    expect(cookieNames(false)).toEqual({ access: "nn_at", refresh: "nn_rt" });
    const { store, sets } = recorder();
    writeSessionCookies(store, { accessToken: "a", refreshToken: "r", expiresIn: 900 }, false);
    expect(sets[0].options.secure).toBe(false);
  });

  it("clears with the same attributes (so a __Host- cookie is actually removed)", () => {
    const { store, sets } = recorder();
    clearSessionCookies(store, true);
    expect(sets).toHaveLength(2);
    for (const cookie of sets) expect(cookie).toMatchObject({ value: "", options: { maxAge: 0, secure: true, path: "/", httpOnly: true } });
  });
});

describe("token timing", () => {
  const jwt = (claims: object) => `h.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.s`;

  it("reads iat / exp and schedules at 80% of the lifetime", () => {
    const window = readTokenWindow(jwt({ iat: 1000, exp: 1900 }));
    expect(window).toEqual({ issuedAt: 1_000_000, expiresAt: 1_900_000 });
    expect(refreshAtFor(window!)).toBe(1_720_000);
  });

  it("returns null for anything that is not a JWT with an exp", () => {
    expect(readTokenWindow("not-a-jwt")).toBeNull();
    expect(readTokenWindow(jwt({ iat: 1 }))).toBeNull();
    expect(readTokenWindow("a.%%%.c")).toBeNull();
  });
});
