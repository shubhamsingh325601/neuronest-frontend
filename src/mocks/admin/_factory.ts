import { ApiError } from "@/modules/admin/lib/api-errors";
import type { CursorPage } from "@/modules/admin/lib/pagination";

// Shared helpers for the mock implementations of each feature's XApi (plan 0001 §18). A mock implements the
// same interface as live.ts over an in-memory store, so components cannot tell the difference. Mocks are only
// ever imported dynamically behind config/data-source.ts, so they never enter a live bundle.

/** Resolves after `ms`, or rejects with an AbortError when the signal fires (like a cancelled fetch). */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

export const MOCK_LATENCY_MS = 300;

/** Cursor pagination over an array: the cursor is the offset of the next row. */
export function paginate<T>(items: readonly T[], { cursor, limit = 20 }: { cursor?: string; limit?: number }): CursorPage<T> {
  const start = cursor ? Number.parseInt(cursor, 10) || 0 : 0;
  const end = start + limit;
  return { data: items.slice(start, end), nextCursor: end < items.length ? String(end) : null };
}

/** A backend-shaped failure, for error-state tests and demos. */
export function mockError(status: number, code: string, detail?: string, retryAfter?: number): ApiError {
  return new ApiError({ status, code, detail, retryAfter });
}
