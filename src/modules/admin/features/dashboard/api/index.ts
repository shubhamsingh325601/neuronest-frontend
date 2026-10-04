import { isMockFeature } from "../../../config/data-source";
import { liveDashboardApi } from "./live";
import type { DashboardApi } from "./types";

// The only place that chooses live or mock. The dynamic import keeps the mock module out of live bundles.
export async function getDashboardApi(): Promise<DashboardApi> {
  // The literal env test must stay inline: the bundler folds it to false in a live build and drops the import.
  if (process.env.NEXT_PUBLIC_ADMIN_DATA_SOURCE === "mock" || process.env.NEXT_PUBLIC_ADMIN_MOCK_FEATURES) {
    if (isMockFeature("dashboard")) return (await import("@/mocks/admin/dashboard")).mockDashboardApi;
  }
  return liveDashboardApi;
}
