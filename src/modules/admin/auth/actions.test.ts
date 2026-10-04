import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookieNames } from "./cookie-names";

// The login Server Action with Next's request APIs mocked and fetch faked at the network edge, so the whole
// path (zod -> backend login -> /users/me -> role check -> cookies / revoke -> redirect) runs for real.

const { cookieSets, redirectMock } = vi.hoisted(() => ({
  cookieSets: [] as Array<{ name: string; value: string; options: Record<string, unknown> }>,
  redirectMock: vi.fn((location: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { location });
  }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
    set: (name: string, value: string, options: Record<string, unknown>) => void cookieSets.push({ name, value, options }),
    delete: () => undefined,
  }),
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

const fetchMock = vi.fn();
const names = cookieNames(false);

const tokens = { accessToken: "at-1", refreshToken: "rt-1-long-enough-token", tokenType: "Bearer", expiresIn: 900 };
const profile = (role: string, status = "ACTIVE") => ({ id: "u1", email: "a@b.co", name: "Ada", role, status });
const problem = (status: number, code: string, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify({ title: code, status, code }), { status, headers: { "content-type": "application/problem+json", ...headers } });

function route(handlers: { login: () => Response; me?: () => Response }) {
  fetchMock.mockImplementation(async (url: string) => {
    if (url.endsWith("/v1/auth/login")) return handlers.login();
    if (url.endsWith("/v1/users/me")) return handlers.me!();
    if (url.endsWith("/v1/auth/logout")) return new Response(null, { status: 204 });
    throw new Error(`unexpected ${url}`);
  });
}

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}
const callsTo = (suffix: string) => fetchMock.mock.calls.filter(([url]) => String(url).endsWith(suffix));

beforeEach(() => {
  vi.stubEnv("API_BASE_URL", "http://backend.test");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  cookieSets.length = 0;
  redirectMock.mockClear();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function submit(values: Record<string, string>) {
  const { loginAction } = await import("./actions");
  try {
    return { state: await loginAction({ status: "idle" }, form(values)), redirect: undefined as string | undefined };
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") return { state: undefined, redirect: (error as Error & { location: string }).location };
    throw error;
  }
}

describe("loginAction", () => {
  it("validates before calling the backend", async () => {
    const { state } = await submit({ email: "not-an-email", password: "" });
    expect(state).toMatchObject({ status: "error", fieldErrors: { email: "Enter a valid email address.", password: "Enter your password." }, email: "not-an-email" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("signs an active admin in: only documented fields, cookies, redirect to a validated next", async () => {
    route({ login: () => Response.json(tokens), me: () => Response.json(profile("ADMIN")) });
    const { redirect } = await submit({ email: " Admin@NeuroNest.local ", password: "pw", next: "/admin/children" });

    expect(redirect).toBe("/admin/children");
    const [, loginInit] = callsTo("/v1/auth/login")[0];
    expect(JSON.parse(loginInit.body)).toEqual({ email: "Admin@NeuroNest.local", password: "pw" });
    expect(loginInit.headers["X-Forwarded-For"]).toBeUndefined(); // limits are per identity; the header is ignored
    expect(callsTo("/v1/users/me")[0][1].headers.Authorization).toBe("Bearer at-1");
    expect(cookieSets.map((c) => c.name)).toEqual([names.access, names.refresh]);
    expect(callsTo("/v1/auth/logout")).toHaveLength(0);
  });

  it("falls back to /admin for an unsafe next", async () => {
    route({ login: () => Response.json(tokens), me: () => Response.json(profile("ADMIN")) });
    expect((await submit({ email: "a@b.co", password: "pw", next: "//evil.example" })).redirect).toBe("/admin");
  });

  it.each([["PARENT"], ["CLINICIAN"]])("rejects a %s: revokes the just-issued refresh token and sets no cookies", async (role) => {
    route({ login: () => Response.json(tokens), me: () => Response.json(profile(role)) });
    const { state } = await submit({ email: "p@b.co", password: "pw" });

    expect(state).toMatchObject({ status: "error", error: "This account does not have admin access." });
    expect(JSON.parse(callsTo("/v1/auth/logout")[0][1].body)).toEqual({ refreshToken: tokens.refreshToken });
    expect(cookieSets).toHaveLength(0);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("rejects an admin whose status is not ACTIVE, and revokes", async () => {
    route({ login: () => Response.json(tokens), me: () => Response.json(profile("ADMIN", "SUSPENDED")) });
    const { state } = await submit({ email: "a@b.co", password: "pw" });
    expect(state?.error).toMatch(/not active/);
    expect(callsTo("/v1/auth/logout")).toHaveLength(1);
    expect(cookieSets).toHaveLength(0);
  });

  it("revokes when /users/me fails after a successful login", async () => {
    route({ login: () => Response.json(tokens), me: () => problem(500, "INTERNAL_ERROR") });
    const { state } = await submit({ email: "a@b.co", password: "pw" });
    expect(state?.status).toBe("error");
    expect(callsTo("/v1/auth/logout")).toHaveLength(1);
    expect(cookieSets).toHaveLength(0);
  });

  it("treats INVALID_CREDENTIALS as a form error with the email kept, never a session event", async () => {
    route({ login: () => problem(401, "INVALID_CREDENTIALS") });
    const { state } = await submit({ email: "a@b.co", password: "wrong" });
    expect(state).toEqual({ status: "error", error: "Incorrect email or password.", email: "a@b.co" });
    expect(callsTo("/v1/users/me")).toHaveLength(0);
    expect(callsTo("/v1/auth/logout")).toHaveLength(0);
    expect(cookieSets).toHaveLength(0);
  });

  it.each([
    [403, "EMAIL_NOT_VERIFIED", /not been verified/],
    [403, "ACCOUNT_NOT_ACTIVE", /not active/],
    [400, "VALIDATION_ERROR", /./],
  ])("maps %i %s to a readable message", async (status, code, pattern) => {
    route({ login: () => problem(status, code) });
    expect((await submit({ email: "a@b.co", password: "pw" })).state?.error).toMatch(pattern);
  });

  it("on RATE_LIMITED shows the wait and returns a deadline so the submit button can be disabled", async () => {
    route({ login: () => problem(429, "RATE_LIMITED", { "retry-after": "42" }) });
    const before = Date.now();
    const { state } = await submit({ email: "a@b.co", password: "pw" });
    expect(state?.error).toBe("Too many attempts. Wait 42 seconds and try again.");
    expect(state?.retryUntil).toBeGreaterThanOrEqual(before + 42_000);
    expect(state?.retryUntil).toBeLessThan(Date.now() + 42_500);
    expect(callsTo("/v1/auth/login")).toHaveLength(1); // no retry loop on auth routes
  });

  it("only sets retryUntil for rate limits", async () => {
    route({ login: () => problem(401, "INVALID_CREDENTIALS") });
    expect((await submit({ email: "a@b.co", password: "pw" })).state?.retryUntil).toBeUndefined();
  });

  it("reports an unreachable backend without leaking details", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed: ECONNREFUSED"));
    const { state } = await submit({ email: "a@b.co", password: "pw" });
    expect(state?.error).toBe("We could not reach the NeuroNest service. Try again in a moment.");
  });
});
