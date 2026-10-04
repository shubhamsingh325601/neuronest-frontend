"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { describeError } from "../../../lib/describe-error";
import { Button } from "../../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { Skeleton } from "../../../ui/skeleton";
import { useHealthQuery } from "../hooks/use-health";
import { HealthBadge, healthSummary } from "./health-status";

// Compact health card for the dashboard. Shares the System page's query, so one poll serves both.
export function SystemStatusCard() {
  const health = useHealthQuery();
  const copy = health.isError ? describeError(health.error, "the system status") : null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle>System status</CardTitle>
        {health.data ? <HealthBadge state={health.data.state} /> : null}
      </CardHeader>
      <CardContent className="grid gap-3" aria-live="polite">
        {health.isPending ? (
          <div role="status" className="grid gap-2">
            <span className="sr-only">Checking system status</span>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : copy ? (
          <div className="grid gap-3" role="alert">
            <p className="text-sm text-muted-foreground">
              {copy.title}. {copy.description}
            </p>
            <Button variant="outline" size="sm" className="justify-self-start" onClick={() => void health.refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{healthSummary(health.data!.state)}</p>
        )}
        <Link
          href="/system"
          className="inline-flex items-center gap-1 justify-self-start rounded-sm text-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          System details <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}
