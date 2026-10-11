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
import { AssignedChildren } from "./components/assigned-children";
import { EditForm } from "./components/edit-form";
import { ResetPassword } from "./components/reset-password";
import { StatusActions } from "./components/status-actions";
import { useExpertQuery } from "./hooks/use-experts";

export function ExpertDetailPage({ id }: { id: string }) {
  const query = useExpertQuery(id);
  const back = (
    <Button variant="ghost" asChild>
      <Link href={ADMIN_ROUTES.experts}>
        <ArrowLeft aria-hidden="true" /> All experts
      </Link>
    </Button>
  );

  if (query.isPending) return <LoadingState label="Loading expert" />;

  if (query.isError) {
    const notFound = isApiError(query.error) && query.error.status === 404;
    return (
      <div className="grid gap-6">
        <div>{back}</div>
        {notFound ? (
          <ErrorState title="Expert not found" description="They may have been removed, or the link is wrong." />
        ) : (
          <ErrorState {...describeError(query.error, "this expert")} onRetry={() => void query.refetch()} />
        )}
      </div>
    );
  }

  const expert = query.data;
  return (
    <div className="grid gap-6">
      <div>{back}</div>
      <PageHeader title={expert.name} description={expert.email} eyebrow={<StatusBadge status={expert.status} />} actions={<StatusActions expert={expert} />} />
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Account activity</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Added</dt>
              <dd className="font-medium">{formatDate(expert.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last sign-in</dt>
              <dd className="font-medium">{expert.lastLoginAt ? formatDate(expert.lastLoginAt) : "Never"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <AssignedChildren expert={expert} />
      {/* Keyed so the form resets when the server data changes under it (saved edit). */}
      <EditForm key={`${expert.email}:${expert.name}`} expert={expert} />
      <ResetPassword expert={expert} />
    </div>
  );
}
