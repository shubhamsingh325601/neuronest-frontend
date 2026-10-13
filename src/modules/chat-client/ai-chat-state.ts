// Pure reducer for the AI chat transcript. The UI dispatches into it from `sendAiMessage`'s events; nothing here
// touches the network, the DOM or timers, so every transition is unit-tested.
//
// Phases of one turn:  submitted -> thinking -> writing -> done
//                                                      \-> retracted   (the reply failed a safety check)
//                      any of the above -> failed(code)                (error event, abort, broken stream)
// The conversation itself can also become `closed`.
//
// `submitted` and `thinking` are told apart only by `status` events, which the backend does not send yet, so
// today a turn sits in `submitted` until the first delta. The UI words both the same way and must not claim to
// know what the model is doing.

import { ChatErrorCode } from "./problem";
import type { AiStreamEvent, Message } from "./types";

export type TurnPhase = "submitted" | "thinking" | "writing" | "done" | "retracted" | "failed";

/** The fixed trailing line the backend appends to a normal reply. Matched by prefix until it is its own event. */
export const FOOTER_PREFIX = "This is AI guidance";

/** Failure code for a turn the user stopped; the partial text was not stored by the server. */
export const STOPPED_CODE = "STOPPED";

export interface AiTurn {
  clientMessageId: string;
  userText: string;
  /** Epoch ms when this attempt was sent (reset by a retry); the UI measures the wait from it. */
  startedAt: number;
  phase: TurnPhase;
  /** The last `status` event phase (`thinking`, `checking`, `writing`); null until the backend sends one. */
  statusPhase: string | null;
  /** Everything received so far (deltas concatenated), before the footer is split off. */
  raw: string;
  /** The reply without the footer. After a retract this is the safe replacement text. */
  reply: string;
  footer: string | null;
  failureCode: string | null;
  doneState: Message["state"] | null;
  messageId: string | null;
}

/** A refusal before the stream started (JSON problem): shown inline, the user's message is not kept as a turn. */
export interface Notice {
  code: string;
  /** Seconds from `Retry-After`, when the server gave one. */
  retryAfter?: number;
}

export interface AiChatState {
  turns: AiTurn[];
  /** The chat can take no more messages (closed, off-topic limit, or `done.conversationClosed`). */
  closed: boolean;
  notice: Notice | null;
}

export type AiChatAction =
  | { type: "send"; clientMessageId: string; text: string; at: number }
  | { type: "event"; clientMessageId: string; event: AiStreamEvent }
  | { type: "refused"; clientMessageId: string; code: string; retryAfter?: number }
  | { type: "stopped"; clientMessageId: string }
  | { type: "broken"; clientMessageId: string; code?: string }
  | { type: "dismiss-notice" }
  | { type: "reset" };

export const initialAiChatState: AiChatState = { turns: [], closed: false, notice: null };

/** Splits the accumulated reply into the answer and the trailing disclaimer. */
export function splitFooter(raw: string): { reply: string; footer: string | null } {
  const at = raw.indexOf(FOOTER_PREFIX);
  if (at === -1) return { reply: raw, footer: null };
  return { reply: raw.slice(0, at).trimEnd(), footer: raw.slice(at).trim() };
}

/** Codes that mean the chat cannot continue, whether they arrive as a problem or as an `error` event. */
const CLOSING_CODES: ReadonlySet<string> = new Set([ChatErrorCode.ConversationClosed, ChatErrorCode.OffTopicLimit]);

function freshTurn(clientMessageId: string, userText: string, startedAt: number): AiTurn {
  return {
    clientMessageId,
    userText,
    startedAt,
    phase: "submitted",
    statusPhase: null,
    raw: "",
    reply: "",
    footer: null,
    failureCode: null,
    doneState: null,
    messageId: null,
  };
}

function patchTurn(state: AiChatState, clientMessageId: string, patch: (turn: AiTurn) => AiTurn): AiChatState {
  let changed = false;
  const turns = state.turns.map((turn) => {
    if (turn.clientMessageId !== clientMessageId) return turn;
    changed = true;
    return patch(turn);
  });
  return changed ? { ...state, turns } : state;
}

function applyEvent(turn: AiTurn, event: AiStreamEvent): AiTurn {
  // `done` follows a `retract`: the turn stays retracted but learns its stored message id and state.
  if (turn.phase === "retracted" && event.type === "done") {
    return { ...turn, doneState: event.state, messageId: event.messageId };
  }
  // Late events for a turn that already ended (a chunk delivered after Stop) are ignored.
  if (turn.phase === "failed" || turn.phase === "done" || turn.phase === "retracted") return turn;
  switch (event.type) {
    case "status":
      // A status never moves a turn backwards: once writing, a late `thinking` is ignored.
      if (turn.phase === "writing") return turn;
      return { ...turn, statusPhase: event.phase, phase: event.phase === "writing" ? "writing" : "thinking" };
    case "delta": {
      const raw = turn.raw + event.text;
      return { ...turn, phase: "writing", raw, ...splitFooter(raw) };
    }
    case "footer":
      return { ...turn, footer: event.text.trim() };
    case "retract":
      // Replace everything shown with the safe text; the `done` event follows.
      return { ...turn, phase: "retracted", raw: event.text, reply: event.text, footer: null };
    case "done":
      return {
        ...turn,
        phase: "done",
        doneState: event.state,
        messageId: event.messageId,
      };
    case "error":
      return { ...turn, phase: "failed", failureCode: event.code };
  }
}

export function aiChatReducer(state: AiChatState, action: AiChatAction): AiChatState {
  switch (action.type) {
    case "send": {
      const existing = state.turns.some((t) => t.clientMessageId === action.clientMessageId);
      // The same id is a retry of that message: reset the turn in place instead of adding a second bubble.
      const turns = existing
        ? state.turns.map((t) => (t.clientMessageId === action.clientMessageId ? freshTurn(t.clientMessageId, t.userText, action.at) : t))
        : [...state.turns, freshTurn(action.clientMessageId, action.text, action.at)];
      return { ...state, turns, notice: null };
    }
    case "event": {
      let next = patchTurn(state, action.clientMessageId, (turn) => applyEvent(turn, action.event));
      if (action.event.type === "done" && action.event.conversationClosed) next = { ...next, closed: true };
      if (action.event.type === "error" && CLOSING_CODES.has(action.event.code)) next = { ...next, closed: true };
      return next;
    }
    case "refused": {
      const turns = state.turns.filter((t) => t.clientMessageId !== action.clientMessageId);
      return {
        ...state,
        turns,
        closed: state.closed || CLOSING_CODES.has(action.code),
        notice: { code: action.code, retryAfter: action.retryAfter },
      };
    }
    case "stopped":
      return patchTurn(state, action.clientMessageId, (turn) =>
        turn.phase === "done" || turn.phase === "retracted" || turn.phase === "failed"
          ? turn
          : { ...turn, phase: "failed", failureCode: STOPPED_CODE },
      );
    case "broken":
      return patchTurn(state, action.clientMessageId, (turn) =>
        turn.phase === "done" || turn.phase === "retracted" || turn.phase === "failed"
          ? turn
          : { ...turn, phase: "failed", failureCode: action.code ?? ChatErrorCode.StreamEnded },
      );
    case "dismiss-notice":
      return state.notice ? { ...state, notice: null } : state;
    case "reset":
      return initialAiChatState;
  }
}

// --- selectors ---

export const isTurnActive = (turn: AiTurn) =>
  turn.phase === "submitted" || turn.phase === "thinking" || turn.phase === "writing";

export function isBusy(state: AiChatState): boolean {
  const last = state.turns[state.turns.length - 1];
  return last !== undefined && isTurnActive(last);
}

export type ComposerState = "ready" | "busy" | "closed";

export function composerState(state: AiChatState): ComposerState {
  if (state.closed) return "closed";
  return isBusy(state) ? "busy" : "ready";
}
