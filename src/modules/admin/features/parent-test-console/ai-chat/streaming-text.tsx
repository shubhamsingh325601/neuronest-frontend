"use client";

import { splitSettled } from "../smooth-text";
import type { SmoothReveal } from "./use-smooth-reveal";

/** Newest words that carry the entrance animation; older ones are merged into one plain string. */
const FRESH_TAIL = 14;

/**
 * The visible reply. Settled text is a single string (a small DOM however long the reply), only the newest
 * words are animated spans, and a soft caret trails the end while text is still arriving.
 */
export function StreamingText({ reveal }: { reveal: SmoothReveal }) {
  const { settled, fresh } = splitSettled(reveal.words, reveal.count, FRESH_TAIL);
  return (
    <p className="whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed" aria-hidden={!reveal.done}>
      {settled}
      {fresh.map((word) => (
        <span key={word.index} className="pc-word">
          {word.text}
        </span>
      ))}
      {reveal.done ? null : <span className="pc-caret" aria-hidden="true" />}
    </p>
  );
}
