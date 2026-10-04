import { describe, expect, it, vi } from "vitest";
import { ApiError, ErrorCode } from "../../../lib/api-errors";
import { nextHealthPoll } from "../../system/hooks/use-health";
import { adminSummarySchema } from "./types";

// The real backend DTO (get-summary), including the `deadJobs` field the UI does not use.
const dto = {
  invitedClinicians: 3,
  activeClinicians: 5,
  activeParents: 7,
  activePlans: 0,
  childrenWithAssignedClinician: 6,
  childrenWithoutClinician: 2,
  deadJobs: 9,
};

const holder = vi.hoisted(() => ({ fetchImpl: undefined as undefined | typeof fetch }));
vi.mock("../../../lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("../../../lib/api-client")>("../../../lib/api-client");
  return { apiClient: actual.createApiClient({ fetchImpl: (...args) => holder.fetchImpl!(...args) }) };
});
import { liveDashboardApi } from "./live";

function getSummary(fetchImpl: typeof fetch) {
  holder.fetchImpl = fetchImpl;
  return liveDashboardApi.getSummary();
}

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

describe("liveDashboardApi.getSummary", () => {
  it("parses the backend DTO and keeps zero as 0", async () => {
    const summary = await getSummary(async () => json(200, dto));
    expect(summary.activePlans).toBe(0);
    expect(summary.invitedClinicians).toBe(3);
    expect(summary).not.toHaveProperty("deadJobs");
  });

  it("rejects a response without invitedClinicians (an older backend)", async () => {
    const { invitedClinicians: _omit, ...old } = dto;
    void _omit;
    await expect(getSummary(async () => json(200, { ...old, pendingClinicianApplications: 1 }))).rejects.toMatchObject({
      code: ErrorCode.BadResponse,
    });
  });

  it("surfaces a 429 with its wait time and does not retry", async () => {
    const fetchImpl = vi.fn(async () => json(429, { code: ErrorCode.RateLimited }, { "retry-after": "20" }));
    await expect(getSummary(fetchImpl)).rejects.toMatchObject({ code: ErrorCode.RateLimited, retryAfter: 20 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("the schema rejects negative or fractional counts", () => {
    expect(adminSummarySchema.safeParse({ ...dto, activePlans: -1 }).success).toBe(false);
    expect(adminSummarySchema.safeParse({ ...dto, activePlans: 1.5 }).success).toBe(false);
  });
});

describe("health polling", () => {
  it("polls every 30 s but stops after a 429", () => {
    expect(nextHealthPoll(undefined)).toBe(30_000);
    expect(nextHealthPoll(new ApiError({ status: 500, code: "HTTP_500" }))).toBe(30_000);
    expect(nextHealthPoll(new ApiError({ status: 429, code: ErrorCode.RateLimited }))).toBe(false);
  });
});
