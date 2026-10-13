import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isAllowed } from "./allowlist";
import { handleBackendRequest } from "./handler";

const fetchMock = vi.fn();
const ORIGIN = "http://localhost:3001";

beforeEach(() => {
  vi.stubEnv("API_BASE_URL", "http://backend.test");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () =>
    Response.json({ data: [], nextCursor: null }, { status: 200, headers: { "x-request-id": "req-1", "set-cookie": "leak=1" } }),
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const ctx = { accessToken: "access-jwt" };

function req(method: string, path: string, init: { headers?: Record<string, string>; body?: string } = {}) {
  return new Request(`${ORIGIN}/api/backend/${path}`, {
    method,
    headers: { host: "localhost:3001", "x-nn-admin": "1", ...init.headers },
    body: init.body,
  });
}
const parts = (path: string) => path.split("/");

describe("isAllowed", () => {
  it.each([
    ["GET", "users"],
    ["GET", "users/me"],
    ["GET", "users/abc-123"],
    ["POST", "users/abc-123/suspend"],
    ["POST", "clinicians"],
    ["POST", "experts"],
    ["PUT", "experts/abc/children"],
    ["GET", "experts/abc/children"],
    ["POST", "experts/abc/reset-password"],
    ["GET", "children/c1/experts"],
    ["GET", "children/c1/plans"],
    ["GET", "children/c1/media"],
    ["GET", "children/c1/call-logs"],
    ["GET", "plans/p1"],
    ["GET", "plans/p1/notes"],
    ["PATCH", "clinicians/abc"],
    ["DELETE", "children/c1/clinicians/k1"],
    ["GET", "admin/summary"],
    ["POST", "plan-templates/t1/publish"],
    ["POST", "plan-templates/t1/archive"],
    ["GET", "plan-templates/t1"],
    ["GET", "plan-templates"],
  ])("allows %s %s", (method, path) => expect(isAllowed(method, parts(path))).toBe(true));

  it.each([
    ["POST", "auth/login"], // auth is never reachable through the BFF
    ["GET", "auth/refresh"],
    ["POST", "jobs/run-due"],
    ["POST", "users/me/deactivate"],
    ["POST", "children/c1/media/upload-tickets"],
    ["POST", "children/c1/plans"], // admin plan writes are post-v1
    ["DELETE", "users/abc"], // allowed path, wrong method
    ["PUT", "clinicians/abc"],
    ["POST", "plans/p1/notes"], // plan records are read-only in Admin
    ["DELETE", "plans/p1"],
    ["PATCH", "plans/p1"],
    ["GET", "plans/p1/days/1"],
    ["DELETE", "children/c1/media/m1"],
    ["POST", "children/c1/call-logs"],
    ["PUT", "plan-templates/t1/content"], // editing and cloning templates are not part of Admin yet
    ["POST", "plan-templates/t1/clone"],
    ["DELETE", "plan-templates/t1"],
    ["GET", "plan-templates/t1/publish"],
    ["POST", "children/c1/experts"], // the child page only reads its experts; changes go through PUT experts/:id/children
    ["GET", "experts/abc/reset-password"],
    ["GET", "users/abc/suspend"], // wrong method on an action route
    ["GET", "users/../auth/login"], // traversal
    ["GET", "users/.."],
    ["GET", "users/a.b"],
    ["GET", "users//"],
    ["GET", ""],
    ["GET", "users/abc/extra"],
  ])("refuses %s %s", (method, path) => expect(isAllowed(method, parts(path))).toBe(false));
});

// parent-console: impersonation mints a parent token, so it is reachable only while the console flag is on.
describe("isAllowed: parent test console", () => {
  it("refuses impersonation while the flag is off", () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_PARENT_CONSOLE", "");
    expect(isAllowed("POST", parts("users/abc-123/impersonate"))).toBe(false);
  });

  it("allows exactly POST users/:id/impersonate while the flag is on", () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_PARENT_CONSOLE", "1");
    expect(isAllowed("POST", parts("users/abc-123/impersonate"))).toBe(true);
    expect(isAllowed("GET", parts("users/abc-123/impersonate"))).toBe(false);
    expect(isAllowed("POST", parts("users/abc-123/impersonate/extra"))).toBe(false);
    expect(isAllowed("POST", parts("users/../impersonate"))).toBe(false);
    expect(isAllowed("POST", parts("auth/login"))).toBe(false);
  });

  it("leaves every standing rule unchanged when on", () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_PARENT_CONSOLE", "1");
    expect(isAllowed("GET", parts("users"))).toBe(true);
    expect(isAllowed("POST", parts("users/abc/suspend"))).toBe(true);
    expect(isAllowed("DELETE", parts("users/abc"))).toBe(false);
  });
});

describe("handleBackendRequest", () => {
  it("injects the bearer and forwards the query (no client IP), and never forwards cookies", async () => {
    const res = await handleBackendRequest(req("GET", "users?limit=20&role=PARENT", { headers: { cookie: "nn_at=secret" } }), ["users"], ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(res.headers.get("x-request-id")).toBe("req-1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://backend.test/v1/users?limit=20&role=PARENT");
    expect(init.headers.Authorization).toBe("Bearer access-jwt");
    expect(init.headers["X-Forwarded-For"]).toBeUndefined();
    expect(init.headers.cookie).toBeUndefined();
  });

  it("refuses non-allowlisted paths before any backend call", async () => {
    const res = await handleBackendRequest(
      req("POST", "auth/login", { headers: { origin: ORIGIN }, body: "{}" }),
      ["auth", "login"],
      ctx,
    );
    expect(res.status).toBe(404);
    expect((await res.json()).code).toBe("BFF_NOT_ALLOWED");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects calls without the CSRF header", async () => {
    const request = new Request(`${ORIGIN}/admin/api/backend/users`, { headers: { host: "localhost:3001" } });
    const res = await handleBackendRequest(request, ["users"], ctx);
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("CSRF_REJECTED");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires a matching Origin on state-changing methods", async () => {
    const segments = ["users", "u1", "suspend"];
    expect((await handleBackendRequest(req("POST", "users/u1/suspend"), segments, ctx)).status).toBe(403);
    const foreign = req("POST", "users/u1/suspend", { headers: { origin: "https://evil.example" } });
    expect((await handleBackendRequest(foreign, segments, ctx)).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();

    const ok = req("POST", "users/u1/suspend", { headers: { origin: ORIGIN } });
    expect((await handleBackendRequest(ok, segments, ctx)).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("answers 401 MISSING_TOKEN without calling the backend when there is no access cookie", async () => {
    const res = await handleBackendRequest(req("GET", "users"), ["users"], { accessToken: undefined });
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("MISSING_TOKEN");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes backend problem+json through unchanged, including Retry-After", async () => {
    const body = { title: "Too Many Requests", status: 429, code: "RATE_LIMITED", requestId: "r9" };
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(body), { status: 429, headers: { "content-type": "application/problem+json", "retry-after": "42" } }),
    );
    const res = await handleBackendRequest(req("GET", "users"), ["users"], ctx);
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("42");
    expect(res.headers.get("content-type")).toBe("application/problem+json");
    expect(await res.json()).toEqual(body);
  });

  it("maps an unreachable backend to 503 problem+json", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    const res = await handleBackendRequest(req("GET", "users"), ["users"], ctx);
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe("BACKEND_UNREACHABLE");
  });

  it("returns 204 without a body", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const request = req("DELETE", "children/c1/clinicians/k1", { headers: { origin: ORIGIN } });
    const res = await handleBackendRequest(request, ["children", "c1", "clinicians", "k1"], ctx);
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
  });
});
