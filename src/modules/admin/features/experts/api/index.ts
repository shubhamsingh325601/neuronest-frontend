import { isMockFeature } from "../../../config/data-source";
import { liveExpertApi } from "./live";
import type { ExpertApi } from "./types";

export async function getExpertApi(): Promise<ExpertApi> {
  // The literal env test must stay inline: the bundler folds it to false in a live build and drops the import.
  if (process.env.NEXT_PUBLIC_ADMIN_DATA_SOURCE === "mock" || process.env.NEXT_PUBLIC_ADMIN_MOCK_FEATURES) {
    if (isMockFeature("experts")) return (await import("@/mocks/admin/experts")).mockExpertApi;
  }
  return liveExpertApi;
}
