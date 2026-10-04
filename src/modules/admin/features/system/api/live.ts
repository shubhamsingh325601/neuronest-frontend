import { ErrorCode, isApiError } from "../../../lib/api-errors";
import { apiClient } from "../../../lib/api-client";
import { healthReportSchema, type HealthReport, type HealthSnapshot, type SystemApi } from "./types";

function fromReport(report: HealthReport): HealthSnapshot {
  return {
    state: report.status === "ok" && report.db === "up" ? "operational" : "degraded",
    api: "up",
    database: report.db,
    uptimeSeconds: report.uptime,
    reportedAt: report.timestamp,
  };
}

const DOWN: HealthSnapshot = { state: "down", api: "down", database: "unknown", uptimeSeconds: null, reportedAt: null };

export const liveSystemApi: SystemApi = {
  async getHealth(signal) {
    try {
      return fromReport(await apiClient.get("health", { schema: healthReportSchema, signal }));
    } catch (error) {
      if (!isApiError(error)) throw error;
      // The backend could not be reached: the platform is down, which is a result, not a failure to load.
      if (error.code === ErrorCode.BackendUnreachable) return DOWN;
      // 503 carrying a health body: the API is up but its database is not.
      if (error.status === 503) {
        const report = healthReportSchema.safeParse(error.body);
        if (report.success) return fromReport(report.data);
      }
      throw error;
    }
  },
};
