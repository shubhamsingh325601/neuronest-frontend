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
import { DayGroups } from "../child-records/components/day-groups";
import { PersonLink } from "../child-records/components/person-link";
import { TemplateActions } from "./components/template-actions";
import { usePlanTemplateQuery } from "./hooks/use-plan-templates";

export function TemplateDetailPage({ id }: { id: string }) {
  const query = usePlanTemplateQuery(id);
  const back = (
    <Button variant="ghost" asChild>
      <Link href={ADMIN_ROUTES.planTemplates}>
        <ArrowLeft aria-hidden="true" /> All templates
      </Link>
    </Button>
  );

  if (query.isPending) return <LoadingState label="Loading template" />;
  if (query.isError) {
    const notFound = isApiError(query.error) && query.error.status === 404;
    return (
      <div className="grid gap-6">
        <div>{back}</div>
        {notFound ? (
          <ErrorState title="Template not found" description="It may have been removed, or the link is wrong." />
        ) : (
          <ErrorState {...describeError(query.error, "this template")} onRetry={() => void query.refetch()} />
        )}
      </div>
    );
  }

  const template = query.data;
  return (
    <div className="grid gap-6">
      <div>{back}</div>
      <PageHeader
        title={template.title}
        description={template.description ?? undefined}
        eyebrow={<StatusBadge status={template.status} />}
        actions={<TemplateActions template={template} />}
      />
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Days</dt>
              <dd className="font-medium">{template.days.length}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created by</dt>
              <dd className="font-medium">
                <PersonLink id={template.createdById} />
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">{formatDate(template.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last updated</dt>
              <dd className="font-medium">{formatDate(template.updatedAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Days</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <DayGroups content={template} />
        </CardContent>
      </Card>
    </div>
  );
}
