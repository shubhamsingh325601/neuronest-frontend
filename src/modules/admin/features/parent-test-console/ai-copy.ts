import { ChatErrorCode } from "@/modules/chat-client/problem";
import { STOPPED_CODE } from "@/modules/chat-client/ai-chat-state";

// What a parent reads while the AI works, and when it cannot answer. Every line is honest about what is known:
// no claim about what the model is doing beyond the neutral phases the backend may report.

export const LABEL_THINKING = "Thinking…";
export const LABEL_STILL_WORKING = "Still working on it…";
export const LABEL_TAKING_LONGER = "Taking longer than usual";

/** After this long without the first words, the wait gets a gentler label. */
export const STILL_WORKING_AFTER_MS = 6_000;
/** After this long, say it is slow and offer Stop inline. */
export const TAKING_LONGER_AFTER_MS = 15_000;

const STATUS_LABELS: Record<string, string> = {
  reading: "Reading your question",
  thinking: "Thinking",
  checking: "Checking the answer",
  writing: "Writing",
};

/**
 * The shimmering label while no text has appeared yet. With `status` events from the backend it names the
 * neutral phase; without them it is derived from the elapsed time only.
 */
export function thinkingLabel(statusPhase: string | null, elapsedMs: number): string {
  if (statusPhase) return `${STATUS_LABELS[statusPhase] ?? "Thinking"}…`;
  if (elapsedMs >= TAKING_LONGER_AFTER_MS) return LABEL_TAKING_LONGER;
  if (elapsedMs >= STILL_WORKING_AFTER_MS) return LABEL_STILL_WORKING;
  return LABEL_THINKING;
}

/** Stop is offered inline once the wait is clearly long. */
export const offersInlineStop = (elapsedMs: number) => elapsedMs >= TAKING_LONGER_AFTER_MS;

/** A reply that failed after it started. The partial text was not stored. */
const FAILURE_COPY: Record<string, string> = {
  AI_RATE_LIMITED: "The assistant is very busy right now. Please try again in a moment.",
  AI_BUDGET: "The assistant has reached its usage limit for now.",
  AI_TIMEOUT: "That took too long to answer.",
  AI_PROVIDER: "The AI service had a problem while answering.",
  AI_FAILED: "Something went wrong while writing the answer.",
  AI_INVALID_OUTPUT: "The answer did not pass the safety checks, so it was not shown.",
  AI_BLOCKED: "This one can't be answered here.",
  [ChatErrorCode.ConversationClosed]: "This chat was closed while the answer was being written.",
  [STOPPED_CODE]: "Stopped. Nothing from that answer was saved.",
  [ChatErrorCode.Network]: "The connection dropped before the answer finished.",
  [ChatErrorCode.StreamEnded]: "The answer was cut off before it finished.",
};

/** Codes where trying the same message again is pointless. */
const NO_RETRY = new Set<string>(["AI_BLOCKED", ChatErrorCode.ConversationClosed]);

export function describeAiFailure(code: string | null): { text: string; canRetry: boolean } {
  const key = code ?? "AI_FAILED";
  return { text: FAILURE_COPY[key] ?? FAILURE_COPY.AI_FAILED, canRetry: !NO_RETRY.has(key) };
}

export type NoticeTone = "quiet" | "warning" | "error";

/** A refusal before the stream started. The message was not stored, so the draft is put back in the box. */
const NOTICE_COPY: Record<string, { text: string; tone: NoticeTone }> = {
  [ChatErrorCode.ChatBusy]: { text: "A reply is already being written for this chat. Wait for it to finish, then send again.", tone: "quiet" },
  [ChatErrorCode.ChatLimitReached]: { text: "The message limit for this chat or for today has been reached.", tone: "warning" },
  [ChatErrorCode.MessageTooLong]: { text: "That message is too long. Shorten it and send again.", tone: "warning" },
  [ChatErrorCode.AiDisabled]: { text: "AI chat is switched off on the server (AI_ENABLED).", tone: "error" },
  [ChatErrorCode.AiUnavailable]: { text: "The AI service is unavailable right now. Try again shortly.", tone: "error" },
  [ChatErrorCode.ClientMessageIdInUse]: { text: "That message id was already used for a different message.", tone: "error" },
  [ChatErrorCode.ReplyUnavailable]: { text: "The earlier reply for this message can't be replayed.", tone: "warning" },
  [ChatErrorCode.NotAnAiConversation]: { text: "This is not an AI chat.", tone: "error" },
  [ChatErrorCode.ValidationError]: { text: "The server did not accept that message.", tone: "warning" },
  [ChatErrorCode.ConversationClosed]: { text: "This chat is closed. Pick a topic to start a new one.", tone: "quiet" },
  [ChatErrorCode.OffTopicLimit]: { text: "This chat was closed after three off-topic messages. Pick a topic to start a new one.", tone: "quiet" },
  [ChatErrorCode.Network]: { text: "Couldn't reach the server. Check the connection and send again.", tone: "error" },
  [ChatErrorCode.RateLimited]: { text: "Too many requests. Wait a moment and send again.", tone: "warning" },
};

export function describeAiNotice(code: string, retryAfter?: number): { text: string; tone: NoticeTone } {
  const base = NOTICE_COPY[code] ?? { text: `The server answered ${code}.`, tone: "error" as const };
  if (retryAfter === undefined) return base;
  return { ...base, text: `${base.text} (Try again in ${retryAfter} second${retryAfter === 1 ? "" : "s"}.)` };
}

/** The chat is over; the composer is replaced by "Pick a topic". */
export const CLOSED_PROMPT = "This chat has ended. Pick a topic to start a new one.";

/** The calm look for a REDIRECTED reply ("I can only help with ...") and the line shown with a retracted one. */
export const REDIRECTED_LABEL = "Staying on topic";
export const RETRACTED_LABEL = "This answer was replaced for safety.";
export const FOOTER_LABEL = "AI guidance, not a diagnosis";

export const GREETING_TITLE = "How can I help today?";
export const GREETING_BODY = "Pick a topic to start. I can talk about your child's plan, progress and everyday routines.";
