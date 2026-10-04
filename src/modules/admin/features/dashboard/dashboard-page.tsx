import { Construction } from "lucide-react";
import { PageHeader } from "../../app-shell/page-header";
import { Badge } from "../../ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { SystemStatusCard } from "../system/components/system-status-card";
import { QuickActions } from "./components/quick-actions";
import { SummaryCards } from "./components/summary-cards";

export function DashboardPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Welcome back" description="Here is what needs your attention across NeuroNest." />
      <SummaryCards />
      <div className="grid gap-4 lg:grid-cols-3">
        <SystemStatusCard />
        <QuickActions />
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Recent activity</CardTitle>
              <Badge tone="warning">
                <Construction aria-hidden="true" /> Placeholder
              </Badge>
            </div>
            <CardDescription>
              Not built yet. The backend has no activity feed, so nothing is shown here until one exists.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
