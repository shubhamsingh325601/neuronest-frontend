"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../../app-shell/states";
import { describeError } from "../../lib/describe-error";
import { Button } from "../../ui/button";
import { statusLabel } from "../../ui/status-badge";
import { PLAN_STATUSES, type PlanStatus } from "./api/types";
import { PlanDetailView } from "./components/plan-detail";
import { PlanTable } from "./components/plan-table";
import { usePlansQuery } from "./hooks/use-child-records";

const SELECT_CLASS = "h-11 rounded-xl border border-input bg-background px-4 text-sm transition-colors disabled:opacity-50";

/** Plan history for one child, with a status filter and a read-only plan view (days and notes). */
export default function PlansTab({ childId }: { childId: string }) {
  const [status, setStatus] = useState<PlanStatus | "">("");
  const [openId, setOpenId] = useState<string | null>(null);
  const list = usePlansQuery(childId, status || undefined);

  if (openId) return <PlanDetailView planId={openId} onBack={() => setOpenId(null)} />;

  return (
    <div className="grid gap-4">
      <select
        aria-label="Filter plans by status"
        className={`${SELECT_CLASS} w-fit`}
        value={status}
        onChange={(event) => setStatus(event.target.value as PlanStatus | "")}
      >
        <option value="">All statuses</option>
        {PLAN_STATUSES.map((value) => (
          <option key={value} value={value}>
            {statusLabel(value)}
          </option>
        ))}
      </select>
      <div aria-live="polite" aria-busy={list.isPending}>
        {list.isPending ? (
          <LoadingState label="Loading plans" />
        ) : list.isError ? (
          <ErrorState {...describeError(list.error, "the plans")} onRetry={() => void list.refetch()} />
        ) : list.items.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={status ? "No plans with that status" : "No plans yet"}
            description={status ? "Try another status." : "Plans appear here once a clinician assigns one to this child."}
          />
        ) : (
          <div className="grid gap-4">
            <PlanTable plans={list.items} onOpen={setOpenId} />
            {list.hasNextPage ? (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => void list.fetchNextPage()} disabled={list.isFetchingNextPage}>
                  {list.isFetchingNextPage ? "Loading…" : "Load more"}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
