"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "../../app-shell/page-header";
import { EmptyState, ErrorState, LoadingState } from "../../app-shell/states";
import { describeError } from "../../lib/describe-error";
import { ADMIN_ROUTES } from "../../navigation/paths";
import { Button } from "../../ui/button";
import { statusLabel } from "../../ui/status-badge";
import { USER_ROLES, USER_STATUSES, type UserRole, type UserStatus } from "./api/types";
import { UserTable } from "./components/user-table";
import { useUsersQuery } from "./hooks/use-users";
import { roleLabel } from "./role-label";

const SELECT_CLASS =
  "h-11 rounded-xl border border-input bg-background px-4 text-sm transition-colors disabled:opacity-50";

const TABS: { value: UserRole | ""; label: string }[] = [
  { value: "", label: "All" },
  ...USER_ROLES.map((role) => ({ value: role, label: `${roleLabel(role)}s` })),
];

export function UsersPage() {
  const router = useRouter();
  const params = useSearchParams();
  // Role and status live in the URL so they survive reloads and can be linked to.
  const role = USER_ROLES.find((value) => value === params.get("role"));
  const status = USER_STATUSES.find((value) => value === params.get("status"));
  const list = useUsersQuery({ role, status });
  const filtered = Boolean(role || status);

  function navigate(next: { role?: UserRole | ""; status?: UserStatus | "" }) {
    const search = new URLSearchParams();
    const nextRole = next.role === undefined ? role : next.role;
    const nextStatus = next.status === undefined ? status : next.status;
    if (nextRole) search.set("role", nextRole);
    if (nextStatus) search.set("status", nextStatus);
    const query = search.toString();
    router.replace(query ? `${ADMIN_ROUTES.users}?${query}` : ADMIN_ROUTES.users);
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="Users" description="Parents, clinicians, experts and administrators in one directory." />

      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Filter by role" className="flex gap-1 rounded-xl border p-1">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              aria-pressed={(role ?? "") === tab.value}
              onClick={() => navigate({ role: tab.value })}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                (role ?? "") === tab.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select
          aria-label="Filter by status"
          className={SELECT_CLASS}
          value={status ?? ""}
          onChange={(event) => navigate({ status: event.target.value as UserStatus | "" })}
        >
          <option value="">All statuses</option>
          {USER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {statusLabel(value)}
            </option>
          ))}
        </select>
      </div>

      <div aria-live="polite" aria-busy={list.isPending}>
        {list.isPending ? (
          <LoadingState label="Loading users" />
        ) : list.isError ? (
          <ErrorState {...describeError(list.error, "users")} onRetry={() => void list.refetch()} />
        ) : list.items.length === 0 ? (
          <EmptyState
            icon={Users}
            title={filtered ? "No users match" : "No users yet"}
            description={filtered ? "Try a different role or status." : "Accounts appear here once people sign up or are invited."}
          />
        ) : (
          <div className="grid gap-4">
            <UserTable users={list.items} />
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
