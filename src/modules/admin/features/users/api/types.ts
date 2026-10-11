import { z } from "zod";
import { cursorPageSchema, type CursorPage } from "../../../lib/pagination";

// Contract: docs/api-1.json (UserSummaryDto, UserDetailDto, UserStatusResponseDto, ListUsersResponseDto).

export const USER_ROLES = ["PARENT", "CLINICIAN", "EXPERT", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["ACTIVE", "INVITED", "SUSPENDED", "DEACTIVATED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const userSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(USER_ROLES),
  status: z.enum(USER_STATUSES),
  createdAt: z.string(),
});
export type UserSummary = z.infer<typeof userSummarySchema>;

export const userPageSchema = cursorPageSchema(userSummarySchema);

export const userDetailSchema = userSummarySchema.extend({
  childId: z.string().nullable(),
  assignedChildIds: z.array(z.string()),
});
export type UserDetail = z.infer<typeof userDetailSchema>;

export const userStatusResultSchema = z.object({ id: z.string(), status: z.enum(USER_STATUSES), updatedAt: z.string() });

export const meSchema = z.object({ id: z.string() }).passthrough();

export type UserAction = "suspend" | "reactivate";

export interface ListUsersParams {
  cursor?: string;
  limit?: number;
  role?: UserRole;
  status?: UserStatus;
}

export interface UserApi {
  list(params: ListUsersParams, signal?: AbortSignal): Promise<CursorPage<UserSummary>>;
  get(id: string, signal?: AbortSignal): Promise<UserDetail>;
  setStatus(id: string, action: UserAction): Promise<z.infer<typeof userStatusResultSchema>>;
  /** Id of the signed-in admin, so the UI can refuse to suspend yourself. */
  meId(signal?: AbortSignal): Promise<string>;
}
