import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api-errors";
import type { SessionTokens } from "./backend-auth";
import { MEMO_TTL_MS, refreshTokens, resetRefreshState } from "./refresh";

const pair = (n: number): SessionTokens => ({ accessToken: `at-${n}`, refreshToken: `rt-${n}`, tokenType: "Bearer", expiresIn: 900 });

beforeEach(() => resetRefreshState());

describe("refreshTokens", () => {
  it("shares one backend call between concurrent callers with the same refresh token", async () => {
    let release!: (tokens: SessionTokens) => void;
    const call = vi.fn(() => new Promise<SessionTokens>((resolve) => (release = resolve)));

    const results = Promise.all([
      refreshTokens("rt-0", { call }),
      refreshTokens("rt-0", { call }),
      refreshTokens("rt-0", { call }),
    ]);
    release(pair(1));

    const outcomes = await results;
    expect(call).toHaveBeenCalledTimes(1);
    expect(call).toHaveBeenCalledWith("rt-0");
    for (const outcome of outcomes) expect(outcome).toEqual({ ok: true, tokens: pair(1) });
  });

  it("answers a late request that still carries the old token from the memo instead of replaying it", async () => {
    const call = vi.fn(async () => pair(1));
    let now = 1_000;
    await refreshTokens("rt-0", { call, now: () => now });

    now += MEMO_TTL_MS - 1;
    const late = await refreshTokens("rt-0", { call, now: () => now });
    expect(late).toEqual({ ok: true, tokens: pair(1) });
    expect(call).toHaveBeenCalledTimes(1);
  });

  it("forgets the memo after its TTL", async () => {
    const call = vi.fn(async () => pair(1));
    let now = 1_000;
    await refreshTokens("rt-0", { call, now: () => now });
    now += MEMO_TTL_MS + 1;
    await refreshTokens("rt-0", { call, now: () => now });
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("keeps different refresh tokens apart", async () => {
    const call = vi.fn(async (token: string) => pair(token === "rt-a" ? 1 : 2));
    const [a, b] = await Promise.all([refreshTokens("rt-a", { call }), refreshTokens("rt-b", { call })]);
    expect(call).toHaveBeenCalledTimes(2);
    expect(a).toEqual({ ok: true, tokens: pair(1) });
    expect(b).toEqual({ ok: true, tokens: pair(2) });
  });

  it("shares a failure with concurrent callers but does not memoise it", async () => {
    const error = new ApiError({ status: 401, code: "INVALID_REFRESH_TOKEN" });
    const call = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(pair(2));

    const [first, second] = await Promise.all([
      refreshTokens("rt-0", { call }),
      refreshTokens("rt-0", { call }),
    ]);
    expect(call).toHaveBeenCalledTimes(1);
    expect(first).toEqual({ ok: false, error });
    expect(second).toEqual({ ok: false, error });

    const retry = await refreshTokens("rt-0", { call });
    expect(retry).toEqual({ ok: true, tokens: pair(2) });
  });

  it("rethrows non-API errors", async () => {
    await expect(refreshTokens("rt-0", { call: () => Promise.reject(new TypeError("boom")) })).rejects.toThrow("boom");
  });
});
