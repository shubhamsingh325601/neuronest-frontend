import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookieNames } from "./cookie-names";
import type { CookieStore } from "./cookies";
import { resetRefreshState } from "./refresh";
import { handleRefreshNavigation, handleRefreshPost, handleSessionEnded } from "./session-routes";

const fetchMock = vi.fn();
const names = cookieNames(false);
const ORIGIN = "http://admin.localhost:3001";

function store(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const sets: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  const impl: CookieStore = {
    get: (name) => (values.has(name) ? { value: values.get(name)! } : undefined),
    set: (name, value, options) => {
      sets.push({ name, value, options });
      values.set(name, value);
    },
    delete: (name) => values.delete(name),
  };
  return { store: impl, sets };
}

const tokensResponse = (n: number) =>
  Response.json({ accessToken: `at-${n}`, refreshToken: `rt-${n}`, tokenType: "Bearer", expiresIn: 900 });
const problem = (status: number, code: string, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify({ title: code, status, code, requestId: "r1" }), {
    status,
    headers: { "content-type": "application/problem+json", ...headers },
  });

beforeEach(() => {
  vi.stubEnv("API_BASE_URL", "http://backend.test");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  resetRefreshState();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const nav = (query = "", headers: Record<string, string> = {}) => new Request(`${ORIGIN}/api/auth/refresh${query}`, { headers });
const post = (headers: Record<string, string> = { "x-nn-admin": "1", origin: ORIGIN, host: "admin.localhost:3001" }) =>
  new Request(`${ORIGIN}/api/auth/refresh`, { method: "POST", headers });

describe("GET /api/auth/refresh (navigation)", () => {
  it("rotates the tokens, sets httpOnly cookies and redirects to a validated next", async () => {
    fetchMock.mockResolvedValueOnce(tokensResponse(1));
    const { store: cookieStore, sets } = store({ [names.refresh]: "rt-0" });

    const res = await handleRefreshNavigation(nav("?next=%2Fusers"), { cookieStore });
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("/users");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://backend.test/v1/auth/refresh");
    expect(JSON.parse(init.body)).toEqual({ refreshToken: "rt-0" }); // only documented fields
    expect(init.headers["X-Forwarded-For"]).toBeUndefined(); // the backend limits by identity and ignores it

    const access = sets.find((c) => c.name === names.access)!;
    const refresh = sets.find((c) => c.name === names.refresh)!;
    expect(access).toMatchObject({ value: "at-1", options: { httpOnly: true, sameSite: "lax", path: "/", maxAge: 900 } });
    expect(refresh.value).toBe("rt-1");
    expect(access.options.domain).toBeUndefined();
  });

  it("ignores an unsafe next", async () => {
    fetchMock.mockResolvedValueOnce(tokensResponse(1));
    const { store: cookieStore } = store({ [names.refresh]: "rt-0" });
    const res = await handleRefreshNavigation(nav("?next=https%3A%2F%2Fevil.example"), { cookieStore });
    expect(res.headers.get("location")).toBe("/");
  });

  it("never rotates on a prefetch", async () => {
    const { store: cookieStore } = store({ [names.refresh]: "rt-0" });
    const variants: Array<Record<string, string>> = [{ "next-router-prefetch": "1" }, { purpose: "prefetch" }, { "sec-purpose": "prefetch;prerender" }];
    for (const headers of variants) {
      const res = await handleRefreshNavigation(nav("", headers), { cookieStore });
      expect(res.status).toBe(204);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses cross-site navigations", async () => {
    const { store: cookieStore } = store({ [names.refresh]: "rt-0" });
    const res = await handleRefreshNavigation(nav("", { "sec-fetch-site": "cross-site" }), { cookieStore });
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("goes to sign-in without calling the backend when there is no refresh cookie", async () => {
    const { store: cookieStore } = store();
    const res = await handleRefreshNavigation(nav(), { cookieStore });
    expect(res.headers.get("location")).toBe("/login");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("clears the cookies and shows 'expired' when the refresh token is dead", async () => {
    fetchMock.mockResolvedValueOnce(problem(401, "INVALID_REFRESH_TOKEN"));
    const { store: cookieStore, sets } = store({ [names.access]: "old", [names.refresh]: "rt-0" });
    const res = await handleRefreshNavigation(nav("?next=%2Fusers"), { cookieStore });
    expect(res.headers.get("location")).toBe("/login?reason=expired");
    expect(sets.map((c) => [c.name, c.value, c.options.maxAge])).toEqual([
      [names.access, "", 0],
      [names.refresh, "", 0],
    ]);
  });

  it("treats a refresh token the backend calls malformed as an expired session", async () => {
    fetchMock.mockResolvedValueOnce(problem(400, "VALIDATION_ERROR"));
    const { store: cookieStore, sets } = store({ [names.refresh]: "truncated" });
    const res = await handleRefreshNavigation(nav(), { cookieStore });
    expect(res.headers.get("location")).toBe("/login?reason=expired");
    expect(sets).toHaveLength(2);
  });

  it("forces sign-out with 'suspended' when the account is not active", async () => {
    fetchMock.mockResolvedValueOnce(problem(403, "ACCOUNT_NOT_ACTIVE"));
    const { store: cookieStore, sets } = store({ [names.refresh]: "rt-0" });
    const res = await handleRefreshNavigation(nav(), { cookieStore });
    expect(res.headers.get("location")).toBe("/login?reason=suspended");
    expect(sets).toHaveLength(2);
  });

  it("keeps the session and shows the retry page on 429 (never /login, which would loop)", async () => {
    fetchMock.mockResolvedValueOnce(problem(429, "RATE_LIMITED", { "retry-after": "37" }));
    const { store: cookieStore, sets } = store({ [names.refresh]: "rt-0" });
    const res = await handleRefreshNavigation(nav("?next=%2Fchildren"), { cookieStore });
    expect(res.headers.get("location")).toBe("/session-error?reason=rate-limited&next=%2Fchildren&retry=37");
    expect(sets).toHaveLength(0);
  });

  it("keeps the session when the backend is down", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    const { store: cookieStore, sets } = store({ [names.refresh]: "rt-0" });
    const res = await handleRefreshNavigation(nav(), { cookieStore });
    expect(res.headers.get("location")).toMatch(/^\/session-error\?reason=unavailable/);
    expect(sets).toHaveLength(0);
  });

  it("collapses concurrent navigations into one backend refresh", async () => {
    fetchMock.mockImplementation(async () => tokensResponse(1));
    const a = store({ [names.refresh]: "rt-0" });
    const b = store({ [names.refresh]: "rt-0" });
    const [one, two] = await Promise.all([
      handleRefreshNavigation(nav(), { cookieStore: a.store }),
      handleRefreshNavigation(nav(), { cookieStore: b.store }),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(one.status).toBe(307);
    expect(two.status).toBe(307);
    expect(b.sets.find((c) => c.name === names.refresh)?.value).toBe("rt-1");
  });
});

describe("POST /api/auth/refresh (SessionKeeper)", () => {
  it("returns when the next refresh is due and sets the cookies", async () => {
    fetchMock.mockResolvedValueOnce(tokensResponse(1));
    const { store: cookieStore, sets } = store({ [names.refresh]: "rt-0" });
    const before = Date.now();
    const res = await handleRefreshPost(post(), { cookieStore });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.expiresIn).toBe(900);
    expect(body.refreshAt).toBeGreaterThanOrEqual(before + 720_000 - 50);
    expect(sets).toHaveLength(2);
  });

  it("requires the CSRF header and a same-origin Origin", async () => {
    const { store: cookieStore } = store({ [names.refresh]: "rt-0" });
    expect((await handleRefreshPost(post({}), { cookieStore })).status).toBe(403);
    const foreign = post({ "x-nn-admin": "1", origin: "https://evil.example", host: "admin.localhost:3001" });
    expect((await handleRefreshPost(foreign, { cookieStore })).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 401 INVALID_REFRESH_TOKEN with no cookie, and passes 429 + Retry-After through", async () => {
    const empty = store();
    const none = await handleRefreshPost(post(), { cookieStore: empty.store });
    expect(none.status).toBe(401);
    expect((await none.json()).code).toBe("INVALID_REFRESH_TOKEN");

    fetchMock.mockResolvedValueOnce(problem(429, "RATE_LIMITED", { "retry-after": "12" }));
    const { store: cookieStore, sets } = store({ [names.refresh]: "rt-0" });
    const limited = await handleRefreshPost(post(), { cookieStore });
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBe("12");
    expect(sets).toHaveLength(0);
  });

  it("clears the cookies when the session is over", async () => {
    fetchMock.mockResolvedValueOnce(problem(401, "INVALID_REFRESH_TOKEN"));
    const { store: cookieStore, sets } = store({ [names.refresh]: "rt-0" });
    const res = await handleRefreshPost(post(), { cookieStore });
    expect(res.status).toBe(401);
    expect(sets.every((c) => c.options.maxAge === 0)).toBe(true);
  });
});

describe("GET /api/auth/session-ended", () => {
  it("revokes the refresh token, clears cookies and redirects with a known reason", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const { store: cookieStore, sets } = store({ [names.access]: "a", [names.refresh]: "rt-0" });
    const res = await handleSessionEnded(new Request(`${ORIGIN}/api/auth/session-ended?reason=suspended`), { cookieStore });
    expect(res.headers.get("location")).toBe("/login?reason=suspended");
    expect(sets).toHaveLength(2);
    expect(fetchMock.mock.calls[0][0]).toBe("http://backend.test/v1/auth/logout");
  });

  it("still clears the cookies when the revoke fails, and ignores unknown reasons", async () => {
    fetchMock.mockResolvedValueOnce(problem(429, "RATE_LIMITED"));
    const { store: cookieStore, sets } = store({ [names.refresh]: "rt-0" });
    const res = await handleSessionEnded(new Request(`${ORIGIN}/api/auth/session-ended?reason=%3Cscript%3E`), { cookieStore });
    expect(res.headers.get("location")).toBe("/login");
    expect(sets).toHaveLength(2);
  });

  it("refuses cross-site navigations (no forced sign-out by a link on another site)", async () => {
    const { store: cookieStore, sets } = store({ [names.refresh]: "rt-0" });
    const res = await handleSessionEnded(new Request(`${ORIGIN}/api/auth/session-ended`, { headers: { "sec-fetch-site": "cross-site" } }), { cookieStore });
    expect(res.status).toBe(403);
    expect(sets).toHaveLength(0);
  });
});
