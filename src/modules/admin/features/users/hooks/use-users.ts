"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DEFAULT_PAGE_SIZE, useCursorList } from "../../../lib/pagination";
import { clinicianKeys, userKeys } from "../../../lib/query-keys";
import { liveUserApi } from "../api/live";
import type { UserAction, UserRole, UserStatus } from "../api/types";

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
}

export function useUsersQuery(filters: UserFilters) {
  return useCursorList({
    queryKey: userKeys.list(filters),
    fetchPage: (cursor, signal) => liveUserApi.list({ ...filters, cursor, limit: DEFAULT_PAGE_SIZE }, signal),
  });
}

export function useUserQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ""),
    queryFn: ({ signal }) => liveUserApi.get(id as string, signal),
    enabled: Boolean(id),
    staleTime: 5 * 60_000, // names rarely change; lets child rows share one lookup per parent
  });
}

export function useMeId() {
  return useQuery({ queryKey: userKeys.me(), queryFn: ({ signal }) => liveUserApi.meId(signal), staleTime: Infinity });
}

export function useUserStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: UserAction) => liveUserApi.setStatus(id, action),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: userKeys.all }),
        queryClient.invalidateQueries({ queryKey: clinicianKeys.all }),
      ]),
  });
}
