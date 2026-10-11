"use client";

import Link from "next/link";
import { ErrorState, LoadingState } from "../../../app-shell/states";
import { describeError } from "../../../lib/describe-error";
import { formatDate } from "../../../lib/format";
import { ADMIN_ROUTES } from "../../../navigation/paths";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import type { ExpertAssignment } from "../../experts/api/types";
import { useChildExpertsQuery } from "../../experts/hooks/use-experts";
import { useUserQuery } from "../../users/hooks/use-users";

function ExpertRow({ assignment }: { assignment: ExpertAssignment }) {
  // Names come from the shared users lookup (long staleTime), the same one the parent link uses.
  const expert = useUserQuery(assignment.expertId);
  return (
    <li className="grid gap-0.5 py-3 text-sm">
      <Link href={`${ADMIN_ROUTES.experts}/${encodeURIComponent(assignment.expertId)}`} className="w-fit font-medium hover:underline">
        {expert.data?.name ?? (expert.isError ? "Expert" : "…")}
      </Link>
      <span className="text-muted-foreground">Assigned {formatDate(assignment.createdAt)}</span>
    </li>
  );
}

/** Read-only list of the experts assigned to a child. Assigning and removing happens on the expert's page. */
export function ChildExperts({ childId }: { childId: string }) {
  const experts = useChildExpertsQuery(childId);
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Experts</CardTitle>
        <CardDescription>
          Experts assigned to this child. To add or remove one, open the expert&apos;s page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {experts.isPending ? (
          <LoadingState rows={2} label="Loading experts" />
        ) : experts.isError ? (
          <ErrorState {...describeError(experts.error, "the experts")} onRetry={() => void experts.refetch()} />
        ) : experts.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No expert is assigned to this child.</p>
        ) : (
          <ul className="divide-y">
            {experts.data.map((assignment) => (
              <ExpertRow key={assignment.id} assignment={assignment} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
