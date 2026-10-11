"use client";

import { Baby } from "lucide-react";
import { PageHeader } from "../../app-shell/page-header";
import { EmptyState, ErrorState, LoadingState } from "../../app-shell/states";
import { describeError } from "../../lib/describe-error";
import { Button } from "../../ui/button";
import { ChildTable } from "./components/child-table";
import { useChildrenQuery } from "./hooks/use-children";

export function ChildrenPage() {
  const list = useChildrenQuery();
  return (
    <div className="grid gap-6">
      <PageHeader title="Children" description="Every child on the platform. Open one to manage their care team." />
      <div aria-live="polite" aria-busy={list.isPending}>
        {list.isPending ? (
          <LoadingState label="Loading children" />
        ) : list.isError ? (
          <ErrorState {...describeError(list.error, "children")} onRetry={() => void list.refetch()} />
        ) : list.items.length === 0 ? (
          <EmptyState icon={Baby} title="No children yet" description="Children appear here once a parent adds one in the app." />
        ) : (
          <div className="grid gap-4">
            <ChildTable items={list.items} />
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
