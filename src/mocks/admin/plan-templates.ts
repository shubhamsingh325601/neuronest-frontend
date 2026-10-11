import { ErrorCode } from "@/modules/admin/lib/api-errors";
import type { PlanTemplate, PlanTemplateApi } from "@/modules/admin/features/plan-templates/api/types";
import { MOCK_LATENCY_MS, delay, mockError, paginate } from "./_factory";

// TEMPORARY sample plan templates (plan 0001 §18), shown only when the data-source flags select mock data for
// "plan-templates". Created templates and status changes live in memory until the page reloads. Like the real
// backend: new templates are DRAFT, publish and archive are idempotent, and nothing can leave ARCHIVED.
const DAY = 86_400_000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();

const seed = (): PlanTemplate[] => [
  {
    id: "t-3",
    title: "Sleep routine, first month",
    description: "Gentle steps towards a steadier bedtime.",
    status: "DRAFT",
    createdById: "a-1",
    createdAt: ago(2),
    updatedAt: ago(2),
    sections: [{ id: "ts-1", title: "Evenings", position: 1 }],
    days: [
      { id: "td-1", dayNumber: 1, title: "Wind-down", instructions: "Dim the lights thirty minutes before bed.", sectionId: "ts-1" },
      { id: "td-2", dayNumber: 2, title: "Story time", instructions: "Read the same short story each night.", sectionId: "ts-1" },
    ],
  },
  {
    id: "t-2",
    title: "Communication starters",
    description: null,
    status: "PUBLISHED",
    createdById: "a-1",
    createdAt: ago(30),
    updatedAt: ago(20),
    sections: [],
    days: [
      { id: "td-3", dayNumber: 1, title: "Point and name", instructions: "Name three objects your child points at.", sectionId: null },
      { id: "td-4", dayNumber: 2, title: "Choices", instructions: "Offer two choices at snack time.", sectionId: null },
      { id: "td-5", dayNumber: 3, title: "Turn taking", instructions: "Roll a ball back and forth for five minutes.", sectionId: null },
    ],
  },
  {
    id: "t-1",
    title: "Old transition plan",
    description: "Replaced by a newer version.",
    status: "ARCHIVED",
    createdById: "a-1",
    createdAt: ago(120),
    updatedAt: ago(60),
    sections: [],
    days: [{ id: "td-6", dayNumber: 1, title: "Countdown", instructions: "Give a five-minute warning before changes.", sectionId: null }],
  },
];

let templates = seed();
let counter = 100;

function find(id: string): PlanTemplate {
  const row = templates.find((template) => template.id === id);
  if (!row) throw mockError(404, "PLAN_TEMPLATE_NOT_FOUND", "No plan template with that id.");
  return row;
}

function setStatus(id: string, status: PlanTemplate["status"]): PlanTemplate {
  const row = find(id);
  if (row.status !== status) {
    row.status = status;
    row.updatedAt = new Date().toISOString();
  }
  return { ...row };
}

export const mockPlanTemplateApi: PlanTemplateApi = {
  async list({ cursor, limit }, signal) {
    await delay(MOCK_LATENCY_MS, signal);
    return paginate(templates, { cursor, limit });
  },

  async get(id, signal) {
    await delay(MOCK_LATENCY_MS, signal);
    return { ...find(id) };
  },

  async create(input) {
    await delay(MOCK_LATENCY_MS);
    const sections = (input.sections ?? []).map((section, index) => ({ id: `ts-${++counter}`, title: section.title, position: index + 1 }));
    const numbers = input.days.map((day) => day.dayNumber).sort((a, b) => a - b);
    if (!numbers.every((value, index) => value === index + 1)) {
      throw mockError(400, ErrorCode.ValidationError, "days[].dayNumber must be a contiguous 1..N set.");
    }
    const now = new Date().toISOString();
    const row: PlanTemplate = {
      id: `t-${++counter}`,
      title: input.title,
      description: input.description ?? null,
      status: "DRAFT",
      createdById: "a-1",
      createdAt: now,
      updatedAt: now,
      sections,
      days: input.days.map((day) => ({
        id: `td-${++counter}`,
        dayNumber: day.dayNumber,
        title: day.title,
        instructions: day.instructions,
        sectionId: day.sectionPosition ? (sections[day.sectionPosition - 1]?.id ?? null) : null,
      })),
    };
    templates = [row, ...templates];
    return { ...row };
  },

  async publish(id) {
    await delay(MOCK_LATENCY_MS);
    return setStatus(id, "PUBLISHED");
  },

  async archive(id) {
    await delay(MOCK_LATENCY_MS);
    return setStatus(id, "ARCHIVED");
  },
};

/** Test hook: restore the sample rows. */
export function resetMockPlanTemplates(): void {
  templates = seed();
}
