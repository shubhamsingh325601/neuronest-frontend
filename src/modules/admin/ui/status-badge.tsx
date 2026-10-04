import { Ban, CheckCircle2, CircleDashed, Clock, XCircle, type LucideIcon } from "lucide-react";
import { Badge, type BadgeTone } from "./badge";

interface StatusStyle {
  tone: BadgeTone;
  icon: LucideIcon;
}

// The single place that maps backend status enums to a tone. Status is always shown as text
// plus an icon, never by colour alone. Enum values are PROVISIONAL until the backend contract
// is final (plan 0001, guardrails); unknown values fall back to a neutral badge.
// Enum values below come from the OpenAPI snapshot of 2026-10-04.
const STATUS_STYLES: Record<string, StatusStyle> = {
  // Accounts
  ACTIVE: { tone: "success", icon: CheckCircle2 },
  INVITED: { tone: "info", icon: Clock },
  SUSPENDED: { tone: "destructive", icon: Ban },
  DEACTIVATED: { tone: "neutral", icon: Ban },
  // Clinician applications: removed backend-side (plan 0001 contract check); kept so old rows still render.
  PENDING: { tone: "warning", icon: Clock },
  REVIEWED: { tone: "info", icon: Clock },
  APPROVED: { tone: "success", icon: CheckCircle2 },
  REJECTED: { tone: "destructive", icon: XCircle },
  // Plans and plan templates
  DRAFT: { tone: "neutral", icon: CircleDashed },
  PUBLISHED: { tone: "success", icon: CheckCircle2 },
  COMPLETED: { tone: "info", icon: CheckCircle2 },
  ARCHIVED: { tone: "neutral", icon: Ban },
  // Media uploads
  UPLOADED: { tone: "success", icon: CheckCircle2 },
  FAILED: { tone: "destructive", icon: XCircle },
};

const FALLBACK: StatusStyle = { tone: "neutral", icon: CircleDashed };

export function statusLabel(status: string): string {
  const lower = status.replace(/_/g, " ").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function statusStyle(status: string): StatusStyle {
  return STATUS_STYLES[status] ?? FALLBACK;
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const { tone, icon: Icon } = statusStyle(status);
  return (
    <Badge tone={tone} className={className}>
      <Icon aria-hidden="true" />
      {statusLabel(status)}
    </Badge>
  );
}
