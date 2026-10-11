"use client";

import { ArrowLeft } from "lucide-react";
import { ErrorState, LoadingState } from "../../../app-shell/states";
import { isApiError } from "../../../lib/api-errors";
import { describeError } from "../../../lib/describe-error";
import { formatDate } from "../../../lib/format";
import { Button } from "../../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { StatusBadge, statusLabel } from "../../../ui/status-badge";
import type { PlanDay, PlanDetail } from "../api/types";
import { usePlanNotesQuery, usePlanQuery } from "../hooks/use-child-records";
import { PersonLink } from "./person-link";

/** Days grouped by section (sections by position, days by number); days without a section come last. */
export function groupDays(plan: Pick<PlanDetail, "days" | "sections">): { id: string; title: string | null; days: PlanDay[] }[] {
  const byNumber = (a: PlanDay, b: PlanDay) => a.dayNumber - b.dayNumber;
  const groups = [...plan.sections]
    .sort((a, b) => a.position - b.position)
    .map((section) => ({
      id: section.id,
      title: section.title as string | null,
      days: plan.days.filter((day) => day.sectionId === section.id).sort(byNumber),
    }))
    .filter((group) => group.days.length > 0);
  const known = new Set(plan.sections.map((section) => section.id));
  const loose = plan.days.filter((day) => !day.sectionId || !known.has(day.sectionId)).sort(byNumber);
  if (loose.length > 0) groups.push({ id: "none", title: groups.length > 0 ? "Other days" : null, days: loose });
  return groups;
}

function Notes({ planId }: { planId: string }) {
  const notes = usePlanNotesQuery(planId);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
        <CardDescription>Clinician coordination notes, oldest first. Read-only; parents do not see them.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {notes.isPending ? (
          <LoadingState rows={2} label="Loading notes" />
        ) : notes.isError ? (
          <ErrorState {...describeError(notes.error, "the notes")} onRetry={() => void notes.refetch()} />
        ) : notes.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes on this plan.</p>
        ) : (
          <>
            <ul className="divide-y">
              {notes.items.map((note) => (
                <li key={note.id} className="grid gap-1 py-3 text-sm">
                  <p className="whitespace-pre-wrap">{note.note}</p>
                  <p className="text-muted-foreground">
                    <PersonLink id={note.authorId} /> · {formatDate(note.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
            {notes.hasNextPage ? (
              <div>
                <Button variant="outline" onClick={() => void notes.fetchNextPage()} disabled={notes.isFetchingNextPage}>
                  {notes.isFetchingNextPage ? "Loading…" : "Load more notes"}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function PlanDetailView({ planId, onBack }: { planId: string; onBack: () => void }) {
  const query = usePlanQuery(planId);
  const back = (
    <div>
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft aria-hidden="true" /> All plans
      </Button>
    </div>
  );
  if (query.isPending) return <LoadingState label="Loading plan" />;
  if (query.isError) {
    const notFound = isApiError(query.error) && query.error.status === 404;
    return (
      <div className="grid gap-4">
        {back}
        {notFound ? (
          <ErrorState title="Plan not found" description="It may have been removed." />
        ) : (
          <ErrorState {...describeError(query.error, "this plan")} onRetry={() => void query.refetch()} />
        )}
      </div>
    );
  }

  const plan = query.data;
  const groups = groupDays(plan);
  return (
    <div className="grid gap-4">
      {back}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-3">
            Plan starting {formatDate(plan.startDate)} <StatusBadge status={plan.status} />
          </CardTitle>
          <CardDescription>
            {statusLabel(plan.origin)} plan · {plan.days.length} {plan.days.length === 1 ? "day" : "days"} · last updated {formatDate(plan.updatedAt)}
            {plan.createdById ? (
              <>
                {" "}· created by <PersonLink id={plan.createdById} />
              </>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">This plan has no days.</p>
          ) : (
            groups.map((group) => (
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
            ))
          )}
        </CardContent>
      </Card>
      <Notes planId={plan.id} />
    </div>
  );
}
