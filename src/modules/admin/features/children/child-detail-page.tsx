"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Tabs } from "radix-ui";
import { cn } from "@/lib/utils";
import { PageHeader } from "../../app-shell/page-header";
import { ErrorState, LoadingState } from "../../app-shell/states";
import { isApiError } from "../../lib/api-errors";
import { describeError } from "../../lib/describe-error";
import { formatDate } from "../../lib/format";
import { ADMIN_ROUTES } from "../../navigation/paths";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { formatAge } from "./age";
import { CHILD_TABS, parseChildTab } from "./child-tabs";
import { CareTeam } from "./components/care-team";
import { ChildExperts } from "./components/child-experts";
import { ParentLink } from "./components/parent-link";
import { useChildQuery } from "./hooks/use-children";

// Each record tab is its own chunk, fetched only when the tab is first opened.
const tabLoading = (label: string) =>
  function TabLoading() {
    return <LoadingState label={label} />;
  };
const PlansTab = dynamic(() => import("../child-records/plans-tab"), { loading: tabLoading("Loading plans") });
const MediaTab = dynamic(() => import("../child-records/media-tab"), { loading: tabLoading("Loading media") });
const CallsTab = dynamic(() => import("../child-records/calls-tab"), { loading: tabLoading("Loading call history") });

export function ChildDetailPage({ id }: { id: string }) {
  const query = useChildQuery(id);
  const router = useRouter();
  const params = useSearchParams();
  // The tab lives in the URL so a reload or a shared link lands on the same tab.
  const tab = parseChildTab(params.get("tab"));
  const base = `${ADMIN_ROUTES.children}/${encodeURIComponent(id)}`;
  const selectTab = (next: string) => router.replace(next === "overview" ? base : `${base}?tab=${next}`, { scroll: false });

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
      <PageHeader title={child.name} description="Profile, care team, experts, plans, media and calls." />
      <Tabs.Root value={tab} onValueChange={selectTab} className="grid gap-6">
        <Tabs.List aria-label="Child record sections" className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border p-1">
          {CHILD_TABS.map((entry) => (
            <Tabs.Trigger
              key={entry.value}
              value={entry.value}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
              )}
            >
              {entry.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {/* Radix mounts only the active panel, so a tab's queries start when it is first opened. */}
        <Tabs.Content value="overview" className="grid gap-6">
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
          <ChildExperts childId={child.id} />
        </Tabs.Content>
        <Tabs.Content value="plans">
          <PlansTab childId={child.id} />
        </Tabs.Content>
        <Tabs.Content value="media">
          <MediaTab childId={child.id} />
        </Tabs.Content>
        <Tabs.Content value="calls">
          <CallsTab childId={child.id} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
