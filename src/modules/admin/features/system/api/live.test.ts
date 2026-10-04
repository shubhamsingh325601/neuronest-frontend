import { describe, expect, it, vi } from "vitest";
import { ApiError, ErrorCode } from "../../../lib/api-errors";

// Exercise the real live service through the real apiClient with a fake fetch, so the BFF-style responses
// (200 report, 503 report, 503 problem, network failure) are what the service actually sees.
const respond = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

const holder = vi.hoisted(() => ({ fetchImpl: undefined as undefined | typeof fetch }));
vi.mock("../../../lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("../../../lib/api-client")>("../../../lib/api-client");
  return { apiClient: actual.createApiClient({ fetchImpl: (...args) => holder.fetchImpl!(...args) }) };
});
import { liveSystemApi } from "./live";

function health(fetchImpl: typeof fetch) {
  holder.fetchImpl = fetchImpl;
  return liveSystemApi.getHealth();
}

const report = { status: "ok", db: "up", uptime: 120, timestamp: "2026-10-04T10:00:00.000Z" };

describe("liveSystemApi.getHealth", () => {
  it("200 -> operational", async () => {
    expect(await health(async () => respond(200, report))).toEqual({
      state: "operational",
      api: "up",
      database: "up",
      uptimeSeconds: 120,
      reportedAt: report.timestamp,
    });
  });

  it("503 with a health body -> degraded, not an error", async () => {
    const snapshot = await health(async () => respond(503, { ...report, status: "degraded", db: "down" }));
    expect(snapshot).toMatchObject({ state: "degraded", api: "up", database: "down", uptimeSeconds: 120 });
  });

  it("backend unreachable -> down", async () => {
    const snapshot = await health(async () => {
      throw new TypeError("fetch failed");
    });
    expect(snapshot).toMatchObject({ state: "down", api: "down", database: "unknown", uptimeSeconds: null });
  });

  it("a 503 that is not a health body stays an error", async () => {
    await expect(health(async () => respond(503, { code: "SOMETHING_ELSE" }))).rejects.toBeInstanceOf(ApiError);
  });

  it("a throttled call (429) is rethrown with its wait time", async () => {
    const result = health(async () => respond(429, { code: ErrorCode.RateLimited }, { "retry-after": "7" }));
    await expect(result).rejects.toMatchObject({ code: ErrorCode.RateLimited, retryAfter: 7 });
  });

  it("a malformed 200 is a BAD_BACKEND_RESPONSE", async () => {
    await expect(health(async () => respond(200, { status: "ok" }))).rejects.toMatchObject({ code: ErrorCode.BadResponse });
  });
});
