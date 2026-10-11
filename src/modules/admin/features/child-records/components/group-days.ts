interface GroupableDay {
  id: string;
  dayNumber: number;
  sectionId: string | null;
}

export interface DayGroup<D> {
  id: string;
  title: string | null;
  days: D[];
}

/**
 * Days grouped by section (sections by position, days by number); days without a known section come last.
 * Shared by the child's plan view and the plan template view, which have the same day / section shape.
 */
export function groupDays<D extends GroupableDay>(content: {
  days: D[];
  sections: { id: string; title: string; position: number }[];
}): DayGroup<D>[] {
  const byNumber = (a: D, b: D) => a.dayNumber - b.dayNumber;
  const groups: DayGroup<D>[] = [...content.sections]
    .sort((a, b) => a.position - b.position)
    .map((section) => ({
      id: section.id,
      title: section.title,
      days: content.days.filter((day) => day.sectionId === section.id).sort(byNumber),
    }))
    .filter((group) => group.days.length > 0);
  const known = new Set(content.sections.map((section) => section.id));
  const loose = content.days.filter((day) => !day.sectionId || !known.has(day.sectionId)).sort(byNumber);
  if (loose.length > 0) groups.push({ id: "none", title: groups.length > 0 ? "Other days" : null, days: loose });
  return groups;
}
