"use client";

import { useQuery } from "@tanstack/react-query";
import { DEFAULT_PAGE_SIZE, useCursorList } from "../../../lib/pagination";
import { childRecordKeys } from "../../../lib/query-keys";
import { getChildRecordsApi } from "../api";
import type { PlanStatus } from "../api/types";

export function usePlansQuery(childId: string, status?: PlanStatus) {
  return useCursorList({
    queryKey: childRecordKeys.plans(childId, status),
    fetchPage: async (cursor, signal) =>
      (await getChildRecordsApi()).plans(childId, { status, cursor, limit: DEFAULT_PAGE_SIZE }, signal),
  });
}

export function usePlanQuery(id: string) {
  return useQuery({
    queryKey: childRecordKeys.plan(id),
    queryFn: async ({ signal }) => (await getChildRecordsApi()).plan(id, signal),
  });
}

export function usePlanNotesQuery(planId: string) {
  return useCursorList({
    queryKey: childRecordKeys.notes(planId),
    fetchPage: async (cursor, signal) =>
      (await getChildRecordsApi()).notes(planId, { cursor, limit: DEFAULT_PAGE_SIZE }, signal),
  });
}

/** Playback URLs are minted per request and the response is no-store, so this list is refetched when the tab reopens. */
export function useMediaQuery(childId: string) {
  return useCursorList({
    queryKey: childRecordKeys.media(childId),
    fetchPage: async (cursor, signal) =>
      (await getChildRecordsApi()).media(childId, { cursor, limit: DEFAULT_PAGE_SIZE }, signal),
  });
}

export function useCallLogsQuery(childId: string) {
  return useCursorList({
    queryKey: childRecordKeys.callLogs(childId),
    fetchPage: async (cursor, signal) =>
      (await getChildRecordsApi()).callLogs(childId, { cursor, limit: DEFAULT_PAGE_SIZE }, signal),
  });
}
