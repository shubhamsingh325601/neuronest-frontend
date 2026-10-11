import { apiClient } from "../../../lib/api-client";
import { expertAssignmentListSchema, expertDetailSchema, expertPageSchema, expertStatusResultSchema, type ExpertApi } from "./types";

const enc = encodeURIComponent;

export const liveExpertApi: ExpertApi = {
  list: ({ cursor, limit, status, q }, signal) =>
    apiClient.get("experts", { query: { cursor, limit, status, q }, schema: expertPageSchema, signal }),
  create: (input) => apiClient.post("experts", { body: input, schema: expertDetailSchema }),
  get: (id, signal) => apiClient.get(`experts/${enc(id)}`, { schema: expertDetailSchema, signal }),
  update: (id, input) => apiClient.patch(`experts/${enc(id)}`, { body: input, schema: expertDetailSchema }),
  setChildren: (id, childIds) =>
    apiClient.put(`experts/${enc(id)}/children`, { body: { childIds }, schema: expertAssignmentListSchema }),
  forChild: (childId, signal) =>
    apiClient.get(`children/${enc(childId)}/experts`, { schema: expertAssignmentListSchema, signal }),
  resetPassword: async (id, newPassword) => {
    await apiClient.post(`experts/${enc(id)}/reset-password`, { body: { newPassword } });
  },
  setStatus: (id, action) => apiClient.post(`users/${enc(id)}/${action}`, { schema: expertStatusResultSchema }),
};
