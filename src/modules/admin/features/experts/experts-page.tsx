"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GraduationCap, UserPlus } from "lucide-react";
import { PageHeader } from "../../app-shell/page-header";
import { EmptyState, ErrorState, LoadingState } from "../../app-shell/states";
import { describeError } from "../../lib/describe-error";
import { ADMIN_ROUTES } from "../../navigation/paths";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { statusLabel } from "../../ui/status-badge";
import { EXPERT_STATUSES, type ExpertStatus } from "./api/types";
import { ExpertTable } from "./components/expert-table";
import { useExpertsQuery } from "./hooks/use-experts";

const SELECT_CLASS =
  "h-11 rounded-xl border border-input bg-background px-4 text-sm transition-colors disabled:opacity-50";

export function ExpertsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const status = EXPERT_STATUSES.find((value) => value === params.get("status")) as ExpertStatus | undefined;
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const list = useExpertsQuery({ status, q: q || undefined });
  const filtered = Boolean(status || q);

  function setStatus(next: string) {
    router.replace(next ? `${ADMIN_ROUTES.experts}?status=${next}` : ADMIN_ROUTES.experts);
  }

  const add = (
    <Button asChild>
      <Link href={ADMIN_ROUTES.newExpert}>
        <UserPlus aria-hidden="true" /> Add expert
      </Link>
    </Button>
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Experts"
        description="Experts chat with parents about the children assigned to them. You create and manage their accounts directly."
        actions={add}
      />

      <div className="flex flex-wrap gap-3">
        <Input
          type="search"
          aria-label="Search experts by name or email"
          placeholder="Search by name or email"
          value={search}
          maxLength={100}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-xs"
        />
        <select aria-label="Filter by status" className={SELECT_CLASS} value={status ?? ""} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {EXPERT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {statusLabel(value)}
            </option>
          ))}
        </select>
      </div>

      <div aria-live="polite" aria-busy={list.isPending}>
        {list.isPending ? (
          <LoadingState label="Loading experts" />
        ) : list.isError ? (
          <ErrorState {...describeError(list.error, "experts")} onRetry={() => void list.refetch()} />
        ) : list.items.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={filtered ? "No experts match" : "No experts yet"}
            description={filtered ? "Try a different search or status." : "Add your first expert to get started."}
            action={filtered ? undefined : add}
          />
        ) : (
          <div className="grid gap-4">
            <ExpertTable experts={list.items} />
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
