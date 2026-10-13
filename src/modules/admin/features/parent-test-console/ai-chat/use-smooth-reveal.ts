"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePrefersReducedMotion } from "../hooks";
import { advanceReveal, INITIAL_REVEAL, splitWords, type RevealState } from "../smooth-text";

export interface SmoothReveal {
  words: string[];
  /** Whole words to show. */
  count: number;
  /** Nothing is waiting to be shown and no more text is expected: the caret goes, the footer may fade in. */
  done: boolean;
}

/**
 * Reveals `text` word by word (see smooth-text.ts) as it grows. `streaming` says more may still arrive.
 * `instant` shows everything at once: used for reduced motion and for text that replaces a retracted reply.
 */
export function useSmoothReveal(text: string, streaming: boolean, instant = false): SmoothReveal {
  const reduced = usePrefersReducedMotion();
  const words = useMemo(() => splitWords(text), [text]);
  const total = words.length;
  const skip = instant || reduced;

  const [shown, setShown] = useState(skip ? total : 0);
  const state = useRef<RevealState>(INITIAL_REVEAL);
  const totalRef = useRef(total);
  useEffect(() => {
    totalRef.current = total;
  }, [total]);

  const needsFrames = !skip && (streaming || shown < total);
  useEffect(() => {
    if (!needsFrames) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const next = advanceReveal(state.current, totalRef.current, now - last);
      last = now;
      state.current = next;
      setShown((current) => (current === next.revealed ? current : next.revealed));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [needsFrames]);

  // Under `skip` nothing is animated, so everything received is shown.
  const count = skip ? total : Math.min(shown, total);
  return { words, count, done: !streaming && count >= total };
}
