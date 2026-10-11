import { z } from "zod";
import { cursorPageSchema, type CursorPage } from "../../../lib/pagination";

// Contract: the sibling backend repo (plans/shared/plan.dto.ts, plan-note.dto.ts, media/shared/media.dto.ts,
// call-logs/shared/monthly-call-log.dto.ts) and docs/api-1.json. Read from code; not yet checked against a
// running backend. All four lists are cursor pages; the admin only reads here (writes are post-v1).

export const PLAN_STATUSES = ["ACTIVE", "COMPLETED", "ARCHIVED"] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];
export const PLAN_ORIGINS = ["MANUAL", "AI"] as const;

export const planSchema = z.object({
  id: z.string(),
  childId: z.string(),
  planTemplateId: z.string(),
  status: z.enum(PLAN_STATUSES),
  origin: z.enum(PLAN_ORIGINS),
  startDate: z.string(),
  createdById: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Plan = z.infer<typeof planSchema>;
export const planPageSchema = cursorPageSchema(planSchema);

export const planDaySchema = z.object({
  id: z.string(),
  dayNumber: z.number(),
  title: z.string(),
  instructions: z.string(),
  sectionId: z.string().nullable(),
  updatedAt: z.string(),
});
export type PlanDay = z.infer<typeof planDaySchema>;

export const planSectionSchema = z.object({ id: z.string(), title: z.string(), position: z.number() });
export type PlanSection = z.infer<typeof planSectionSchema>;

export const planDetailSchema = planSchema.extend({
  days: z.array(planDaySchema),
  sections: z.array(planSectionSchema),
});
export type PlanDetail = z.infer<typeof planDetailSchema>;

export const planNoteSchema = z.object({
  id: z.string(),
  planId: z.string(),
  authorId: z.string(),
  note: z.string(),
  createdAt: z.string(),
});
export type PlanNote = z.infer<typeof planNoteSchema>;
export const planNotePageSchema = cursorPageSchema(planNoteSchema);

export const MEDIA_TYPES = ["PHOTO", "VIDEO"] as const;
export const MEDIA_STATUSES = ["PENDING", "UPLOADED", "FAILED"] as const;
export type MediaStatus = (typeof MEDIA_STATUSES)[number];

export const mediaSchema = z.object({
  id: z.string(),
  childId: z.string(),
  uploadedById: z.string(),
  type: z.enum(MEDIA_TYPES),
  provider: z.string(),
  status: z.enum(MEDIA_STATUSES),
  mimeType: z.string().nullable(),
  durationSeconds: z.number().nullable(),
  sizeBytes: z.number().nullable(),
  context: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  /** Minted fresh per request; null unless status is UPLOADED. The response is no-store. */
  playbackUrl: z.string().nullable(),
});
export type Media = z.infer<typeof mediaSchema>;
export const mediaPageSchema = cursorPageSchema(mediaSchema);

export const callLogSchema = z.object({
  id: z.string(),
  childId: z.string(),
  clinicianId: z.string(),
  calledAt: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type CallLog = z.infer<typeof callLogSchema>;
export const callLogPageSchema = cursorPageSchema(callLogSchema);

export interface PageParams {
  cursor?: string;
  limit?: number;
}

export interface ChildRecordsApi {
  plans(childId: string, params: PageParams & { status?: PlanStatus }, signal?: AbortSignal): Promise<CursorPage<Plan>>;
  plan(id: string, signal?: AbortSignal): Promise<PlanDetail>;
  /** Oldest first. */
  notes(planId: string, params: PageParams, signal?: AbortSignal): Promise<CursorPage<PlanNote>>;
  media(childId: string, params: PageParams, signal?: AbortSignal): Promise<CursorPage<Media>>;
  /** Newest first. */
  callLogs(childId: string, params: PageParams, signal?: AbortSignal): Promise<CursorPage<CallLog>>;
}
