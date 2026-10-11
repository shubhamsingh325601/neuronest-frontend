import { z } from "zod";
import { cursorPageSchema, type CursorPage } from "../../../lib/pagination";

// Contract: the sibling backend repo (plans/shared/plan-template.dto.ts and the create / list / get / publish /
// archive features) and docs/api-1.json. Read from code; not yet checked against a running backend. Admin sees
// every status; the list has no status filter and is newest first, with days included in each row.

export const TEMPLATE_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number];

export const templateDaySchema = z.object({
  id: z.string(),
  dayNumber: z.number(),
  title: z.string(),
  instructions: z.string(),
  sectionId: z.string().nullable(),
});
export type TemplateDay = z.infer<typeof templateDaySchema>;

export const templateSectionSchema = z.object({ id: z.string(), title: z.string(), position: z.number() });
export type TemplateSection = z.infer<typeof templateSectionSchema>;

export const templateSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(TEMPLATE_STATUSES),
  createdById: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  days: z.array(templateDaySchema),
  sections: z.array(templateSectionSchema),
});
export type PlanTemplate = z.infer<typeof templateSchema>;

export const templatePageSchema = cursorPageSchema(templateSchema);

/** Backend limits (CreatePlanTemplateDto and its day / section inputs). */
export const TEMPLATE_LIMITS = {
  title: 200,
  description: 2000,
  sectionTitle: 200,
  maxDays: 365,
} as const;

export interface CreateTemplateInput {
  title: string;
  description?: string;
  /** Position is the 1-based index in this array. */
  sections?: { title: string }[];
  /** `dayNumber`s must be a contiguous 1..N set; `sectionPosition` points into `sections` (1-based). */
  days: { dayNumber: number; title: string; instructions: string; sectionPosition?: number }[];
}

export interface PlanTemplateApi {
  list(params: { cursor?: string; limit?: number }, signal?: AbortSignal): Promise<CursorPage<PlanTemplate>>;
  get(id: string, signal?: AbortSignal): Promise<PlanTemplate>;
  /** 201, always a DRAFT. 400 VALIDATION_ERROR for broken content. */
  create(input: CreateTemplateInput): Promise<PlanTemplate>;
  /** 200, one-way gate: a published template's days cannot be edited. Idempotent when already published. */
  publish(id: string): Promise<PlanTemplate>;
  /** 200, terminal: valid from DRAFT or PUBLISHED, no un-archive route. Idempotent when already archived. */
  archive(id: string): Promise<PlanTemplate>;
}
