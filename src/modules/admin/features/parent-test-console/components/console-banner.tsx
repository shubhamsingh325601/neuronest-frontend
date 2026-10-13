"use client";

import { LogOut, TimerReset } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../../../ui/button";
import { expiryLevel, formatCountdown, secondsRemaining } from "../countdown";
import { useNow } from "../hooks";
import { useConsoleSession } from "../state/session";

/**
 * Always visible while a parent token exists: who the admin is acting as, how long the token has left, and Exit.
 * At 0 it drops the token itself, which unmounts the panels and aborts their streams.
 */
export function ConsoleBanner() {
  const parent = useConsoleSession((s) => s.parent);
  const expiresAt = useConsoleSession((s) => s.expiresAt);
  const exitParent = useConsoleSession((s) => s.exitParent);
  const now = useNow();

  const remaining = expiresAt === null ? 0 : secondsRemaining(expiresAt, now);
  const level = expiryLevel(remaining);

  useEffect(() => {
    if (level === "expired") exitParent("expired");
  }, [level, exitParent]);

  if (!parent) return null;
  return (
    <div
      role="region"
      aria-label="Impersonation"
      className={cn(
        "sticky top-[4.5rem] z-20 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl border px-4 py-3 shadow-sm backdrop-blur",
        level === "warning" ? "border-warning/50 bg-warning/10" : "border-info/40 bg-info/10",
      )}
    >
      <p className="min-w-0 text-sm">
        Acting as <span className="font-semibold">{parent.name}</span>{" "}
        <span className="text-muted-foreground">({parent.email})</span>
      </p>
      <div className="flex items-center gap-3">
        <p className={cn("flex items-center gap-1.5 text-sm tabular-nums", level === "warning" && "font-semibold text-warning")}>
          <TimerReset className="size-4" aria-hidden="true" />
          <span>Expires in</span>
          <time role="timer" aria-live="off">
            {formatCountdown(remaining)}
          </time>
        </p>
        <Button size="sm" variant="outline" onClick={() => exitParent()}>
          <LogOut aria-hidden="true" />
          Exit
        </Button>
      </div>
      <span className="sr-only" role="status">
        {level === "warning" ? "Less than five minutes left on this session." : ""}
      </span>
    </div>
  );
}
