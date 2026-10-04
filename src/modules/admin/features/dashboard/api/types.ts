import { z } from "zod";

// GET /v1/admin/summary: fixed flat counts (backend get-summary DTO). The backend also returns `deadJobs`;
// no screen uses it yet, and zod drops unknown keys.
export const adminSummarySchema = z.object({
  invitedClinicians: z.number().int().nonnegative(),
  activeClinicians: z.number().int().nonnegative(),
  activeParents: z.number().int().nonnegative(),
  activePlans: z.number().int().nonnegative(),
  childrenWithAssignedClinician: z.number().int().nonnegative(),
  childrenWithoutClinician: z.number().int().nonnegative(),
});

export type AdminSummary = z.infer<typeof adminSummarySchema>;

export interface DashboardApi {
  getSummary(signal?: AbortSignal): Promise<AdminSummary>;
}
