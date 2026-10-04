"use client";

import { useQuery } from "@tanstack/react-query";
import { adminKeys } from "../../../lib/query-keys";
import { getDashboardApi } from "../api";

export function useAdminSummaryQuery() {
  return useQuery({
    queryKey: adminKeys.summary(),
    queryFn: async ({ signal }) => (await getDashboardApi()).getSummary(signal),
  });
}
