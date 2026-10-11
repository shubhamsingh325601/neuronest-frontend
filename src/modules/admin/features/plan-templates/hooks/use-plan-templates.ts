"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DEFAULT_PAGE_SIZE, useCursorList } from "../../../lib/pagination";
import { planTemplateKeys } from "../../../lib/query-keys";
import { getPlanTemplateApi } from "../api";
import type { CreateTemplateInput, PlanTemplate } from "../api/types";

export function usePlanTemplatesQuery() {
  return useCursorList({
    queryKey: planTemplateKeys.list(),
    fetchPage: async (cursor, signal) => (await getPlanTemplateApi()).list({ cursor, limit: DEFAULT_PAGE_SIZE }, signal),
  });
}

export function usePlanTemplateQuery(id: string) {
  return useQuery({
    queryKey: planTemplateKeys.detail(id),
    queryFn: async ({ signal }) => (await getPlanTemplateApi()).get(id, signal),
  });
}

function useRefresh() {
  const queryClient = useQueryClient();
  return (template: PlanTemplate) => {
    queryClient.setQueryData(planTemplateKeys.detail(template.id), template);
    return queryClient.invalidateQueries({ queryKey: planTemplateKeys.lists() });
  };
}

export function useCreatePlanTemplate() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (input: CreateTemplateInput) => (await getPlanTemplateApi()).create(input),
    onSuccess: refresh,
  });
}

export function usePlanTemplateAction(id: string) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (action: "publish" | "archive") => {
      const api = await getPlanTemplateApi();
      return action === "publish" ? api.publish(id) : api.archive(id);
    },
    onSuccess: refresh,
  });
}
