"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ErrorState, LoadingState } from "../../../app-shell/states";
import { isApiError } from "../../../lib/api-errors";
import { describeError } from "../../../lib/describe-error";
import { formatDate } from "../../../lib/format";
import { ADMIN_ROUTES } from "../../../navigation/paths";
import { Button } from "../../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { StatusBadge, statusLabel } from "../../../ui/status-badge";
import { usePlanNotesQuery, usePlanQuery } from "../hooks/use-child-records";
import { PersonLink } from "./person-link";
import { DayGroups } from "./day-groups";

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
            {" "}·{" "}
            <Link href={`${ADMIN_ROUTES.planTemplates}/${encodeURIComponent(plan.planTemplateId)}`} className="underline underline-offset-4">
              view its template
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <DayGroups content={plan} />
        </CardContent>
      </Card>
      <Notes planId={plan.id} />
    </div>
  );
}
