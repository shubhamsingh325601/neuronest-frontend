import { apiClient } from "../../../lib/api-client";
import {
  callLogPageSchema,
  mediaPageSchema,
  planDetailSchema,
  planNotePageSchema,
  planPageSchema,
  type ChildRecordsApi,
} from "./types";

const enc = encodeURIComponent;

export const liveChildRecordsApi: ChildRecordsApi = {
  plans: (childId, { cursor, limit, status }, signal) =>
    apiClient.get(`children/${enc(childId)}/plans`, { query: { cursor, limit, status }, schema: planPageSchema, signal }),
  plan: (id, signal) => apiClient.get(`plans/${enc(id)}`, { schema: planDetailSchema, signal }),
  notes: (planId, { cursor, limit }, signal) =>
    apiClient.get(`plans/${enc(planId)}/notes`, { query: { cursor, limit }, schema: planNotePageSchema, signal }),
  media: (childId, { cursor, limit }, signal) =>
    apiClient.get(`children/${enc(childId)}/media`, { query: { cursor, limit }, schema: mediaPageSchema, signal }),
  callLogs: (childId, { cursor, limit }, signal) =>
    apiClient.get(`children/${enc(childId)}/call-logs`, { query: { cursor, limit }, schema: callLogPageSchema, signal }),
};
