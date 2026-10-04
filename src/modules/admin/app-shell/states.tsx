import { Inbox, RefreshCw, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

// Every data view composes Loading | Empty | Error | data (plan 0001 §9).

export function LoadingState({ rows = 4, label = "Loading", className }: { rows?: number; label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("grid gap-3", className)}>
      <span className="sr-only">{label}</span>
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

interface StateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

function Centered({ title, description, icon: Icon, action, className, tone }: StateProps & { tone: "neutral" | "destructive" }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center",
        tone === "destructive" && "border-destructive/40 bg-destructive/5",
        className,
      )}
    >
      {Icon ? (
        <span
          className={cn(
            "flex size-12 items-center justify-center rounded-full",
            tone === "destructive" ? "bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground",
          )}
        >
          <Icon className="size-6" aria-hidden="true" />
        </span>
      ) : null}
      <div className="grid gap-1">
        <p className="font-semibold">{title}</p>
        {description ? <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon = Inbox, ...props }: StateProps) {
  return <Centered icon={icon} tone="neutral" {...props} />;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this. Please try again.",
  onRetry,
  ...props
}: Partial<StateProps> & { onRetry?: () => void }) {
  return (
    <div role="alert">
      <Centered
        icon={TriangleAlert}
        tone="destructive"
        title={title}
        description={description}
        action={
          onRetry ? (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw aria-hidden="true" /> Try again
            </Button>
          ) : undefined
        }
        {...props}
      />
    </div>
  );
}
