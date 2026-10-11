"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Stethoscope, UserPlus } from "lucide-react";
import { PageHeader } from "../../app-shell/page-header";
import { EmptyState, ErrorState, LoadingState } from "../../app-shell/states";
import { describeError } from "../../lib/describe-error";
import { ADMIN_ROUTES } from "../../navigation/paths";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { statusLabel } from "../../ui/status-badge";
import { CLINICIAN_STATUSES, type ClinicianStatus } from "./api/types";
import { ClinicianTable } from "./components/clinician-table";
import { useCliniciansQuery } from "./hooks/use-clinicians";

const SELECT_CLASS =
  "h-11 rounded-xl border border-input bg-background px-4 text-sm transition-colors disabled:opacity-50";

function parseStatus(value: string | null): ClinicianStatus | undefined {
  return CLINICIAN_STATUSES.find((status) => status === value);
}

export function CliniciansPage() {
  const router = useRouter();
  const params = useSearchParams();
  // The status lives in the URL so the dashboard's "Invited clinicians" card can link straight to it.
  const status = parseStatus(params.get("status"));
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const list = useCliniciansQuery({ status, q: q || undefined });
  const filtered = Boolean(status || q);

  function setStatus(next: string) {
    router.replace(next ? `${ADMIN_ROUTES.clinicians}?status=${next}` : ADMIN_ROUTES.clinicians);
  }

  const invite = (
    <Button asChild>
      <Link href={ADMIN_ROUTES.inviteClinician}>
        <UserPlus aria-hidden="true" /> Invite clinician
      </Link>
    </Button>
  );

  return (
    <div className="grid gap-6">
      <PageHeader title="Clinicians" description="Invite clinicians and see who has activated their account." actions={invite} />

      <div className="flex flex-wrap gap-3">
        <Input
          type="search"
          aria-label="Search clinicians by name or email"
          placeholder="Search by name or email"
          value={search}
          maxLength={100}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-xs"
        />
        <select
          aria-label="Filter by status"
          className={SELECT_CLASS}
          value={status ?? ""}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All statuses</option>
          {CLINICIAN_STATUSES.map((value) => (
            <option key={value} value={value}>
              {statusLabel(value)}
            </option>
          ))}
        </select>
      </div>

      <div aria-live="polite" aria-busy={list.isPending}>
        {list.isPending ? (
          <LoadingState label="Loading clinicians" />
        ) : list.isError ? (
          <ErrorState {...describeError(list.error, "clinicians")} onRetry={() => void list.refetch()} />
        ) : list.items.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title={filtered ? "No clinicians match" : "No clinicians yet"}
            description={filtered ? "Try a different search or status." : "Invite your first clinician to get started."}
            action={filtered ? undefined : invite}
          />
        ) : (
          <div className="grid gap-4">
            <ClinicianTable clinicians={list.items} />
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
