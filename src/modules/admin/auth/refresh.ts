import "server-only";
import { createHash } from "node:crypto";
import { ApiError } from "../lib/api-errors";
import { refresh as backendRefresh, type SessionTokens } from "./backend-auth";

// Refresh is the dangerous part of the session design (plan 0001 §16): the backend ROTATES refresh tokens,
// reuse of a rotated one revokes the whole family, and /v1/auth/* allows only 5 requests / 60 s per IP.
// So every refresh goes through here:
//   - single-flight: concurrent callers presenting the same refresh token share ONE backend call;
//   - memo: for MEMO_TTL_MS after a success the old token maps to the new tokens, so a request that was
//     already in flight with the old cookie gets the new pair instead of replaying the old token.
// The proxy never refreshes. State is in-process (globalThis, so every route bundle shares it); on a
// multi-instance deployment two instances can still race and revoke the family. See docs/data-layer.md.

export const MEMO_TTL_MS = 10_000;

export type RefreshOutcome = { ok: true; tokens: SessionTokens } | { ok: false; error: ApiError };

interface RefreshState {
  inflight: Map<string, Promise<RefreshOutcome>>;
  memo: Map<string, { at: number; tokens: SessionTokens }>;
}

const globalState = globalThis as typeof globalThis & { __nnAdminRefresh?: RefreshState };
const state: RefreshState = (globalState.__nnAdminRefresh ??= { inflight: new Map(), memo: new Map() });

const fingerprint = (token: string) => createHash("sha256").update(token).digest("hex");

export interface RefreshDeps {
  call?: (refreshToken: string) => Promise<SessionTokens>;
  now?: () => number;
}

export async function refreshTokens(refreshToken: string, deps: RefreshDeps = {}): Promise<RefreshOutcome> {
  const call = deps.call ?? backendRefresh;
  const now = (deps.now ?? Date.now)();
  const key = fingerprint(refreshToken);

  for (const [memoKey, entry] of state.memo) if (now - entry.at > MEMO_TTL_MS) state.memo.delete(memoKey);

  const memoised = state.memo.get(key);
  if (memoised) return { ok: true, tokens: memoised.tokens };

  const running = state.inflight.get(key);
  if (running) return running;

  const flight = (async (): Promise<RefreshOutcome> => {
    try {
      const tokens = await call(refreshToken);
      state.memo.set(key, { at: now, tokens });
      return { ok: true, tokens };
    } catch (error) {
      if (error instanceof ApiError) return { ok: false, error };
      throw error;
    } finally {
      state.inflight.delete(key);
    }
  })();
  state.inflight.set(key, flight);
  return flight;
}

/** Test helper. */
export function resetRefreshState() {
  state.inflight.clear();
  state.memo.clear();
}
