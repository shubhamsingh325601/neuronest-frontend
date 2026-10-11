import { isMockFeature } from "../../../config/data-source";
import { liveClinicianApi } from "./live";
import type { ClinicianApi } from "./types";

export async function getClinicianApi(): Promise<ClinicianApi> {
  // The literal env test must stay inline: the bundler folds it to false in a live build and drops the import.
  if (process.env.NEXT_PUBLIC_ADMIN_DATA_SOURCE === "mock" || process.env.NEXT_PUBLIC_ADMIN_MOCK_FEATURES) {
    if (isMockFeature("clinicians")) return (await import("@/mocks/admin/clinicians")).mockClinicianApi;
  }
  return liveClinicianApi;
}
