import { isMockFeature } from "../../../config/data-source";
import { livePlanTemplateApi } from "./live";
import type { PlanTemplateApi } from "./types";

export async function getPlanTemplateApi(): Promise<PlanTemplateApi> {
  // The literal env test must stay inline: the bundler folds it to false in a live build and drops the import.
  if (process.env.NEXT_PUBLIC_ADMIN_DATA_SOURCE === "mock" || process.env.NEXT_PUBLIC_ADMIN_MOCK_FEATURES) {
    if (isMockFeature("plan-templates")) return (await import("@/mocks/admin/plan-templates")).mockPlanTemplateApi;
  }
  return livePlanTemplateApi;
}
