"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { FormAlert } from "./form-alert";
import { rateLimitedMessage } from "./error-messages";

interface SessionErrorViewProps {
  reason: "rate-limited" | "unavailable";
  /** Seconds from `Retry-After`, when the backend sent one. */
  retryAfter?: number;
  /** Validated path to return to. */
  next: string;
}

/**
 * Shown when a session refresh could not complete but the session may be fine (backend throttle or outage).
 * Offers a retry (counted down for 429) and a sign-out; it never clears the session itself.
 */
export function SessionErrorView({ reason, retryAfter, next }: SessionErrorViewProps) {
  const [remaining, setRemaining] = useState(reason === "rate-limited" ? (retryAfter ?? 60) : 0);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  const message =
    reason === "rate-limited"
      ? rateLimitedMessage(retryAfter)
      : "We could not reach the NeuroNest service to refresh your session. Your session is still active.";

  return (
    <div className="grid gap-5">
      <FormAlert tone={reason === "rate-limited" ? "notice" : "error"}>{message}</FormAlert>
      {/* Plain anchors on purpose: both targets are route handlers that must be fetched by a real navigation. */}
      {remaining > 0 ? (
        <Button size="lg" className="w-full" disabled>
          Try again in {remaining}s
        </Button>
      ) : (
        <Button asChild size="lg" className="w-full">
          <a href={`/api/auth/refresh?next=${encodeURIComponent(next)}`}>Try again</a>
        </Button>
      )}
      <Button asChild size="lg" variant="outline" className="w-full">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- route handler, needs a real navigation */}
        <a href="/api/auth/session-ended?reason=signed-out">Sign out</a>
      </Button>
    </div>
  );
}
