import { TEMPLATE_LIMITS, type CreateTemplateInput } from "./types";

// Builder state and its validation, mirroring the backend limits (CreatePlanTemplateDto). Day numbers are never
// typed: a day's number is its place in the list, so the 1..N contiguous set the backend demands holds by
// construction, and re-ordering or deleting a day renumbers the rest.

export interface DayDraft {
  title: string;
  instructions: string;
  /** "" for no section, otherwise the 1-based position of the section as a string (a <select> value). */
  section: string;
}

export interface TemplateDraft {
  title: string;
  description: string;
  sections: string[];
  days: DayDraft[];
}

export const emptyDay = (): DayDraft => ({ title: "", instructions: "", section: "" });
export const emptyDraft = (): TemplateDraft => ({ title: "", description: "", sections: [], days: [emptyDay()] });

export function addDay(draft: TemplateDraft): TemplateDraft {
  if (draft.days.length >= TEMPLATE_LIMITS.maxDays) return draft;
  // A new day joins the section of the one before it, which is what an author building a section usually wants.
  const last = draft.days.at(-1);
  return { ...draft, days: [...draft.days, { ...emptyDay(), section: last?.section ?? "" }] };
}

export function removeDay(draft: TemplateDraft, index: number): TemplateDraft {
  return { ...draft, days: draft.days.filter((_, i) => i !== index) };
}

export function moveDay(draft: TemplateDraft, index: number, delta: -1 | 1): TemplateDraft {
  const target = index + delta;
  if (target < 0 || target >= draft.days.length) return draft;
  const days = [...draft.days];
  [days[index], days[target]] = [days[target], days[index]];
  return { ...draft, days };
}

export function addSection(draft: TemplateDraft): TemplateDraft {
  return { ...draft, sections: [...draft.sections, ""] };
}

/** Removes a section; its days become section-less and later sections shift up by one. */
export function removeSection(draft: TemplateDraft, index: number): TemplateDraft {
  const removed = index + 1;
  return {
    ...draft,
    sections: draft.sections.filter((_, i) => i !== index),
    days: draft.days.map((day) => {
      const position = Number(day.section);
      if (!day.section) return day;
      if (position === removed) return { ...day, section: "" };
      return position > removed ? { ...day, section: String(position - 1) } : day;
    }),
  };
}

export interface DraftErrors {
  title?: string;
  description?: string;
  /** About the list as a whole (no days). */
  days?: string;
  sections: Record<number, string>;
  dayFields: Record<number, { title?: string; instructions?: string }>;
}

export type DraftParse = { ok: true; input: CreateTemplateInput } | { ok: false; errors: DraftErrors };

export function parseDraft(draft: TemplateDraft): DraftParse {
  const errors: DraftErrors = { sections: {}, dayFields: {} };
  const title = draft.title.trim();
  const description = draft.description.trim();
  if (!title) errors.title = "Enter a title.";
  else if (title.length > TEMPLATE_LIMITS.title) errors.title = `Title must be ${TEMPLATE_LIMITS.title} characters or fewer.`;
  if (description.length > TEMPLATE_LIMITS.description) {
    errors.description = `Description must be ${TEMPLATE_LIMITS.description} characters or fewer.`;
  }

  draft.sections.forEach((raw, index) => {
    const value = raw.trim();
    if (!value) errors.sections[index] = "Enter a section name, or remove the section.";
    else if (value.length > TEMPLATE_LIMITS.sectionTitle) {
      errors.sections[index] = `Section names must be ${TEMPLATE_LIMITS.sectionTitle} characters or fewer.`;
    }
  });

  if (draft.days.length === 0) errors.days = "Add at least one day.";
  else if (draft.days.length > TEMPLATE_LIMITS.maxDays) errors.days = `A template can have at most ${TEMPLATE_LIMITS.maxDays} days.`;

  draft.days.forEach((day, index) => {
    const fields: { title?: string; instructions?: string } = {};
    if (!day.title.trim()) fields.title = "Enter a title for this day.";
    if (!day.instructions.trim()) fields.instructions = "Enter the instructions for this day.";
    if (fields.title || fields.instructions) errors.dayFields[index] = fields;
  });

  const failed =
    errors.title || errors.description || errors.days || Object.keys(errors.sections).length > 0 || Object.keys(errors.dayFields).length > 0;
  if (failed) return { ok: false, errors };

  const input: CreateTemplateInput = {
    title,
    days: draft.days.map((day, index) => ({
      dayNumber: index + 1,
      title: day.title.trim(),
      instructions: day.instructions.trim(),
      // Defensive: a position past the last section would be refused by the backend, so drop it.
      ...(day.section && Number(day.section) >= 1 && Number(day.section) <= draft.sections.length
        ? { sectionPosition: Number(day.section) }
        : {}),
    })),
  };
  if (description) input.description = description;
  if (draft.sections.length > 0) input.sections = draft.sections.map((section) => ({ title: section.trim() }));
  return { ok: true, input };
}
