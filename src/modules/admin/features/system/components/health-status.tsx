import { CheckCircle2, TriangleAlert, XCircle, type LucideIcon } from "lucide-react";
import { Badge, type BadgeTone } from "../../../ui/badge";
import type { HealthSnapshot } from "../api/types";

const STATES: Record<HealthSnapshot["state"], { label: string; tone: BadgeTone; icon: LucideIcon; summary: string }> = {
  operational: { label: "Operational", tone: "success", icon: CheckCircle2, summary: "The service and its database are responding." },
  degraded: {
    label: "Degraded",
    tone: "warning",
    icon: TriangleAlert,
    summary: "The service is running but its database is not responding. Some features will fail until it recovers.",
  },
  down: { label: "Down", tone: "destructive", icon: XCircle, summary: "The NeuroNest service could not be reached." },
};

export function healthSummary(state: HealthSnapshot["state"]): string {
  return STATES[state].summary;
}

// Status is text plus an icon, never colour alone (plan 0001 §27).
export function HealthBadge({ state }: { state: HealthSnapshot["state"] }) {
  const { label, tone, icon: Icon } = STATES[state];
  return (
    <Badge tone={tone}>
      <Icon aria-hidden="true" />
      {label}
    </Badge>
  );
}
