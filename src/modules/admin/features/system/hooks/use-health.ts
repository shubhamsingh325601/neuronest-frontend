"use client";

import { useQuery } from "@tanstack/react-query";
import { ErrorCode, isApiError } from "../../../lib/api-errors";
import { systemKeys } from "../../../lib/query-keys";
import { getSystemApi } from "../api";

export const HEALTH_POLL_MS = 30_000;

/** Poll while the tab is visible (background tabs pause by default). A throttled call stops the polling until the user retries. */
export function nextHealthPoll(error: unknown): number | false {
  return isApiError(error) && error.code === ErrorCode.RateLimited ? false : HEALTH_POLL_MS;
}

export function useHealthQuery() {
  return useQuery({
    queryKey: systemKeys.health(),
    queryFn: async ({ signal }) => (await getSystemApi()).getHealth(signal),
    staleTime: 10_000,
    refetchInterval: (query) => nextHealthPoll(query.state.error),
  });
}
