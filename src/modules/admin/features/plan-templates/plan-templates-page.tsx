"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardList, Plus } from "lucide-react";
import { PageHeader } from "../../app-shell/page-header";
import { EmptyState, ErrorState, LoadingState } from "../../app-shell/states";
import { describeError } from "../../lib/describe-error";
import { ADMIN_ROUTES } from "../../navigation/paths";
import { Button } from "../../ui/button";
import { statusLabel } from "../../ui/status-badge";
import { TEMPLATE_STATUSES, type TemplateStatus } from "./api/types";
import { TemplateTable } from "./components/template-table";
import { usePlanTemplatesQuery } from "./hooks/use-plan-templates";

const SELECT_CLASS = "h-11 rounded-xl border border-input bg-background px-4 text-sm transition-colors disabled:opacity-50";

export function PlanTemplatesPage() {
  const router = useRouter();
  const params = useSearchParams();
  // The backend has no status filter on this list, so the filter runs over the rows loaded so far.
  const status = TEMPLATE_STATUSES.find((value) => value === params.get("status")) as TemplateStatus | undefined;
  const list = usePlanTemplatesQuery();
  const rows = status ? list.items.filter((template) => template.status === status) : list.items;

  function setStatus(next: string) {
    router.replace(next ? `${ADMIN_ROUTES.planTemplates}?status=${next}` : ADMIN_ROUTES.planTemplates);
  }

  const add = (
    <Button asChild>
      <Link href={`${ADMIN_ROUTES.planTemplates}/new`}>
        <Plus aria-hidden="true" /> New template
      </Link>
    </Button>
  );

  return (
    <div className="grid gap-6">
      <PageHeader title="Plan templates" description="Reusable care plans that clinicians can assign to children." actions={add} />

      <select aria-label="Filter by status" className={`${SELECT_CLASS} w-fit`} value={status ?? ""} onChange={(event) => setStatus(event.target.value)}>
        <option value="">All statuses</option>
        {TEMPLATE_STATUSES.map((value) => (
          <option key={value} value={value}>
            {statusLabel(value)}
          </option>
        ))}
      </select>

      <div aria-live="polite" aria-busy={list.isPending}>
        {list.isPending ? (
          <LoadingState label="Loading plan templates" />
        ) : list.isError ? (
          <ErrorState {...describeError(list.error, "plan templates")} onRetry={() => void list.refetch()} />
        ) : list.items.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No templates yet" description="Create the first template, then publish it so clinicians can use it." action={add} />
        ) : (
          <div className="grid gap-4">
            {rows.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No loaded template has that status"
                description={list.hasNextPage ? "Load more to search further back." : "Try a different status."}
              />
            ) : (
              <TemplateTable templates={rows} />
            )}
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
