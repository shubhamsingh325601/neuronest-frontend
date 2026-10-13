import { describe, expect, it } from "vitest";
import {
  aiChatReducer,
  composerState,
  FOOTER_PREFIX,
  initialAiChatState,
  isBusy,
  splitFooter,
  STOPPED_CODE,
  type AiChatAction,
  type AiChatState,
} from "./ai-chat-state";
import type { AiStreamEvent } from "./types";

const FOOTER = `${FOOTER_PREFIX}, not a diagnosis. Talk to your clinician.`;
const done = (over: Partial<Extract<AiStreamEvent, { type: "done" }>> = {}): AiStreamEvent => ({
  type: "done",
  messageId: "m1",
  seq: 2,
  state: "COMPLETE",
  conversationClosed: false,
  ...over,
});

function play(...actions: AiChatAction[]): AiChatState {
  return actions.reduce(aiChatReducer, initialAiChatState);
}
const send = (id = "a", text = "How do I help with routines?", at = 1_000): AiChatAction => ({ type: "send", clientMessageId: id, text, at });
const ev = (event: AiStreamEvent, id = "a"): AiChatAction => ({ type: "event", clientMessageId: id, event });
const lastTurn = (s: AiChatState) => s.turns[s.turns.length - 1];

describe("splitFooter", () => {
  it("separates a trailing disclaimer", () => {
    expect(splitFooter(`One. Two.\n\n${FOOTER}`)).toEqual({ reply: "One. Two.", footer: FOOTER });
  });
  it("returns the text untouched when there is no footer", () => {
    expect(splitFooter("Just text.")).toEqual({ reply: "Just text.", footer: null });
  });
  it("handles a reply that is only the footer", () => {
    expect(splitFooter(FOOTER)).toEqual({ reply: "", footer: FOOTER });
  });
});

describe("aiChatReducer: a normal reply", () => {
  it("goes submitted -> writing -> done and splits the footer", () => {
    let s = play(send());
    expect(lastTurn(s)).toMatchObject({ phase: "submitted", userText: "How do I help with routines?" });
    s = aiChatReducer(s, ev({ type: "delta", text: "Routines help. " }));
    expect(lastTurn(s)).toMatchObject({ phase: "writing", reply: "Routines help. ", footer: null });
    s = aiChatReducer(s, ev({ type: "delta", text: `Start small.\n\n${FOOTER}` }));
    expect(lastTurn(s)).toMatchObject({ phase: "writing", reply: "Routines help. Start small.", footer: FOOTER });
    s = aiChatReducer(s, ev(done()));
    expect(lastTurn(s)).toMatchObject({ phase: "done", doneState: "COMPLETE", messageId: "m1" });
    expect(s.closed).toBe(false);
    expect(composerState(s)).toBe("ready");
  });

  it("takes the footer from a footer event when the backend sends one", () => {
    const s = play(send(), ev({ type: "delta", text: "Hi." }), ev({ type: "footer", text: ` ${FOOTER} ` }), ev(done()));
    expect(lastTurn(s)).toMatchObject({ reply: "Hi.", footer: FOOTER, phase: "done" });
  });

  it("uses status events for the thinking and writing phases", () => {
    let s = play(send(), ev({ type: "status", phase: "thinking" }));
    expect(lastTurn(s).phase).toBe("thinking");
    expect(lastTurn(s).statusPhase).toBe("thinking");
    s = aiChatReducer(s, ev({ type: "status", phase: "checking" }));
    expect(lastTurn(s)).toMatchObject({ phase: "thinking", statusPhase: "checking" });
    s = aiChatReducer(s, ev({ type: "status", phase: "writing" }));
    expect(lastTurn(s)).toMatchObject({ phase: "writing", statusPhase: "writing" });
    s = aiChatReducer(s, ev({ type: "status", phase: "thinking" })); // never moves backwards
    expect(lastTurn(s)).toMatchObject({ phase: "writing", statusPhase: "writing" });
  });

  it("keeps the REDIRECTED state for the off-topic reply", () => {
    const s = play(send(), ev({ type: "delta", text: "I can only help with your child's care." }), ev(done({ state: "REDIRECTED" })));
    expect(lastTurn(s)).toMatchObject({ phase: "done", doneState: "REDIRECTED" });
  });

  it("closes the chat when done says so", () => {
    const s = play(send(), ev({ type: "delta", text: "No." }), ev(done({ state: "REDIRECTED", conversationClosed: true })));
    expect(s.closed).toBe(true);
    expect(composerState(s)).toBe("closed");
  });
});

describe("aiChatReducer: retract", () => {
  it("replaces everything shown and stays retracted after done", () => {
    let s = play(send(), ev({ type: "delta", text: "Unsafe start. " }), ev({ type: "retract", text: "Please talk to your clinician." }));
    expect(lastTurn(s)).toMatchObject({ phase: "retracted", reply: "Please talk to your clinician.", footer: null });
    s = aiChatReducer(s, ev(done({ state: "RETRACTED" })));
    expect(lastTurn(s)).toMatchObject({ phase: "retracted", doneState: "RETRACTED", messageId: "m1", reply: "Please talk to your clinician." });
  });
});

describe("aiChatReducer: failures", () => {
  it("marks an error event as failed with its code and keeps the user's message", () => {
    const s = play(send(), ev({ type: "delta", text: "Half" }), ev({ type: "error", code: "AI_TIMEOUT" }));
    expect(lastTurn(s)).toMatchObject({ phase: "failed", failureCode: "AI_TIMEOUT", userText: "How do I help with routines?" });
    expect(composerState(s)).toBe("ready");
  });

  it("closes the chat on a CONVERSATION_CLOSED error event", () => {
    const s = play(send(), ev({ type: "error", code: "CONVERSATION_CLOSED" }));
    expect(s.closed).toBe(true);
  });

  it("marks a stopped turn failed with the STOPPED code", () => {
    const s = play(send(), ev({ type: "delta", text: "Half" }), { type: "stopped", clientMessageId: "a" });
    expect(lastTurn(s)).toMatchObject({ phase: "failed", failureCode: STOPPED_CODE });
  });

  it("does not let stop or a broken stream overwrite a finished turn", () => {
    const s = play(send(), ev({ type: "delta", text: "Ok." }), ev(done()), { type: "stopped", clientMessageId: "a" }, { type: "broken", clientMessageId: "a" });
    expect(lastTurn(s).phase).toBe("done");
  });

  it("marks a broken stream failed", () => {
    expect(lastTurn(play(send(), { type: "broken", clientMessageId: "a" }))).toMatchObject({ phase: "failed", failureCode: "STREAM_ENDED" });
    expect(lastTurn(play(send(), { type: "broken", clientMessageId: "a", code: "NETWORK_ERROR" })).failureCode).toBe("NETWORK_ERROR");
  });

  it("ignores events that arrive after the turn failed", () => {
    const s = play(send(), { type: "stopped", clientMessageId: "a" }, ev({ type: "delta", text: "late" }), ev(done()));
    expect(lastTurn(s)).toMatchObject({ phase: "failed", raw: "" });
  });

  it("retries in place with the same clientMessageId", () => {
    const s = play(send("a", "Original text", 1_000), ev({ type: "error", code: "AI_FAILED" }), send("a", "ignored", 9_000));
    expect(s.turns).toHaveLength(1);
    expect(lastTurn(s)).toMatchObject({ phase: "submitted", userText: "Original text", failureCode: null, raw: "", startedAt: 9_000 });
  });

  it("ignores events for a turn it does not know", () => {
    const before = play(send());
    expect(aiChatReducer(before, ev({ type: "delta", text: "x" }, "zzz"))).toBe(before);
  });
});

describe("aiChatReducer: refusals before the stream", () => {
  it("drops the turn and shows a notice for AI_CHAT_BUSY", () => {
    const s = play(send(), { type: "refused", clientMessageId: "a", code: "AI_CHAT_BUSY", retryAfter: 4 });
    expect(s.turns).toEqual([]);
    expect(s.notice).toEqual({ code: "AI_CHAT_BUSY", retryAfter: 4 });
    expect(s.closed).toBe(false);
  });

  it.each(["CONVERSATION_CLOSED", "AI_CHAT_OFF_TOPIC_LIMIT"])("closes the chat for %s", (code) => {
    const s = play(send(), { type: "refused", clientMessageId: "a", code });
    expect(s.closed).toBe(true);
    expect(composerState(s)).toBe("closed");
  });

  it("clears the notice when the user sends again or dismisses it", () => {
    const refused = play(send(), { type: "refused", clientMessageId: "a", code: "MESSAGE_TOO_LONG" });
    expect(aiChatReducer(refused, { type: "dismiss-notice" }).notice).toBeNull();
    expect(aiChatReducer(refused, send("b")).notice).toBeNull();
  });

  it("resets to the initial state", () => {
    expect(play(send(), { type: "reset" })).toBe(initialAiChatState);
  });
});

describe("selectors", () => {
  it("reports busy while the last turn is in flight", () => {
    expect(isBusy(initialAiChatState)).toBe(false);
    const s = play(send());
    expect(isBusy(s)).toBe(true);
    expect(composerState(s)).toBe("busy");
    expect(isBusy(aiChatReducer(s, ev(done())))).toBe(false);
  });
});
