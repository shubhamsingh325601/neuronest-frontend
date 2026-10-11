import { accountSetupCallbackUrl } from "../../../lib/callback-url";
import { apiClient } from "../../../lib/api-client";
import { clinicianDetailSchema, clinicianPageSchema, clinicianStatusResultSchema, type ClinicianApi } from "./types";

export const liveClinicianApi: ClinicianApi = {
  list: ({ cursor, limit, status, q }, signal) =>
    apiClient.get("clinicians", { query: { cursor, limit, status, q }, schema: clinicianPageSchema, signal }),
  create: (input) =>
    apiClient.post("clinicians", { body: { ...input, callbackUrl: accountSetupCallbackUrl() }, schema: clinicianDetailSchema }),
  get: (id, signal) =>
    apiClient.get(`clinicians/${encodeURIComponent(id)}`, { schema: clinicianDetailSchema, signal }),
  update: (id, input) =>
    apiClient.patch(`clinicians/${encodeURIComponent(id)}`, { body: input, schema: clinicianDetailSchema }),
  resendInvitation: async (id) => {
    await apiClient.post(`clinicians/${encodeURIComponent(id)}/resend-invitation`, {
      body: { callbackUrl: accountSetupCallbackUrl() },
    });
  },
  setStatus: (id, action) =>
    apiClient.post(`users/${encodeURIComponent(id)}/${action}`, { schema: clinicianStatusResultSchema }),
};
