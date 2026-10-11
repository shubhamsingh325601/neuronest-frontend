"use client";

import Link from "next/link";
import { useState } from "react";
import { UserMinus, UserPlus } from "lucide-react";
import { ErrorCode, isApiError } from "../../../lib/api-errors";
import { ADMIN_ROUTES } from "../../../navigation/paths";
import { toast } from "../../../notifications/toast";
import { Button } from "../../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { ConfirmDialog } from "../../../ui/confirm-dialog";
import { Input } from "../../../ui/input";
import { formatAge } from "../../children/age";
import { useChildQuery, useChildrenQuery } from "../../children/hooks/use-children";
import type { ExpertDetail } from "../api/types";
import { useSetExpertChildren } from "../hooks/use-experts";

function failure(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 404) return "The expert or one of the children could not be found. Reload and try again.";
    if (error.code === ErrorCode.RateLimited) return "Too many requests. Wait a moment and try again.";
    if (error.code === ErrorCode.BackendUnreachable) return "The NeuroNest service could not be reached. Try again shortly.";
    if (error.code === ErrorCode.InsufficientPermissions) return "Your account is not allowed to do this.";
  }
  return "Something went wrong. Please try again.";
}

function AssignedRow({ childId, onRemove }: { childId: string; onRemove: () => Promise<void> }) {
  const child = useChildQuery(childId);
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="grid gap-0.5 text-sm">
        <Link href={`${ADMIN_ROUTES.children}/${encodeURIComponent(childId)}`} className="font-medium hover:underline">
          {child.data?.name ?? (child.isError ? "Child" : "…")}
        </Link>
        {child.data ? <span className="text-muted-foreground">{formatAge(child.data.dateOfBirth)}</span> : null}
      </div>
      <ConfirmDialog
        destructive
        title="Remove this child?"
        description="The expert loses access to this child's information straight away. You can assign them again later."
        confirmLabel="Remove"
        onConfirm={onRemove}
        trigger={
          <Button variant="outline" size="sm">
            <UserMinus aria-hidden="true" /> Remove
          </Button>
        }
      />
    </li>
  );
}

function Picker({ expertId, assigned }: { expertId: string; assigned: string[] }) {
  const children = useChildrenQuery();
  const save = useSetExpertChildren(expertId);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");

  const needle = filter.trim().toLowerCase();
  const options = children.items.filter(
    (child) => !assigned.includes(child.id) && (!needle || child.name.toLowerCase().includes(needle)),
  );

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (selected.size === 0) return;
    const count = selected.size;
    save.mutate([...assigned, ...selected], {
      onSuccess: () => {
        setSelected(new Set());
        toast.success(count === 1 ? "Child assigned" : `${count} children assigned`);
      },
      onError: (error) => toast.error("Could not assign the children", { description: failure(error) }),
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-3 border-t pt-4">
      <p className="text-sm font-medium">Assign children</p>
      <Input
        type="search"
        aria-label="Filter the children below by name"
        placeholder="Filter by name"
        value={filter}
        maxLength={100}
        onChange={(event) => setFilter(event.target.value)}
        className="max-w-xs"
      />
      {children.isPending ? (
        <p className="text-sm text-muted-foreground">Loading children…</p>
      ) : children.isError ? (
        <p role="alert" className="text-sm text-destructive">
          Could not load children.{" "}
          <button type="button" className="underline" onClick={() => void children.refetch()}>
            Retry
          </button>
        </p>
      ) : options.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {needle ? "No loaded child matches that name." : "No more children to assign."}
        </p>
      ) : (
        <fieldset className="grid max-h-72 gap-1 overflow-y-auto rounded-xl border p-2">
          <legend className="sr-only">Children available to assign</legend>
          {options.map((child) => (
            <label key={child.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted/50">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={selected.has(child.id)}
                onChange={() => toggle(child.id)}
                disabled={save.isPending}
              />
              <span className="font-medium">{child.name}</span>
              <span className="text-muted-foreground">{formatAge(child.dateOfBirth)}</span>
            </label>
          ))}
        </fieldset>
      )}
      {children.hasNextPage ? (
        <button
          type="button"
          className="w-fit text-sm underline underline-offset-4"
          onClick={() => void children.fetchNextPage()}
          disabled={children.isFetchingNextPage}
        >
          {children.isFetchingNextPage ? "Loading…" : "Load more children"}
        </button>
      ) : null}
      <div>
        <Button type="submit" disabled={selected.size === 0 || save.isPending}>
          <UserPlus aria-hidden="true" />{" "}
          {save.isPending ? "Assigning…" : selected.size > 0 ? `Assign ${selected.size} selected` : "Assign selected"}
        </Button>
      </div>
    </form>
  );
}

/** The children an expert can see. One call replaces the whole set, so many children go in at once. */
export function AssignedChildren({ expert }: { expert: ExpertDetail }) {
  const save = useSetExpertChildren(expert.id);
  const assigned = expert.assignedChildIds;

  function remover(childId: string) {
    return async () => {
      try {
        await save.mutateAsync(assigned.filter((id) => id !== childId));
        toast.success("Child removed");
      } catch (error) {
        toast.error("Could not remove the child", { description: failure(error) });
        throw error; // keeps the confirm dialog open
      }
    };
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Assigned children</CardTitle>
        <CardDescription>An expert can only see and chat about the children assigned here.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {assigned.length === 0 ? (
          <p className="text-sm text-muted-foreground">No children assigned yet.</p>
        ) : (
          <ul className="divide-y">
            {assigned.map((childId) => (
              <AssignedRow key={childId} childId={childId} onRemove={remover(childId)} />
            ))}
          </ul>
        )}
        <Picker expertId={expert.id} assigned={assigned} />
      </CardContent>
    </Card>
  );
}
