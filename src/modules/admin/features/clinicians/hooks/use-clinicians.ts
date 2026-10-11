"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DEFAULT_PAGE_SIZE, useCursorList } from "../../../lib/pagination";
import { clinicianKeys } from "../../../lib/query-keys";
import { getClinicianApi } from "../api";
import type { ClinicianAction, ClinicianStatus, CreateClinicianInput, UpdateClinicianInput } from "../api/types";

export interface ClinicianFilters {
  status?: ClinicianStatus;
  q?: string;
}

export function useCliniciansQuery(filters: ClinicianFilters) {
  return useCursorList({
    queryKey: clinicianKeys.list(filters),
    fetchPage: async (cursor, signal) =>
      (await getClinicianApi()).list({ ...filters, cursor, limit: DEFAULT_PAGE_SIZE }, signal),
  });
}

export function useInviteClinician() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateClinicianInput) => (await getClinicianApi()).create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clinicianKeys.all }),
  });
}

export function useClinicianQuery(id: string) {
  return useQuery({
    queryKey: clinicianKeys.detail(id),
    queryFn: async ({ signal }) => (await getClinicianApi()).get(id, signal),
  });
}

export function useUpdateClinician(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateClinicianInput) => (await getClinicianApi()).update(id, input),
    onSuccess: (detail) => {
      queryClient.setQueryData(clinicianKeys.detail(id), detail);
      return queryClient.invalidateQueries({ queryKey: clinicianKeys.all });
    },
  });
}

export function useResendInvitation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await getClinicianApi()).resendInvitation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clinicianKeys.all }),
  });
}

export function useClinicianStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (action: ClinicianAction) => (await getClinicianApi()).setStatus(id, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clinicianKeys.all }),
  });
}
