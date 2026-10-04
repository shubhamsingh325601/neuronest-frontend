import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "./api-errors";

// TanStack Query defaults (plan 0001 §15). One client per browser session (see providers/providers.tsx).

/** Never retry a 4xx (including 429: a throttled call must be shown, not hammered); retry anything else once. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
  return failureCount < 1;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: shouldRetry,
      },
      // Mutations are never retried automatically.
      mutations: { retry: false },
    },
  });
}
