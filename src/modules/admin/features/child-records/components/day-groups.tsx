import { groupDays } from "./group-days";

interface DisplayDay {
  id: string;
  dayNumber: number;
  title: string;
  instructions: string;
  sectionId: string | null;
}

/** Read-only list of a plan's (or template's) days under their section headings. */
export function DayGroups({
  content,
}: {
  content: { days: DisplayDay[]; sections: { id: string; title: string; position: number }[] };
}) {
  const groups = groupDays(content);
  if (groups.length === 0) return <p className="text-sm text-muted-foreground">There are no days yet.</p>;
  return (
    <>
      {groups.map((group) => (
        <section key={group.id} className="grid gap-2">
          {group.title ? <h4 className="text-sm font-semibold">{group.title}</h4> : null}
          <ol className="divide-y rounded-xl border">
            {group.days.map((day) => (
              <li key={day.id} className="grid gap-1 px-4 py-3 text-sm">
                <p className="font-medium">
                  Day {day.dayNumber}: {day.title}
                </p>
                <p className="whitespace-pre-wrap text-muted-foreground">{day.instructions}</p>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </>
  );
}
