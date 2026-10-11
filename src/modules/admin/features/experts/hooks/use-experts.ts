"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DEFAULT_PAGE_SIZE, useCursorList } from "../../../lib/pagination";
import { childKeys, expertKeys, userKeys } from "../../../lib/query-keys";
import { getExpertApi } from "../api";
import type { CreateExpertInput, ExpertAction, ExpertStatus, UpdateExpertInput } from "../api/types";

export interface ExpertFilters {
  status?: ExpertStatus;
  q?: string;
}

export function useExpertsQuery(filters: ExpertFilters) {
  return useCursorList({
    queryKey: expertKeys.list(filters),
    fetchPage: async (cursor, signal) =>
      (await getExpertApi()).list({ ...filters, cursor, limit: DEFAULT_PAGE_SIZE }, signal),
  });
}

export function useExpertQuery(id: string) {
  return useQuery({
    queryKey: expertKeys.detail(id),
    queryFn: async ({ signal }) => (await getExpertApi()).get(id, signal),
  });
}

/** An expert is also a row in the Users directory, so every change refreshes both. */
function useRefresh() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: expertKeys.all }),
      queryClient.invalidateQueries({ queryKey: userKeys.all }),
      queryClient.invalidateQueries({ queryKey: childKeys.allExperts() }),
    ]);
}

/** A child's expert team (assignment rows), for the child page. */
export function useChildExpertsQuery(childId: string) {
  return useQuery({
    queryKey: childKeys.experts(childId),
    queryFn: async ({ signal }) => (await getExpertApi()).forChild(childId, signal),
  });
}

export function useCreateExpert() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (input: CreateExpertInput) => (await getExpertApi()).create(input),
    onSuccess: refresh,
  });
}

export function useUpdateExpert(id: string) {
  const queryClient = useQueryClient();
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (input: UpdateExpertInput) => (await getExpertApi()).update(id, input),
    onSuccess: (detail) => {
      queryClient.setQueryData(expertKeys.detail(id), detail);
      return refresh();
    },
  });
}

export function useExpertStatus(id: string) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (action: ExpertAction) => (await getExpertApi()).setStatus(id, action),
    onSuccess: refresh,
  });
}

export function useResetExpertPassword(id: string) {
  return useMutation({
    mutationFn: async (newPassword: string) => (await getExpertApi()).resetPassword(id, newPassword),
  });
}

export function useSetExpertChildren(id: string) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (childIds: string[]) => (await getExpertApi()).setChildren(id, childIds),
    onSuccess: refresh,
  });
}
