import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockPlanTemplateApi, resetMockPlanTemplates } from "@/mocks/admin/plan-templates";
import { addDay, addSection, emptyDay, emptyDraft, moveDay, parseDraft, removeDay, removeSection, type TemplateDraft } from "./api/form";
import { templateSchema, TEMPLATE_LIMITS } from "./api/types";

const holder = vi.hoisted(() => ({ fetchImpl: undefined as undefined | typeof fetch }));
vi.mock("../../lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("../../lib/api-client")>("../../lib/api-client");
  return { apiClient: actual.createApiClient({ fetchImpl: (...args) => holder.fetchImpl!(...args) }) };
});
import { livePlanTemplateApi } from "./api/live";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const template = {
  id: "t1",
  title: "Sleep",
  description: null,
  status: "DRAFT",
  createdById: "a1",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  days: [{ id: "d1", dayNumber: 1, title: "Wind down", instructions: "Dim the lights", sectionId: null }],
  sections: [],
};

const filled = (overrides: Partial<TemplateDraft> = {}): TemplateDraft => ({
  title: "Sleep routine",
  description: "",
  sections: [],
  days: [{ title: "Wind down", instructions: "Dim the lights", section: "" }],
  ...overrides,
});

describe("parseDraft", () => {
  it("requires a title and, for every day, a title and instructions", () => {
    const result = parseDraft(emptyDraft());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.title).toBeDefined();
      expect(result.errors.dayFields[0]).toEqual({ title: expect.any(String), instructions: expect.any(String) });
    }
  });

  it("enforces the backend length limits", () => {
    const result = parseDraft(
      filled({
        title: "x".repeat(TEMPLATE_LIMITS.title + 1),
        description: "x".repeat(TEMPLATE_LIMITS.description + 1),
        sections: ["x".repeat(TEMPLATE_LIMITS.sectionTitle + 1)],
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).filter((key) => key === "title" || key === "description")).toHaveLength(2);
      expect(result.errors.sections[0]).toBeDefined();
    }
  });

  it("asks for at least one day, and at most 365", () => {
    expect(parseDraft(filled({ days: [] }))).toMatchObject({ ok: false, errors: { days: expect.stringContaining("at least one") } });
    const many = Array.from({ length: 366 }, () => ({ title: "t", instructions: "i", section: "" }));
    expect(parseDraft(filled({ days: many }))).toMatchObject({ ok: false, errors: { days: expect.stringContaining("365") } });
  });

  it("rejects a blank section name rather than sending an empty section", () => {
    expect(parseDraft(filled({ sections: ["  "] })).ok).toBe(false);
  });

  it("builds the request with trimmed text and contiguous day numbers from 1", () => {
    const result = parseDraft(
      filled({
        title: "  Sleep  ",
        description: " calm ",
        sections: ["Evenings", "Mornings"],
        days: [
          { title: " A ", instructions: " a ", section: "1" },
          { title: "B", instructions: "b", section: "2" },
          { title: "C", instructions: "c", section: "" },
        ],
      }),
    );
    expect(result).toEqual({
      ok: true,
      input: {
        title: "Sleep",
        description: "calm",
        sections: [{ title: "Evenings" }, { title: "Mornings" }],
        days: [
          { dayNumber: 1, title: "A", instructions: "a", sectionPosition: 1 },
          { dayNumber: 2, title: "B", instructions: "b", sectionPosition: 2 },
          { dayNumber: 3, title: "C", instructions: "c" },
        ],
      },
    });
  });

  it("leaves out empty optional fields", () => {
    const result = parseDraft(filled());
    expect(result.ok && "description" in result.input).toBe(false);
    expect(result.ok && "sections" in result.input).toBe(false);
  });

  it("never sends a section position past the last section", () => {
    const result = parseDraft(filled({ sections: ["Only"], days: [{ title: "t", instructions: "i", section: "3" }] }));
    expect(result.ok && result.input.days[0]).toEqual({ dayNumber: 1, title: "t", instructions: "i" });
  });
});

describe("draft editing keeps day numbers contiguous", () => {
  const days = (titles: string[]) => titles.map((title) => ({ ...emptyDay(), title, instructions: "i" }));
  const numbered = (draft: TemplateDraft) => {
    const parsed = parseDraft({ ...draft, title: "t" });
    return parsed.ok ? parsed.input.days.map((d) => `${d.dayNumber}:${d.title}`) : parsed.errors;
  };

  it("renumbers after a move or a removal", () => {
    const draft = filled({ days: days(["a", "b", "c"]) });
    expect(numbered(moveDay(draft, 0, 1))).toEqual(["1:b", "2:a", "3:c"]);
    expect(numbered(removeDay(draft, 1))).toEqual(["1:a", "2:c"]);
  });

  it("ignores moves off either end", () => {
    const draft = filled({ days: days(["a", "b"]) });
    expect(moveDay(draft, 0, -1)).toBe(draft);
    expect(moveDay(draft, 1, 1)).toBe(draft);
  });

  it("a new day joins the previous day's section", () => {
    const draft = filled({ sections: ["S"], days: [{ title: "a", instructions: "i", section: "1" }] });
    expect(addDay(draft).days[1].section).toBe("1");
  });

  it("stops adding days at the limit", () => {
    const full = filled({ days: Array.from({ length: TEMPLATE_LIMITS.maxDays }, () => emptyDay()) });
    expect(addDay(full)).toBe(full);
  });

  it("removing a section unassigns its days and shifts later sections up", () => {
    const draft = addSection(addSection(addSection(filled({ days: [] }))));
    draft.sections = ["A", "B", "C"];
    draft.days = [
      { title: "a", instructions: "i", section: "1" },
      { title: "b", instructions: "i", section: "2" },
      { title: "c", instructions: "i", section: "3" },
      { title: "d", instructions: "i", section: "" },
    ];
    const next = removeSection(draft, 1);
    expect(next.sections).toEqual(["A", "C"]);
    expect(next.days.map((d) => d.section)).toEqual(["1", "", "2", ""]);
  });
});

describe("livePlanTemplateApi", () => {
  it("reads the list and one template, and the shape is valid", async () => {
    const calls: string[] = [];
    holder.fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      calls.push(String(input));
      return json(200, String(input).includes("plan-templates/t1") ? template : { data: [template], nextCursor: null });
    }) as unknown as typeof fetch;
    const page = await livePlanTemplateApi.list({ limit: 20 });
    expect(page.data).toHaveLength(1);
    expect(templateSchema.safeParse(await livePlanTemplateApi.get("t1")).success).toBe(true);
    expect(calls[0]).toMatch(/plan-templates\?limit=20$/);
  });

  it("creates with POST and the nested body", async () => {
    const fetchImpl = vi.fn(async () => json(201, template));
    holder.fetchImpl = fetchImpl;
    const body = { title: "Sleep", days: [{ dayNumber: 1, title: "t", instructions: "i" }] };
    await livePlanTemplateApi.create(body);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/plan-templates$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(body);
  });

  it("publishes and archives with POST to the action routes", async () => {
    const fetchImpl = vi.fn(async () => json(200, template));
    holder.fetchImpl = fetchImpl;
    await livePlanTemplateApi.publish("t1");
    await livePlanTemplateApi.archive("t1");
    const calls = fetchImpl.mock.calls as unknown as [string, RequestInit][];
    expect(calls.map(([url, init]) => `${init.method} ${url.replace(/^.*plan-templates/, "")}`)).toEqual(["POST /t1/publish", "POST /t1/archive"]);
  });
});

describe("mockPlanTemplateApi", () => {
  beforeEach(() => resetMockPlanTemplates());

  it("creates a DRAFT, rejects non-contiguous days, and keeps publish / archive one-way", async () => {
    const created = await mockPlanTemplateApi.create({
      title: "New",
      sections: [{ title: "S" }],
      days: [{ dayNumber: 1, title: "t", instructions: "i", sectionPosition: 1 }],
    });
    expect(created.status).toBe("DRAFT");
    expect(created.days[0].sectionId).toBe(created.sections[0].id);
    await expect(mockPlanTemplateApi.create({ title: "Gap", days: [{ dayNumber: 2, title: "t", instructions: "i" }] })).rejects.toMatchObject({ status: 400 });

    expect((await mockPlanTemplateApi.publish(created.id)).status).toBe("PUBLISHED");
    expect((await mockPlanTemplateApi.archive(created.id)).status).toBe("ARCHIVED");
    expect((await mockPlanTemplateApi.archive(created.id)).status).toBe("ARCHIVED");
    await expect(mockPlanTemplateApi.get("nope")).rejects.toMatchObject({ status: 404 });
  }, 10_000);
});
