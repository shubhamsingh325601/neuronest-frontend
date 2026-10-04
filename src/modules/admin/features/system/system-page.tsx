"use client";

import { Bot, Construction, RefreshCw } from "lucide-react";
import { PageHeader } from "../../app-shell/page-header";
import { ErrorState } from "../../app-shell/states";
import { describeError } from "../../lib/describe-error";
import { formatClockTime, formatUptime } from "../../lib/format";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Skeleton } from "../../ui/skeleton";
import { HealthBadge, healthSummary } from "./components/health-status";
import { HEALTH_POLL_MS, useHealthQuery } from "./hooks/use-health";

const STATE_WORD = { up: "Up", down: "Down", unknown: "Unknown" } as const;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

export function SystemPage() {
  const health = useHealthQuery();
  const copy = health.isError ? describeError(health.error, "system health") : null;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="System"
        description="Live platform health."
        actions={
          <Button variant="outline" size="sm" onClick={() => void health.refetch()} disabled={health.isFetching}>
            <RefreshCw className={health.isFetching ? "animate-spin" : undefined} aria-hidden="true" />
            {health.isFetching ? "Checking" : "Check now"}
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="grid gap-1.5">
            <CardTitle>Service health</CardTitle>
            <CardDescription>Refreshes every {HEALTH_POLL_MS / 1000} seconds while this tab is open.</CardDescription>
          </div>
          {health.data ? <HealthBadge state={health.data.state} /> : null}
        </CardHeader>
        <CardContent aria-live="polite">
          {health.isPending ? (
            <div role="status" className="grid gap-3">
              <span className="sr-only">Loading system health</span>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : copy ? (
            <ErrorState title={copy.title} description={copy.description} onRetry={() => void health.refetch()} />
          ) : (
            <>
              <p className="mb-2 text-sm text-muted-foreground">{healthSummary(health.data!.state)}</p>
              <dl className="divide-y">
                <Row label="API">{STATE_WORD[health.data!.api]}</Row>
                <Row label="Database">{STATE_WORD[health.data!.database]}</Row>
                <Row label="API uptime">
                  {health.data!.uptimeSeconds === null ? "Unknown" : formatUptime(health.data!.uptimeSeconds)}
                </Row>
                <Row label="Last checked">{formatClockTime(health.dataUpdatedAt)}</Row>
              </dl>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Bot className="size-4" aria-hidden="true" />
            <CardTitle>AI observability</CardTitle>
            <Badge tone="warning">
              <Construction aria-hidden="true" /> Placeholder
            </Badge>
          </div>
          <CardDescription>
            Not built yet. The backend has no AI usage or quality endpoint, so nothing is shown here until one exists.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
