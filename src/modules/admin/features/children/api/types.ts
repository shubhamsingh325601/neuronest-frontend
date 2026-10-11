import { z } from "zod";
import { cursorPageSchema, type CursorPage } from "../../../lib/pagination";

// Contract: docs/api-1.json (ChildDto, ListChildrenResponseDto, ClinicianChildAssignmentDto, AssignClinicianDto).

export const childSchema = z.object({
  id: z.string(),
  parentId: z.string(),
  name: z.string(),
  dateOfBirth: z.string(),
  preferredName: z.string().nullable(),
  gender: z.string().nullable(),
  primaryLanguage: z.string().nullable(),
  accommodations: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Child = z.infer<typeof childSchema>;

export const childPageSchema = cursorPageSchema(childSchema);

export const assignmentSchema = z.object({
  id: z.string(),
  clinicianId: z.string(),
  childId: z.string(),
  createdAt: z.string(),
});
export type Assignment = z.infer<typeof assignmentSchema>;

export const assignmentListSchema = z.array(assignmentSchema);

export interface ChildApi {
  list(params: { cursor?: string; limit?: number }, signal?: AbortSignal): Promise<CursorPage<Child>>;
  get(id: string, signal?: AbortSignal): Promise<Child>;
  careTeam(childId: string, signal?: AbortSignal): Promise<Assignment[]>;
  /** 201. 409 when the clinician is already on the team, 404 for an unknown clinician or child. */
  assign(childId: string, clinicianId: string): Promise<Assignment>;
  /** 204, idempotent. */
  revoke(childId: string, clinicianId: string): Promise<void>;
}
