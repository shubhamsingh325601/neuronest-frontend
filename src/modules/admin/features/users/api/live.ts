import { apiClient } from "../../../lib/api-client";
import { meSchema, userDetailSchema, userPageSchema, userStatusResultSchema, type UserApi } from "./types";

export const liveUserApi: UserApi = {
  list: ({ cursor, limit, role, status }, signal) =>
    apiClient.get("users", { query: { cursor, limit, role, status }, schema: userPageSchema, signal }),
  get: (id, signal) => apiClient.get(`users/${encodeURIComponent(id)}`, { schema: userDetailSchema, signal }),
  setStatus: (id, action) =>
    apiClient.post(`users/${encodeURIComponent(id)}/${action}`, { schema: userStatusResultSchema }),
  meId: async (signal) => (await apiClient.get("users/me", { schema: meSchema, signal })).id,
};
