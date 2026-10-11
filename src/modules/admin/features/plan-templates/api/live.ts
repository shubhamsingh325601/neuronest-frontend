import { apiClient } from "../../../lib/api-client";
import { templatePageSchema, templateSchema, type PlanTemplateApi } from "./types";

const enc = encodeURIComponent;

export const livePlanTemplateApi: PlanTemplateApi = {
  list: ({ cursor, limit }, signal) =>
    apiClient.get("plan-templates", { query: { cursor, limit }, schema: templatePageSchema, signal }),
  get: (id, signal) => apiClient.get(`plan-templates/${enc(id)}`, { schema: templateSchema, signal }),
  create: (input) => apiClient.post("plan-templates", { body: input, schema: templateSchema }),
  publish: (id) => apiClient.post(`plan-templates/${enc(id)}/publish`, { schema: templateSchema }),
  archive: (id) => apiClient.post(`plan-templates/${enc(id)}/archive`, { schema: templateSchema }),
};
