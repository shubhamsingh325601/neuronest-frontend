"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DEFAULT_PAGE_SIZE, useCursorList } from "../../../lib/pagination";
import { childKeys, clinicianKeys, userKeys } from "../../../lib/query-keys";
import { liveChildApi } from "../api/live";

export function useChildrenQuery() {
  return useCursorList({
    queryKey: childKeys.list(),
    fetchPage: (cursor, signal) => liveChildApi.list({ cursor, limit: DEFAULT_PAGE_SIZE }, signal),
  });
}

export function useChildQuery(id: string) {
  return useQuery({ queryKey: childKeys.detail(id), queryFn: ({ signal }) => liveChildApi.get(id, signal) });
}

export function useCareTeamQuery(childId: string) {
  return useQuery({ queryKey: childKeys.careTeam(childId), queryFn: ({ signal }) => liveChildApi.careTeam(childId, signal) });
}

/** Assign / revoke change the child's team and the clinician's (and parent's) assigned-children lists. */
function useInvalidateTeam(childId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: childKeys.careTeam(childId) }),
      queryClient.invalidateQueries({ queryKey: clinicianKeys.all }),
      queryClient.invalidateQueries({ queryKey: userKeys.all }),
    ]);
}

export function useAssignClinician(childId: string) {
  const invalidate = useInvalidateTeam(childId);
  return useMutation({
    mutationFn: (clinicianId: string) => liveChildApi.assign(childId, clinicianId),
    onSuccess: invalidate,
  });
}

export function useRevokeClinician(childId: string) {
  const invalidate = useInvalidateTeam(childId);
  return useMutation({
    mutationFn: (clinicianId: string) => liveChildApi.revoke(childId, clinicianId),
    onSuccess: invalidate,
  });
}
