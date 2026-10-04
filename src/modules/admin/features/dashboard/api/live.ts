import { apiClient } from "../../../lib/api-client";
import { adminSummarySchema, type DashboardApi } from "./types";

export const liveDashboardApi: DashboardApi = {
  getSummary: (signal) => apiClient.get("admin/summary", { schema: adminSummarySchema, signal }),
};
