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
import { UserStatusActions } from "./components/user-status-actions";
import { useUserQuery } from "./hooks/use-users";
import { roleLabel } from "./role-label";

export function UserDetailPage({ id }: { id: string }) {
  const query = useUserQuery(id);
  const back = (
    <Button variant="ghost" asChild>
      <Link href={ADMIN_ROUTES.users}>
        <ArrowLeft aria-hidden="true" /> All users
      </Link>
    </Button>
  );

  if (query.isPending) return <LoadingState label="Loading user" />;
  if (query.isError) {
    const notFound = isApiError(query.error) && query.error.status === 404;
    return (
      <div className="grid gap-6">
        <div>{back}</div>
        {notFound ? (
          <ErrorState title="User not found" description="They may have been removed, or the link is wrong." />
        ) : (
          <ErrorState {...describeError(query.error, "this user")} onRetry={() => void query.refetch()} />
        )}
      </div>
    );
  }

  const user = query.data;
  const childIds = user.role === "PARENT" ? (user.childId ? [user.childId] : []) : user.assignedChildIds;
  return (
    <div className="grid gap-6">
      <div>{back}</div>
      <PageHeader
        title={user.name}
        description={user.email}
        eyebrow={<StatusBadge status={user.status} />}
        actions={<UserStatusActions user={user} />}
      />
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Role</dt>
              <dd className="font-medium">{roleLabel(user.role)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Joined</dt>
              <dd className="font-medium">{formatDate(user.createdAt)}</dd>
            </div>
          </dl>
          {user.role === "CLINICIAN" ? (
            <p className="mt-4 text-sm">
              <Link href={`${ADMIN_ROUTES.clinicians}/${encodeURIComponent(user.id)}`} className="underline underline-offset-4">
                Open clinician profile
              </Link>
            </p>
          ) : null}
        </CardContent>
      </Card>
      {user.role !== "ADMIN" ? (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>{user.role === "PARENT" ? "Child" : "Assigned children"}</CardTitle>
          </CardHeader>
          <CardContent>
            {childIds.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {user.role === "PARENT" ? "No child profile yet." : "No children assigned yet."}
              </p>
            ) : (
              <ul className="grid gap-2 text-sm">
                {childIds.map((childId) => (
                  <li key={childId}>
                    <Link href={`${ADMIN_ROUTES.children}/${encodeURIComponent(childId)}`} className="underline underline-offset-4">
                      View child
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
