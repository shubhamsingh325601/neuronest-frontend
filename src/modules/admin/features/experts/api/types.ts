import { z } from "zod";
import { cursorPageSchema, type CursorPage } from "../../../lib/pagination";

// PROVISIONAL contract: docs/api-1.json has no expert endpoints yet. This is the shape the Admin app expects
// (docs/plans/0001-admin-app.md, "Experts"). An expert is a user with role EXPERT whom an admin creates directly
// with a password: no invitation, no email, ACTIVE from the first moment. Status changes use the users endpoints.

export const EXPERT_STATUSES = ["ACTIVE", "SUSPENDED", "DEACTIVATED"] as const;
export type ExpertStatus = (typeof EXPERT_STATUSES)[number];

export const expertSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  status: z.enum(EXPERT_STATUSES),
  createdAt: z.string(),
});
export type Expert = z.infer<typeof expertSchema>;

export const expertPageSchema = cursorPageSchema(expertSchema);

export const expertDetailSchema = expertSchema.extend({
  lastLoginAt: z.string().nullable(),
  assignedChildIds: z.array(z.string()),
});
export type ExpertDetail = z.infer<typeof expertDetailSchema>;

export const expertChildrenSchema = z.object({ childIds: z.array(z.string()) });

export const expertStatusResultSchema = z.object({ id: z.string(), status: z.enum(EXPERT_STATUSES), updatedAt: z.string() });
export type ExpertStatusResult = z.infer<typeof expertStatusResultSchema>;

export const EXPERT_LIMITS = { name: 120, email: 254, passwordMin: 10, passwordMax: 128 } as const;

export interface CreateExpertInput {
  name: string;
  email: string;
  password: string;
}

/** PATCH body: only changed fields. `password` replaces the current one (the admin controls it directly). */
export interface UpdateExpertInput {
  name?: string;
  email?: string;
  password?: string;
}

export type ExpertAction = "suspend" | "reactivate";

export interface ListExpertsParams {
  cursor?: string;
  limit?: number;
  status?: ExpertStatus;
  q?: string;
}

export interface ExpertApi {
  list(params: ListExpertsParams, signal?: AbortSignal): Promise<CursorPage<Expert>>;
  create(input: CreateExpertInput): Promise<ExpertDetail>;
  get(id: string, signal?: AbortSignal): Promise<ExpertDetail>;
  update(id: string, input: UpdateExpertInput): Promise<ExpertDetail>;
  /** Replaces the expert's whole child set in one call. */
  setChildren(id: string, childIds: string[]): Promise<{ childIds: string[] }>;
  /** Suspend / reactivate go through the users endpoints (an expert is a user). */
  setStatus(id: string, action: ExpertAction): Promise<ExpertStatusResult>;
}
