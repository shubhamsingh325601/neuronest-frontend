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
import { formatAge } from "./age";
import { CareTeam } from "./components/care-team";
import { ParentLink } from "./components/parent-link";
import { useChildQuery } from "./hooks/use-children";

export function ChildDetailPage({ id }: { id: string }) {
  const query = useChildQuery(id);
  const back = (
    <Button variant="ghost" asChild>
      <Link href={ADMIN_ROUTES.children}>
        <ArrowLeft aria-hidden="true" /> All children
      </Link>
    </Button>
  );

  if (query.isPending) return <LoadingState label="Loading child" />;
  if (query.isError) {
    const notFound = isApiError(query.error) && query.error.status === 404;
    return (
      <div className="grid gap-6">
        <div>{back}</div>
        {notFound ? (
          <ErrorState title="Child not found" description="The record may have been removed, or the link is wrong." />
        ) : (
          <ErrorState {...describeError(query.error, "this child")} onRetry={() => void query.refetch()} />
        )}
      </div>
    );
  }

  const child = query.data;
  const rows: [string, React.ReactNode][] = [
    ["Age", formatAge(child.dateOfBirth)],
    ["Date of birth", formatDate(child.dateOfBirth)],
    ["Parent", <ParentLink key="parent" parentId={child.parentId} />],
    ["Preferred name", child.preferredName ?? "—"],
    ["Gender", child.gender ?? "—"],
    ["Primary language", child.primaryLanguage ?? "—"],
    ["Added", formatDate(child.createdAt)],
  ];
  return (
    <div className="grid gap-6">
      <div>{back}</div>
      <PageHeader title={child.name} description="Child profile and care team." />
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          {child.accommodations ? (
            <div className="text-sm">
              <p className="text-muted-foreground">Accommodations (written by the family)</p>
              <p className="whitespace-pre-wrap font-medium">{child.accommodations}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <CareTeam childId={child.id} />
    </div>
  );
}
