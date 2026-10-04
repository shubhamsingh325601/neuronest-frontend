import type { HealthSnapshot, SystemApi } from "@/modules/admin/features/system/api/types";
import { MOCK_LATENCY_MS, delay } from "./_factory";

// TEMPORARY sample health (plan 0001 §18): always operational unless a test or demo sets a scenario.
let scenario: HealthSnapshot["state"] = "operational";

export const mockSystemApi: SystemApi = {
  async getHealth(signal) {
    await delay(MOCK_LATENCY_MS, signal);
    const now = new Date().toISOString();
    if (scenario === "down") return { state: "down", api: "down", database: "unknown", uptimeSeconds: null, reportedAt: null };
    return {
      state: scenario,
      api: "up",
      database: scenario === "degraded" ? "down" : "up",
      uptimeSeconds: 93_784,
      reportedAt: now,
    };
  },
};

/** Test / demo hook: choose which state the mock reports. */
export function setMockHealthScenario(next: HealthSnapshot["state"]): void {
  scenario = next;
}
