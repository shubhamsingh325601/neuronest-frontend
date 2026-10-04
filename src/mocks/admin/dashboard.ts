import type { AdminSummary, DashboardApi } from "@/modules/admin/features/dashboard/api/types";
import { MOCK_LATENCY_MS, delay } from "./_factory";

// TEMPORARY sample numbers (plan 0001 §18). Shown only when the data-source flags select mock data for the
// Dashboard; the MockDataChip is lit whenever that is so.
let summary: AdminSummary = {
  invitedClinicians: 3,
  activeClinicians: 12,
  activeParents: 48,
  activePlans: 31,
  childrenWithAssignedClinician: 40,
  childrenWithoutClinician: 0,
};

export const mockDashboardApi: DashboardApi = {
  async getSummary(signal) {
    await delay(MOCK_LATENCY_MS, signal);
    return { ...summary };
  },
};

/** Test hook: replace the sample numbers. */
export function setMockSummary(next: AdminSummary): void {
  summary = next;
}
