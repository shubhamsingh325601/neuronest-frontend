"use client";

import { Search, Users } from "lucide-react";
import { useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "../../../app-shell/states";
import { describeError } from "../../../lib/describe-error";
import { Button } from "../../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { Input } from "../../../ui/input";
import { useUsersQuery } from "../../users/hooks/use-users";
import { describeImpersonationError } from "../error-copy";
import { useActAsParent } from "../hooks";

/** Test parents only: everything the admin sends is stored as that parent's own message. */
export function ParentPicker({ act }: { act: ReturnType<typeof useActAsParent> }) {
  const [search, setSearch] = useState("");
  const list = useUsersQuery({ role: "PARENT", status: "ACTIVE" });
  // GET /users has no search parameter, so the filter runs over the pages loaded so far.
  const needle = search.trim().toLowerCase();
  const rows = needle
    ? list.items.filter((user) => user.name.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle))
    : list.items;
  const failure = act.isError ? describeImpersonationError(act.error) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a parent</CardTitle>
        <CardDescription>
          Use a test parent. Anything you send is stored as that parent&apos;s own message, and the token lasts about an hour with no refresh.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search loaded parents by name or email"
            aria-label="Search parents"
            className="pl-10"
          />
        </div>

        {failure ? (
          <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm">
            <span className="font-semibold">{failure.title}.</span> <span className="text-muted-foreground">{failure.description}</span>
          </p>
        ) : null}

        <div aria-live="polite" aria-busy={list.isPending}>
          {list.isPending ? (
            <LoadingState rows={3} label="Loading parents" />
          ) : list.isError ? (
            <ErrorState {...describeError(list.error, "parents")} onRetry={() => void list.refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={Users}
              title={needle ? "No loaded parent matches" : "No active parents"}
              description={needle && list.hasNextPage ? "Load more parents to search further." : "Active parent accounts appear here."}
            />
          ) : (
            <ul className="divide-y rounded-xl border">
              {rows.map((user) => (
                <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="grid min-w-0">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-sm text-muted-foreground">{user.email}</span>
                  </div>
                  <Button size="sm" disabled={act.isPending} onClick={() => act.mutate(user.id)}>
                    {act.isPending && act.variables === user.id ? "Starting…" : "Act as this parent"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {list.hasNextPage ? (
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => void list.fetchNextPage()} disabled={list.isFetchingNextPage}>
              {list.isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
