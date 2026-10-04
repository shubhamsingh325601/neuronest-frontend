"use client";

import Link from "next/link";
import { Baby, ClipboardList, MailPlus, Stethoscope, UserRound, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorState } from "../../../app-shell/states";
import { describeError } from "../../../lib/describe-error";
import { formatCount } from "../../../lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { Skeleton } from "../../../ui/skeleton";
import type { AdminSummary } from "../api/types";
import { useAdminSummaryQuery } from "../hooks/use-admin-summary";

interface CardSpec {
  key: keyof AdminSummary;
  label: string;
  icon: LucideIcon;
  /** Where the number leads. Pages that are still placeholders simply show their placeholder. */
  href?: string;
  hint: string;
  highlight?: boolean;
}

// Invited clinicians leads and is highlighted: pending invitations are what an admin follows up on.
const CARDS: CardSpec[] = [
  { key: "invitedClinicians", label: "Invited clinicians", icon: MailPlus, href: "/clinicians?status=INVITED", hint: "Waiting to set up their account", highlight: true },
  { key: "activeClinicians", label: "Active clinicians", icon: Stethoscope, href: "/clinicians", hint: "Can sign in and see assigned children" },
  { key: "activeParents", label: "Active parents", icon: UserRound, href: "/users?role=PARENT", hint: "Verified parent accounts" },
  { key: "activePlans", label: "Active plans", icon: ClipboardList, hint: "Plans currently in progress" },
  { key: "childrenWithAssignedClinician", label: "Children with a clinician", icon: Users, href: "/children", hint: "Have at least one clinician" },
  { key: "childrenWithoutClinician", label: "Children without a clinician", icon: Baby, href: "/children", hint: "Need a clinician assigned" },
];

function SummaryCard({ spec, value }: { spec: CardSpec; value: number | undefined }) {
  const { label, icon: Icon, highlight, hint, href } = spec;
  const card = (
    <Card className={cn("h-full", highlight && "border-transparent bg-brand-panel text-brand-panel-foreground shadow-md")}>
      <CardHeader className="flex-row items-center gap-3 space-y-0 pb-3">
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-lg",
            highlight ? "bg-brand-panel-foreground/15" : "bg-accent text-accent-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-1">
        {value === undefined ? (
          <>
            <Skeleton className={cn("h-9 w-20", highlight && "bg-brand-panel-foreground/20")} />
            <span className="sr-only">Loading</span>
          </>
        ) : (
          <p className="text-3xl font-semibold tracking-tight">{formatCount(value)}</p>
        )}
        <p className={cn("text-xs", highlight ? "text-brand-panel-muted" : "text-muted-foreground")}>{hint}</p>
      </CardContent>
    </Card>
  );
  return href && value !== undefined ? (
    <Link href={href} className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {card}
    </Link>
  ) : (
    card
  );
}

export function SummaryCards() {
  const summary = useAdminSummaryQuery();

  if (summary.isError) {
    const copy = describeError(summary.error, "dashboard");
    return <ErrorState title={copy.title} description={copy.description} onRetry={() => void summary.refetch()} />;
  }

  return (
    <section aria-label="Summary" aria-busy={summary.isPending} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {CARDS.map((spec) => (
        <SummaryCard key={spec.key} spec={spec} value={summary.data?.[spec.key]} />
      ))}
    </section>
  );
}
