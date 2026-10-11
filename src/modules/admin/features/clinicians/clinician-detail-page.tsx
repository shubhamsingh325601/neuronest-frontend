"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "../../app-shell/page-header";
import { ErrorState, LoadingState } from "../../app-shell/states";
import { isApiError } from "../../lib/api-errors";
import { describeError } from "../../lib/describe-error";
import { formatDate } from "../../lib/format";
import { ADMIN_ROUTES } from "../../navigation/paths";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { StatusBadge } from "../../ui/status-badge";
import type { ClinicianDetail } from "./api/types";
import { EditForm } from "./components/edit-form";
import { StatusActions } from "./components/status-actions";
import { useClinicianQuery } from "./hooks/use-clinicians";

const when = (value: string | null, fallback = "—") => (value ? formatDate(value) : fallback);

function Lifecycle({ clinician }: { clinician: ClinicianDetail }) {
  const rows: [string, string][] = [
    ["Added", when(clinician.createdAt)],
    ["Invitation sent", when(clinician.invitationSentAt)],
    ...(clinician.status === "INVITED" ? [["Invitation expires", when(clinician.invitationExpiresAt)] as [string, string]] : []),
    ["Activated", when(clinician.activatedAt, "Not yet")],
    ["Last sign-in", when(clinician.lastLoginAt, "Never")],
  ];
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Account activity</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b pb-2 sm:block sm:border-0 sm:pb-0">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 border-t pt-3 text-sm">
          <p className="text-muted-foreground">Assigned children</p>
          {clinician.assignedChildIds.length === 0 ? (
            <p className="font-medium">None yet</p>
          ) : (
            <ul className="mt-1 grid gap-1">
              {clinician.assignedChildIds.map((childId, index) => (
                <li key={childId}>
                  <Link href={`${ADMIN_ROUTES.children}/${encodeURIComponent(childId)}`} className="underline underline-offset-4">
                    Child {index + 1}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ClinicianDetailPage({ id }: { id: string }) {
  const query = useClinicianQuery(id);
  const back = (
    <Button variant="ghost" asChild>
      <Link href={ADMIN_ROUTES.clinicians}>
        <ArrowLeft aria-hidden="true" /> All clinicians
      </Link>
    </Button>
  );

  if (query.isPending) return <LoadingState label="Loading clinician" />;

  if (query.isError) {
    const notFound = isApiError(query.error) && query.error.status === 404;
    return (
      <div className="grid gap-6">
        <div>{back}</div>
        {notFound ? (
          <ErrorState title="Clinician not found" description="They may have been removed, or the link is wrong." />
        ) : (
          <ErrorState {...describeError(query.error, "this clinician")} onRetry={() => void query.refetch()} />
        )}
      </div>
    );
  }

  const clinician = query.data;
  return (
    <div className="grid gap-6">
      <div>{back}</div>
      <PageHeader
        title={clinician.name}
        description={clinician.email}
        eyebrow={<StatusBadge status={clinician.status} />}
        actions={<StatusActions clinician={clinician} />}
      />
      <Lifecycle clinician={clinician} />
      {/* Keyed so the form resets when the server data changes under it (status change, saved edit). */}
      <EditForm key={`${clinician.status}:${clinician.email}:${clinician.name}`} clinician={clinician} />
    </div>
  );
}
