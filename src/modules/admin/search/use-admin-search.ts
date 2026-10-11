"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { searchKeys } from "../lib/query-keys";
import { runSearch, SEARCH_PROVIDERS } from "./run-search";

/** Grouped results for `query` across every provider. An empty query has no results. */
export function useAdminSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: searchKeys.query(trimmed),
    queryFn: ({ signal }) => runSearch(trimmed, SEARCH_PROVIDERS, signal),
    enabled: trimmed.length > 0,
    placeholderData: keepPreviousData,
    staleTime: Infinity, // navigation and actions never change while the app is open
  });
}
