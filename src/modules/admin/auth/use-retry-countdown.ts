"use client";

import { useEffect, useState } from "react";

/** Whole seconds left until `retryUntil` (epoch ms), 0 when unset or passed. Re-renders once a second while counting. */
export function useRetryCountdown(retryUntil: number | undefined): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!retryUntil) return;
    const timer = window.setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= retryUntil) window.clearInterval(timer);
    }, 500);
    return () => window.clearInterval(timer);
  }, [retryUntil]);

  return retryUntil ? Math.max(0, Math.ceil((retryUntil - now) / 1000)) : 0;
}
