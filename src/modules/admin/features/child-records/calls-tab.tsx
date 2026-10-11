"use client";

import { PhoneCall } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../../app-shell/states";
import { describeError } from "../../lib/describe-error";
import { formatDate } from "../../lib/format";
import { timeValue, useSortedItems } from "../../lib/sort";
import { Button } from "../../ui/button";
import { SortHeader } from "../../ui/sort-header";
import type { CallLog } from "./api/types";
import { PersonLink } from "./components/person-link";
import { useCallLogsQuery } from "./hooks/use-child-records";

const ACCESSORS = {
  called: (c: CallLog) => timeValue(c.calledAt),
  notes: (c: CallLog) => c.notes,
};

function CallTable({ calls }: { calls: CallLog[] }) {
  const { sorted, sort, toggle } = useSortedItems(calls, ACCESSORS);
  return (
    <div className="overflow-x-auto rounded-2xl border">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <caption className="sr-only">Monthly calls with this child&apos;s family</caption>
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <SortHeader label="Called" column="called" sort={sort} onSort={toggle} />
            <th scope="col" className="px-4 py-3 font-medium">
              <span className="uppercase tracking-wide">Clinician</span>
            </th>
            <SortHeader label="Notes" column="notes" sort={sort} onSort={toggle} />
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map((call) => (
            <tr key={call.id} className="align-top">
              <th scope="row" className="px-4 py-3 font-medium">
                {formatDate(call.calledAt)}
              </th>
              <td className="px-4 py-3 text-muted-foreground">
                <PersonLink id={call.clinicianId} />
              </td>
              <td className="whitespace-pre-wrap px-4 py-3 text-muted-foreground">{call.notes ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The clinicians' monthly calls with the family, newest first. Read-only. */
export default function CallsTab({ childId }: { childId: string }) {
  const list = useCallLogsQuery(childId);
  if (list.isPending) return <LoadingState label="Loading call history" />;
  if (list.isError) return <ErrorState {...describeError(list.error, "the call history")} onRetry={() => void list.refetch()} />;
  if (list.items.length === 0) {
    return <EmptyState icon={PhoneCall} title="No calls logged" description="Monthly calls recorded by the care team appear here." />;
  }
  return (
    <div className="grid gap-4">
      <CallTable calls={list.items} />
      {list.hasNextPage ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => void list.fetchNextPage()} disabled={list.isFetchingNextPage}>
            {list.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
