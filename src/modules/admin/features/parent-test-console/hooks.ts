"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState, useSyncExternalStore } from "react";
import { impersonateParent } from "./api";
import { useConsoleSession } from "./state/session";

/**
 * "Act as this parent". The token goes straight into the in-memory session store inside `mutationFn`, and the
 * mutation resolves to nothing, so it never sits in the React Query mutation cache.
 */
export function useActAsParent() {
  const startParent = useConsoleSession((s) => s.startParent);
  return useMutation({
    mutationFn: async (parentId: string) => {
      startParent(await impersonateParent(parentId));
    },
  });
}

/** Epoch ms that re-renders its component every `intervalMs`; `null` stops the ticking. */
export function useNow(intervalMs: number | null = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (intervalMs === null) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function useMediaQuery(query: string, serverValue: boolean): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/** `prefers-reduced-motion: reduce`. Text then appears at once instead of being revealed word by word. */
export const usePrefersReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)", false);

/** Tailwind's `lg` breakpoint: the Diagnostics drawer sits beside the chat from here up, in a sheet below. */
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)", false);
