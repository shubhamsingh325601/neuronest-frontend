"use client";

import Link from "next/link";
import { useState } from "react";
import { UserMinus, UserPlus } from "lucide-react";
import { ErrorState, LoadingState } from "../../../app-shell/states";
import { ErrorCode, isApiError } from "../../../lib/api-errors";
import { describeError } from "../../../lib/describe-error";
import { formatDate } from "../../../lib/format";
import { ADMIN_ROUTES } from "../../../navigation/paths";
import { toast } from "../../../notifications/toast";
import { Button } from "../../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { ConfirmDialog } from "../../../ui/confirm-dialog";
import { useCliniciansQuery, useClinicianQuery } from "../../clinicians/hooks/use-clinicians";
import type { Assignment } from "../api/types";
import { useAssignClinician, useCareTeamQuery, useRevokeClinician } from "../hooks/use-children";

const SELECT_CLASS =
  "h-11 min-w-0 flex-1 rounded-xl border border-input bg-background px-4 text-sm transition-colors disabled:opacity-50";

function failure(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 409) return "That clinician is already on this child's care team.";
    if (error.status === 404) return "The clinician or child could not be found. Reload and try again.";
    if (error.code === ErrorCode.RateLimited) return "Too many requests. Wait a moment and try again.";
    if (error.code === ErrorCode.BackendUnreachable) return "The NeuroNest service could not be reached. Try again shortly.";
    if (error.code === ErrorCode.InsufficientPermissions) return "Your account is not allowed to do this.";
  }
  return "Something went wrong. Please try again.";
}

function MemberName({ clinicianId }: { clinicianId: string }) {
  const clinician = useClinicianQuery(clinicianId);
  return (
    <Link href={`${ADMIN_ROUTES.clinicians}/${encodeURIComponent(clinicianId)}`} className="font-medium hover:underline">
      {clinician.data?.name ?? (clinician.isError ? "Clinician" : "…")}
    </Link>
  );
}

function Member({ childId, assignment }: { childId: string; assignment: Assignment }) {
  const revoke = useRevokeClinician(childId);
  async function remove() {
    try {
      await revoke.mutateAsync(assignment.clinicianId);
      toast.success("Clinician removed from the care team");
    } catch (error) {
      toast.error("Could not remove the clinician", { description: failure(error) });
      throw error; // keeps the confirm dialog open
    }
  }
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="grid gap-0.5 text-sm">
        <MemberName clinicianId={assignment.clinicianId} />
        <span className="text-muted-foreground">Assigned {formatDate(assignment.createdAt)}</span>
      </div>
      <ConfirmDialog
        destructive
        title="Remove from care team?"
        description="They lose access to this child's records straight away. You can assign them again later."
        confirmLabel="Remove"
        onConfirm={remove}
        trigger={
          <Button variant="outline" size="sm">
            <UserMinus aria-hidden="true" /> Remove
          </Button>
        }
      />
    </li>
  );
}

function AssignForm({ childId, assignedIds }: { childId: string; assignedIds: Set<string> }) {
  const clinicians = useCliniciansQuery({ status: "ACTIVE" });
  const assign = useAssignClinician(childId);
  const [selected, setSelected] = useState("");
  const options = clinicians.items.filter((clinician) => !assignedIds.has(clinician.id));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    assign.mutate(selected, {
      onSuccess: () => {
        setSelected("");
        toast.success("Clinician assigned");
      },
      onError: (error) => toast.error("Could not assign the clinician", { description: failure(error) }),
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-2 border-t pt-4">
      <label htmlFor="assign-clinician" className="text-sm font-medium">
        Assign a clinician
      </label>
      <div className="flex flex-wrap gap-2">
        <select
          id="assign-clinician"
          className={SELECT_CLASS}
          value={selected}
          disabled={clinicians.isPending || assign.isPending}
          onChange={(event) => setSelected(event.target.value)}
        >
          <option value="">{clinicians.isPending ? "Loading clinicians…" : "Choose a clinician"}</option>
          {options.map((clinician) => (
            <option key={clinician.id} value={clinician.id}>
              {clinician.name} ({clinician.email})
            </option>
          ))}
        </select>
        <Button type="submit" disabled={!selected || assign.isPending}>
          <UserPlus aria-hidden="true" /> {assign.isPending ? "Assigning…" : "Assign"}
        </Button>
      </div>
      {clinicians.isError ? (
        <p role="alert" className="text-sm text-destructive">
          Could not load clinicians.{" "}
          <button type="button" className="underline" onClick={() => void clinicians.refetch()}>
            Retry
          </button>
        </p>
      ) : options.length === 0 && !clinicians.isPending ? (
        <p className="text-sm text-muted-foreground">
          {clinicians.hasNextPage ? "No more clinicians on this page." : "No active clinicians available to assign."}
        </p>
      ) : null}
      {clinicians.hasNextPage ? (
        <button
          type="button"
          className="w-fit text-sm underline underline-offset-4"
          onClick={() => void clinicians.fetchNextPage()}
          disabled={clinicians.isFetchingNextPage}
        >
          {clinicians.isFetchingNextPage ? "Loading…" : "Load more clinicians"}
        </button>
      ) : null}
    </form>
  );
}

/** A child's care team: who is assigned, plus assign (ACTIVE clinicians only) and remove. */
export function CareTeam({ childId }: { childId: string }) {
  const team = useCareTeamQuery(childId);
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Care team</CardTitle>
        <CardDescription>Assigned clinicians can see this child&apos;s records and write their plans.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {team.isPending ? (
          <LoadingState rows={2} label="Loading care team" />
        ) : team.isError ? (
          <ErrorState {...describeError(team.error, "the care team")} onRetry={() => void team.refetch()} />
        ) : (
          <>
            {team.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No clinician is assigned yet.</p>
            ) : (
              <ul className="divide-y">
                {team.data.map((assignment) => (
                  <Member key={assignment.id} childId={childId} assignment={assignment} />
                ))}
              </ul>
            )}
            <AssignForm childId={childId} assignedIds={new Set(team.data.map((a) => a.clinicianId))} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
