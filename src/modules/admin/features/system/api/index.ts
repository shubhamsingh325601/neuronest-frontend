import { isMockFeature } from "../../../config/data-source";
import { liveSystemApi } from "./live";
import type { SystemApi } from "./types";

export async function getSystemApi(): Promise<SystemApi> {
  // The literal env test must stay inline: the bundler folds it to false in a live build and drops the import.
  if (process.env.NEXT_PUBLIC_ADMIN_DATA_SOURCE === "mock" || process.env.NEXT_PUBLIC_ADMIN_MOCK_FEATURES) {
    if (isMockFeature("system")) return (await import("@/mocks/admin/system")).mockSystemApi;
  }
  return liveSystemApi;
}
