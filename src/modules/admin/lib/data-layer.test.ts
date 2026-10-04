import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { ApiError, ErrorCode } from "./api-errors";
import { describeError } from "./describe-error";
import { formatClockTime, formatCount, formatUptime } from "./format";
import { cursorListOptions, cursorPageSchema, type CursorPage } from "./pagination";
import { createQueryClient, shouldRetry } from "./query-client";
import { adminKeys, systemKeys } from "./query-keys";
import { paginate } from "@/mocks/admin/_factory";
import { z } from "zod";

const err = (status: number, code = `HTTP_${status}`) => new ApiError({ status, code });

describe("query client defaults (plan 0001 §15)", () => {
  it("uses the documented defaults", () => {
    const options = createQueryClient().getDefaultOptions();
    expect(options.queries).toMatchObject({ staleTime: 30_000, gcTime: 300_000, refetchOnWindowFocus: true });
    expect(options.mutations?.retry).toBe(false);
  });

  it("never retries a 4xx, including 429", () => {
    expect(shouldRetry(0, err(400))).toBe(false);
    expect(shouldRetry(0, err(404))).toBe(false);
    expect(shouldRetry(0, err(429, ErrorCode.RateLimited))).toBe(false);
  });

  it("retries a 5xx, a network failure and a plain error once", () => {
    expect(shouldRetry(0, err(500))).toBe(true);
    expect(shouldRetry(1, err(500))).toBe(false);
    expect(shouldRetry(0, err(503, ErrorCode.BackendUnreachable))).toBe(true);
    expect(shouldRetry(0, new Error("boom"))).toBe(true);
    expect(shouldRetry(1, new Error("boom"))).toBe(false);
  });

  it("does not retry a throttled query at all", async () => {
    const client = createQueryClient();
    let calls = 0;
    await expect(
      client.fetchQuery({
        queryKey: ["t"],
        queryFn: () => {
          calls += 1;
          throw err(429, ErrorCode.RateLimited);
        },
      }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(calls).toBe(1);
  });
});

describe("query keys", () => {
  it("are stable, prefix-structured arrays", () => {
    expect(adminKeys.summary()).toEqual(["admin", "summary"]);
    expect(systemKeys.health()).toEqual(["system", "health"]);
  });
});

describe("cursor list", () => {
  const rows = Array.from({ length: 5 }, (_, i) => i + 1);

  it("walks {data, nextCursor} pages until nextCursor is null", async () => {
    const seen: Array<string | undefined> = [];
    const options = cursorListOptions<number>({
      queryKey: ["rows"],
      fetchPage: async (cursor) => {
        seen.push(cursor);
        return paginate(rows, { cursor, limit: 2 });
      },
    });
    const client = new QueryClient();
    const result = await client.fetchInfiniteQuery({ ...options, pages: 5 });
    expect(seen).toEqual([undefined, "2", "4"]);
    expect(result.pages.flatMap((p) => p.data)).toEqual(rows);
    expect(result.pages.at(-1)?.nextCursor).toBeNull();
  });

  it("validates the envelope", () => {
    const schema = cursorPageSchema(z.object({ id: z.string() }));
    const ok: CursorPage<{ id: string }> = { data: [{ id: "a" }], nextCursor: null };
    expect(schema.parse(ok)).toEqual(ok);
    expect(schema.safeParse({ data: [{ id: 1 }], nextCursor: null }).success).toBe(false);
    expect(schema.safeParse({ data: [] }).success).toBe(false);
  });
});

describe("describeError", () => {
  it("shows the wait time for a 429", () => {
    expect(describeError(new ApiError({ status: 429, code: ErrorCode.RateLimited, retryAfter: 12 }), "x").description).toContain("12 seconds");
    expect(describeError(new ApiError({ status: 429, code: ErrorCode.RateLimited, retryAfter: 1 }), "x").description).toContain("1 second ");
  });

  it("decides by code, with a generic fallback", () => {
    expect(describeError(err(503, ErrorCode.BackendUnreachable), "the dashboard").title).toBe("Service unavailable");
    expect(describeError(err(500), "dashboard").title).toBe("Unable to load dashboard");
    expect(describeError(new Error("x"), "dashboard").title).toBe("Unable to load dashboard");
  });
});

describe("format", () => {
  it("formats uptime", () => {
    expect(formatUptime(0)).toBe("0s");
    expect(formatUptime(45)).toBe("45s");
    expect(formatUptime(3_725)).toBe("1h 2m");
    expect(formatUptime(93_784)).toBe("1d 2h");
  });

  it("renders zero as 0", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(1234)).toBe("1,234");
  });

  it("formats a clock time", () => {
    expect(formatClockTime(Date.UTC(2026, 0, 1, 10, 5, 9))).toMatch(/^\d\d:\d\d:\d\d$/);
  });
});
