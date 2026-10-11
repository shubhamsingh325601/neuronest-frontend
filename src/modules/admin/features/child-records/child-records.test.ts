import { describe, expect, it, vi } from "vitest";
import { parseChildTab } from "../children/child-tabs";
import { groupDays } from "./components/group-days";
import { formatBytes, formatDuration, playbackState } from "./media-format";
import { mediaSchema, planDetailSchema } from "./api/types";

const holder = vi.hoisted(() => ({ fetchImpl: undefined as undefined | typeof fetch }));
vi.mock("../../lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("../../lib/api-client")>("../../lib/api-client");
  return { apiClient: actual.createApiClient({ fetchImpl: (...args) => holder.fetchImpl!(...args) }) };
});
import { liveChildRecordsApi } from "./api/live";
import { mockChildRecordsApi } from "@/mocks/admin/child-records";

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
const page = { data: [], nextCursor: null };
const urlOf = (fetchImpl: ReturnType<typeof vi.fn>) => String((fetchImpl.mock.calls[0] as unknown[])[0]);

describe("liveChildRecordsApi", () => {
  it("reads the plan history with the status filter and cursor", async () => {
    const fetchImpl = vi.fn(async () => json(page));
    holder.fetchImpl = fetchImpl;
    await liveChildRecordsApi.plans("c1", { status: "ACTIVE", cursor: "abc", limit: 20 });
    const url = urlOf(fetchImpl);
    expect(url).toMatch(/\/children\/c1\/plans\?/);
    expect(url).toContain("status=ACTIVE");
    expect(url).toContain("cursor=abc");
  });

  it("reads a plan, its notes, the media and the call logs from the documented GET routes", async () => {
    const calls: string[] = [];
    holder.fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      calls.push(String(input));
      return json(String(input).includes("/plans/p1") && !String(input).includes("notes") ? { id: "p1", childId: "c1", planTemplateId: "t1", status: "ACTIVE", origin: "AI", startDate: "2026-10-01", createdAt: "x", updatedAt: "x", days: [], sections: [] } : page);
    }) as unknown as typeof fetch;
    await liveChildRecordsApi.plan("p1");
    await liveChildRecordsApi.notes("p1", {});
    await liveChildRecordsApi.media("c1", {});
    await liveChildRecordsApi.callLogs("c1", {});
    expect(calls.map((url) => url.replace(/^.*\/v1\/|^.*backend\//, "").replace(/\?.*$/, ""))).toEqual([
      "plans/p1",
      "plans/p1/notes",
      "children/c1/media",
      "children/c1/call-logs",
    ]);
  });

  it("only ever issues GETs", async () => {
    const fetchImpl = vi.fn(async () => json(page));
    holder.fetchImpl = fetchImpl;
    await liveChildRecordsApi.media("c1", {});
    expect((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].method ?? "GET").toBe("GET");
  });
});

describe("schemas", () => {
  it("accepts a plan for the parent audience (no createdById) and a media row with a null playbackUrl", () => {
    const plan = { id: "p", childId: "c", planTemplateId: "t", status: "ACTIVE", origin: "MANUAL", startDate: "2026-10-01", createdAt: "x", updatedAt: "x", days: [], sections: [] };
    expect(planDetailSchema.safeParse(plan).success).toBe(true);
    const media = { id: "m", childId: "c", uploadedById: "u", type: "VIDEO", provider: "CLOUDINARY", status: "PENDING", mimeType: null, durationSeconds: null, sizeBytes: null, context: null, createdAt: "x", updatedAt: "x", playbackUrl: null };
    expect(mediaSchema.safeParse(media).success).toBe(true);
  });
});

describe("playbackState", () => {
  it("explains each state where there is nothing to play", () => {
    expect(playbackState({ status: "PENDING", playbackUrl: null })).toMatchObject({ kind: "unavailable", reason: expect.stringContaining("not finished") });
    expect(playbackState({ status: "FAILED", playbackUrl: null })).toMatchObject({ kind: "unavailable", reason: expect.stringContaining("failed") });
    expect(playbackState({ status: "UPLOADED", playbackUrl: null })).toMatchObject({ kind: "unavailable" });
  });

  it("plays only https URLs", () => {
    expect(playbackState({ status: "UPLOADED", playbackUrl: "https://res.cloudinary.com/x/y.mp4" })).toEqual({ kind: "ready", url: "https://res.cloudinary.com/x/y.mp4" });
    expect(playbackState({ status: "UPLOADED", playbackUrl: "http://res.cloudinary.com/x" }).kind).toBe("unavailable");
    expect(playbackState({ status: "UPLOADED", playbackUrl: "javascript:alert(1)" }).kind).toBe("unavailable");
    expect(playbackState({ status: "UPLOADED", playbackUrl: "not a url" }).kind).toBe("unavailable");
  });
});

describe("formatters", () => {
  it("formats sizes and durations, and leaves nulls empty", () => {
    expect(formatBytes(null)).toBeNull();
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(9_400_000)).toBe("9.0 MB");
    expect(formatDuration(75)).toBe("1:15");
    expect(formatDuration(null)).toBeNull();
  });
});

describe("groupDays", () => {
  it("orders sections by position and days by number, and puts loose days last", () => {
    const day = (dayNumber: number, sectionId: string | null) => ({ id: `d${dayNumber}`, dayNumber, title: "t", instructions: "i", sectionId, updatedAt: "x" });
    const groups = groupDays({
      sections: [
        { id: "b", title: "Second", position: 2 },
        { id: "a", title: "First", position: 1 },
        { id: "empty", title: "Empty", position: 3 },
      ],
      days: [day(4, null), day(3, "b"), day(2, "a"), day(1, "a")],
    });
    expect(groups.map((g) => [g.title, g.days.map((d) => d.dayNumber)])).toEqual([
      ["First", [1, 2]],
      ["Second", [3]],
      ["Other days", [4]],
    ]);
  });

  it("does not label the group when no section exists", () => {
    const groups = groupDays({ sections: [], days: [{ id: "d", dayNumber: 1, title: "t", instructions: "i", sectionId: null, updatedAt: "x" }] });
    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBeNull();
  });
});

describe("parseChildTab", () => {
  it("falls back to overview for a missing or unknown tab", () => {
    expect(parseChildTab(null)).toBe("overview");
    expect(parseChildTab("nope")).toBe("overview");
    expect(parseChildTab("media")).toBe("media");
  });
});

describe("mockChildRecordsApi", () => {
  it("returns schema-valid records for every tab", async () => {
    expect((await mockChildRecordsApi.plans("c1", { status: "ACTIVE" })).data.every((p) => p.status === "ACTIVE")).toBe(true);
    expect(planDetailSchema.safeParse(await mockChildRecordsApi.plan("p-3")).success).toBe(true);
    const media = await mockChildRecordsApi.media("c1", {});
    expect(media.data.every((m) => mediaSchema.safeParse(m).success)).toBe(true);
    expect(media.data.some((m) => m.playbackUrl === null)).toBe(true);
    const notes = await mockChildRecordsApi.notes("p-3", { limit: 20 });
    expect(notes.nextCursor).not.toBeNull();
    expect((await mockChildRecordsApi.callLogs("c1", {})).data.length).toBeGreaterThan(0);
  }, 10_000);
});
