import { z } from "zod";
import { cursorPageSchema, type CursorPage } from "../../../lib/pagination";

// Contract: the sibling backend repo (src/modules/experts, children/features/list-child-experts); docs/api-1.json
// predates it. Read from that code, not yet checked against a running backend. An expert is a user with role
// EXPERT whom an admin creates directly with a password: no invitation, no email, ACTIVE at once. Status changes
// use the users endpoints; a new password goes through POST /experts/{id}/reset-password.

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

/** One expert-child link (ExpertChildAssignmentDto). */
export const expertAssignmentSchema = z.object({
  id: z.string(),
  expertId: z.string(),
  childId: z.string(),
  createdAt: z.string(),
});
export type ExpertAssignment = z.infer<typeof expertAssignmentSchema>;
export const expertAssignmentListSchema = z.array(expertAssignmentSchema);

export const expertStatusResultSchema = z.object({ id: z.string(), status: z.enum(EXPERT_STATUSES), updatedAt: z.string() });
export type ExpertStatusResult = z.infer<typeof expertStatusResultSchema>;

export const EXPERT_LIMITS = { name: 120, email: 254, passwordMin: 10, passwordMax: 128 } as const;

export interface CreateExpertInput {
  name: string;
  email: string;
  password: string;
}

/** PATCH body: only changed fields. The password is not editable here; see `resetPassword`. */
export interface UpdateExpertInput {
  name?: string;
  email?: string;
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
  /**
   * Sets the expert's complete child set in one transaction (max 500). 404 CHILD_NOT_FOUND for an unknown child;
   * 409 EXPERT_NOT_ACTIVE when the expert is suspended or deactivated (clearing the set is still allowed).
   */
  setChildren(id: string, childIds: string[]): Promise<ExpertAssignment[]>;
  /** The experts assigned to one child (GET /children/{id}/experts, unpaged). 404 CHILD_NOT_FOUND. */
  forChild(childId: string, signal?: AbortSignal): Promise<ExpertAssignment[]>;
  /** 204. The backend revokes the expert's refresh tokens. */
  resetPassword(id: string, newPassword: string): Promise<void>;
  /** Suspend / reactivate go through the users endpoints (an expert is a user). */
  setStatus(id: string, action: ExpertAction): Promise<ExpertStatusResult>;
}
