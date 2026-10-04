"use client";

import { useEffect } from "react";
import { DUE_STORAGE_KEY, FALLBACK_DELAY_MS, readDue, refreshSession } from "./browser-refresh";

// Keeps the session alive: refreshes the access token at ~80% of its lifetime (the server passes the due time).
// The refresh itself (single-flight, cross-tab lock, 429 back-off) lives in browser-refresh.ts and is shared
// with the API client. A dead session (refresh token invalid, account disabled) goes to the sign-in screen;
// the handler has already cleared the cookies.

export function SessionKeeper({ refreshAt }: { refreshAt: number | null }) {
  useEffect(() => {
    let timer: number | undefined;
    let due = 0;
    let stopped = false;

    function schedule(at: number) {
      window.clearTimeout(timer);
      due = at;
      timer = window.setTimeout(run, Math.max(0, at - Date.now()));
    }

    async function run() {
      if (stopped) return;
      const outcome = await refreshSession();
      if (stopped) return;
      if ("redirect" in outcome) window.location.assign(outcome.redirect);
      else schedule(outcome.next);
    }

    schedule(Math.max(refreshAt ?? Date.now() + FALLBACK_DELAY_MS, readDue()));

    // Timers are throttled in background tabs: catch up as soon as the tab is visible again.
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() >= due) void run();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === DUE_STORAGE_KEY && Number(event.newValue) > due) schedule(Number(event.newValue));
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("storage", onStorage);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("storage", onStorage);
    };
  }, [refreshAt]);

  return null;
}
