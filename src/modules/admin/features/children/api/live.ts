import { apiClient } from "../../../lib/api-client";
import { assignmentListSchema, assignmentSchema, childPageSchema, childSchema, type ChildApi } from "./types";

const enc = encodeURIComponent;

export const liveChildApi: ChildApi = {
  list: ({ cursor, limit }, signal) => apiClient.get("children", { query: { cursor, limit }, schema: childPageSchema, signal }),
  get: (id, signal) => apiClient.get(`children/${enc(id)}`, { schema: childSchema, signal }),
  careTeam: (childId, signal) =>
    apiClient.get(`children/${enc(childId)}/clinicians`, { schema: assignmentListSchema, signal }),
  assign: (childId, clinicianId) =>
    apiClient.post(`children/${enc(childId)}/clinicians`, { body: { clinicianId }, schema: assignmentSchema }),
  revoke: async (childId, clinicianId) => {
    await apiClient.delete(`children/${enc(childId)}/clinicians/${enc(clinicianId)}`);
  },
};
