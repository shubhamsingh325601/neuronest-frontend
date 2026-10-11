import { isMockFeature } from "../../../config/data-source";
import { liveChildRecordsApi } from "./live";
import type { ChildRecordsApi } from "./types";

export async function getChildRecordsApi(): Promise<ChildRecordsApi> {
  // The literal env test must stay inline: the bundler folds it to false in a live build and drops the import.
  if (process.env.NEXT_PUBLIC_ADMIN_DATA_SOURCE === "mock" || process.env.NEXT_PUBLIC_ADMIN_MOCK_FEATURES) {
    if (isMockFeature("child-records")) return (await import("@/mocks/admin/child-records")).mockChildRecordsApi;
  }
  return liveChildRecordsApi;
}
