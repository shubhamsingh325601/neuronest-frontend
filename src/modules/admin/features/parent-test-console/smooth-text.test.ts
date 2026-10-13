import { describe, expect, it } from "vitest";
import {
  advanceReveal,
  INITIAL_REVEAL,
  MAX_FRAME_MS,
  MAX_LAG_MS,
  MIN_WORDS_PER_SECOND,
  revealRate,
  revealedText,
  splitSettled,
  splitWords,
  type RevealState,
} from "./smooth-text";

describe("splitWords", () => {
  it("keeps trailing whitespace so joining restores the text", () => {
    for (const text of ["Hello there. How are you?", "  leading and  double  spaces ", "line one\n\nline two", "x", ""]) {
      expect(splitWords(text).join("")).toBe(text);
    }
    expect(splitWords("one two  three")).toEqual(["one ", "two  ", "three"]);
  });

  it("does not split inside a word, punctuation or an emoji", () => {
    expect(splitWords("don't stop—ever 😀 ok")).toEqual(["don't ", "stop—ever ", "😀 ", "ok"]);
  });
});

describe("revealRate", () => {
  it("never goes below the reading pace", () => {
    expect(revealRate(0)).toBe(MIN_WORDS_PER_SECOND);
    expect(revealRate(1)).toBe(MIN_WORDS_PER_SECOND);
  });

  it("clears any backlog within the lag cap", () => {
    for (const backlog of [10, 25, 80, 300]) {
      const rate = revealRate(backlog);
      expect(backlog / rate).toBeLessThanOrEqual(MAX_LAG_MS / 1000 + 1e-9);
    }
  });
});

describe("advanceReveal", () => {
  it("shows nothing when no time has passed", () => {
    expect(advanceReveal(INITIAL_REVEAL, 10, 0)).toMatchObject({ revealed: 0, carry: 0 });
  });

  it("carries fractions of a word between frames", () => {
    let state: RevealState = INITIAL_REVEAL;
    const shown: number[] = [];
    for (let frame = 0; frame < 6; frame++) {
      state = advanceReveal(state, 3, 16.7);
      shown.push(state.revealed);
    }
    // 16 words/s at ~60 fps is ~0.27 of a word per frame: the first word lands on the 4th frame.
    expect(shown).toEqual([0, 0, 0, 1, 1, 1]);
  });

  it("never passes the words received", () => {
    const state = advanceReveal({ ...INITIAL_REVEAL, revealed: 2, carry: 0.5, knownTotal: 3 }, 3, 1000);
    expect(state.revealed).toBe(3);
    expect(state.carry).toBe(0);
  });

  it("stays put with nothing waiting and drops the carry", () => {
    expect(advanceReveal({ ...INITIAL_REVEAL, revealed: 5, carry: 0.9, rate: 40, knownTotal: 5 }, 5, 16)).toEqual({ revealed: 5, carry: 0, rate: 0, knownTotal: 5 });
  });

  it("catches up on a sentence-sized lump within the lag cap", () => {
    let state: RevealState = INITIAL_REVEAL;
    let elapsed = 0;
    while (state.revealed < 18) {
      state = advanceReveal(state, 18, 16);
      elapsed += 16;
      expect(elapsed).toBeLessThan(2000);
    }
    expect(elapsed).toBeLessThanOrEqual(MAX_LAG_MS + 50);
  });

  it("keeps the lag bounded as lumps keep arriving", () => {
    // One 15-word sentence every 1.2 s for 6 s, 60 fps. Lag = time since the oldest unrevealed word arrived.
    let state: RevealState = INITIAL_REVEAL;
    let total = 0;
    let worstLag = 0;
    const arrivals: number[] = []; // arrival time of each word
    for (let t = 0; t <= 8000; t += 16) {
      if (t % 1200 < 16 && t < 6000) {
        for (let i = 0; i < 15; i++) arrivals.push(t);
        total += 15;
      }
      state = advanceReveal(state, total, 16);
      if (state.revealed < total) worstLag = Math.max(worstLag, t - arrivals[state.revealed]);
    }
    expect(state.revealed).toBe(total);
    expect(worstLag).toBeLessThanOrEqual(MAX_LAG_MS + 50);
  });

  it("caps a long frame so a returning tab does not dump the text at once", () => {
    const slow = advanceReveal(INITIAL_REVEAL, 1000, 5000);
    const capped = advanceReveal(INITIAL_REVEAL, 1000, MAX_FRAME_MS);
    expect(slow).toEqual(capped);
  });

  it("ignores a negative frame time", () => {
    expect(advanceReveal(INITIAL_REVEAL, 10, -50)).toMatchObject({ revealed: 0, carry: 0 });
  });
});

describe("revealedText / splitSettled", () => {
  const words = splitWords("One two three four five six");

  it("returns the first n words", () => {
    expect(revealedText(words, 0)).toBe("");
    expect(revealedText(words, 2)).toBe("One two ");
    expect(revealedText(words, 99)).toBe("One two three four five six");
  });

  it("animates only the newest words", () => {
    const { settled, fresh } = splitSettled(words, 5, 2);
    expect(settled).toBe("One two three ");
    expect(fresh).toEqual([
      { index: 3, text: "four " },
      { index: 4, text: "five " },
    ]);
  });

  it("has nothing settled while the reply is shorter than the tail", () => {
    const { settled, fresh } = splitSettled(words, 2, 14);
    expect(settled).toBe("");
    expect(fresh.map((f) => f.index)).toEqual([0, 1]);
  });

  it("keeps settled and fresh equal to the revealed text", () => {
    for (let n = 0; n <= words.length; n++) {
      const { settled, fresh } = splitSettled(words, n, 3);
      expect(settled + fresh.map((f) => f.text).join("")).toBe(revealedText(words, n));
    }
  });
});
