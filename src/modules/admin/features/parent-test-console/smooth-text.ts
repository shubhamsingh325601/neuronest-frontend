// Client-side "flowing typing" for the AI reply. The backend sends text sentence by sentence (each sentence is
// safety-checked before it is released), so deltas arrive in lumps. This reveals them word by word at an
// adaptive rate: never slower than a comfortable reading pace, and fast enough that the visible text is never
// more than MAX_LAG_MS behind what has actually arrived. Pure maths; the component drives it from rAF.

/** The visible text is never more than this far behind the received text. */
export const MAX_LAG_MS = 350;
/** Typing pace when little is waiting (words per second). */
export const MIN_WORDS_PER_SECOND = 16;
/** A frame this long (a backgrounded tab) is treated as this long, so a return does not dump the text at once. */
export const MAX_FRAME_MS = 100;

/** Words with their trailing whitespace, so that joining them reproduces the text exactly. */
export function splitWords(text: string): string[] {
  return text.match(/\S+\s*|\s+/g) ?? [];
}

export interface RevealState {
  /** Whole words shown. */
  revealed: number;
  /** Fraction of a word earned but not yet shown, carried to the next frame. */
  carry: number;
  /** Words per second currently in force. Fixed when words arrive, so the catch-up is linear and ends on time. */
  rate: number;
  /** How many words had been received when the rate was last set. */
  knownTotal: number;
}

export const INITIAL_REVEAL: RevealState = { revealed: 0, carry: 0, rate: 0, knownTotal: 0 };

/** Words per second that clears `backlogWords` in MAX_LAG_MS, but never below the reading pace. */
export function revealRate(backlogWords: number): number {
  return Math.max(MIN_WORDS_PER_SECOND, backlogWords / (MAX_LAG_MS / 1000));
}

/**
 * One animation frame: how many more words to show after `dtMs`. Never passes `totalWords`. When new words have
 * arrived the rate is raised (never lowered) to clear the whole backlog within MAX_LAG_MS from now; once the
 * backlog is empty the rate resets, so a short reply is not shown at a lump's speed.
 */
export function advanceReveal(state: RevealState, totalWords: number, dtMs: number): RevealState {
  const backlog = totalWords - state.revealed;
  if (backlog <= 0) return { revealed: Math.min(state.revealed, totalWords), carry: 0, rate: 0, knownTotal: totalWords };

  const rate = totalWords > state.knownTotal ? Math.max(state.rate, revealRate(backlog)) : state.rate || revealRate(backlog);
  const dt = Math.min(Math.max(dtMs, 0), MAX_FRAME_MS);
  const earned = state.carry + (rate * dt) / 1000;
  const whole = Math.min(Math.floor(earned), backlog);
  const revealed = state.revealed + whole;
  const done = revealed >= totalWords;
  return { revealed, carry: done ? 0 : earned - whole, rate: done ? 0 : rate, knownTotal: totalWords };
}

/** The first `count` words of `words` as one string. */
export function revealedText(words: readonly string[], count: number): string {
  return words.slice(0, Math.max(0, count)).join("");
}

/** The newest `tail` revealed words get an entrance animation; everything before them is plain settled text. */
export function splitSettled(words: readonly string[], revealed: number, tail: number): { settled: string; fresh: { index: number; text: string }[] } {
  const count = Math.min(revealed, words.length);
  const firstFresh = Math.max(0, count - tail);
  return {
    settled: words.slice(0, firstFresh).join(""),
    fresh: words.slice(firstFresh, count).map((text, i) => ({ index: firstFresh + i, text })),
  };
}
