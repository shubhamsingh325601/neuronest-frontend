// POST /v1/ai-conversations/:id/messages -> an SSE stream of `status | delta | retract | done | error`.
// Collects the timing/chunk metrics the Diagnostics table shows. Metrics hold numbers, booleans, codes and ids
// only; message text, tokens and headers never enter them.

import type { ChatTransport } from "./client";
import { ChatApiError, ChatErrorCode, isAbortError, networkError, parseProblem } from "./problem";
import { parseSse } from "./sse-reader";
import {
  deltaDataSchema,
  doneDataSchema,
  errorDataSchema,
  statusDataSchema,
  type AiStreamEvent,
} from "./types";

/** 3 or more events in one network chunk means something between server and client is buffering. */
export const BUFFERED_EVENTS_THRESHOLD = 3;
/** The server sends a heartbeat every 15 s; a longer silence (plus tolerance) means the stream was dropped. */
export const STREAM_DROPPED_GAP_MS = 15_000 + 2_000;

export interface StreamMetrics {
  /** HTTP status of the POST; 0 when it never reached the server. */
  httpStatus: number;
  requestId: string | null;
  /** ms from fetch start to the response headers. */
  ttfbMs: number | null;
  /** ms to the first `delta` event. */
  firstDeltaMs: number | null;
  /** ms to `done` / `error`, or to the end of the stream. */
  totalMs: number | null;
  deltas: number;
  chunks: number;
  maxEventsPerChunk: number;
  /** Longest silence between network chunks (heartbeats count as chunks). */
  maxGapMs: number;
  heartbeats: number;
  bufferedEvents: boolean;
  streamDropped: boolean;
  doneState: string | null;
  conversationClosed: boolean | null;
  /** The `error` event's code, or the problem code of a refused POST. */
  errorCode: string | null;
}

export type AiStreamOutcome = "done" | "failed" | "aborted";

export interface AiStreamResult {
  outcome: AiStreamOutcome;
  metrics: StreamMetrics;
  /** Set when the POST was refused before the stream (problem+json) or the connection failed. */
  error: ChatApiError | null;
}

export interface SendAiMessageOptions {
  signal?: AbortSignal;
  onEvent: (event: AiStreamEvent) => void;
  /** Cancel the request right after the first `delta` (tests that a client abort stops the server). */
  abortAfterFirstDelta?: boolean;
  /** Injectable clock for tests; defaults to `performance.now()`. */
  now?: () => number;
}

function emptyMetrics(): StreamMetrics {
  return {
    httpStatus: 0,
    requestId: null,
    ttfbMs: null,
    firstDeltaMs: null,
    totalMs: null,
    deltas: 0,
    chunks: 0,
    maxEventsPerChunk: 0,
    maxGapMs: 0,
    heartbeats: 0,
    bufferedEvents: false,
    streamDropped: false,
    doneState: null,
    conversationClosed: null,
    errorCode: null,
  };
}

function parseEvent(name: string, data: string): AiStreamEvent | null {
  let json: unknown;
  try {
    json = JSON.parse(data);
  } catch {
    return null;
  }
  switch (name) {
    case "status": {
      const r = statusDataSchema.safeParse(json);
      return r.success ? { type: "status", phase: r.data.phase } : null;
    }
    case "delta": {
      const r = deltaDataSchema.safeParse(json);
      return r.success ? { type: "delta", text: r.data.text } : null;
    }
    case "retract": {
      const r = deltaDataSchema.safeParse(json);
      return r.success ? { type: "retract", text: r.data.text } : null;
    }
    case "footer": {
      const r = deltaDataSchema.safeParse(json);
      return r.success ? { type: "footer", text: r.data.text } : null;
    }
    case "done": {
      const r = doneDataSchema.safeParse(json);
      return r.success ? { type: "done", ...pickDone(r.data) } : null;
    }
    case "error": {
      const r = errorDataSchema.safeParse(json);
      return r.success ? { type: "error", code: r.data.code } : null;
    }
    default:
      return null; // an event name from a newer backend: ignored for forward compatibility
  }
}

function pickDone(d: { messageId: string; seq: number; state: "COMPLETE" | "RETRACTED" | "REDIRECTED"; conversationClosed: boolean }) {
  return { messageId: d.messageId, seq: d.seq, state: d.state, conversationClosed: d.conversationClosed };
}

/**
 * Sends one parent message and streams the AI reply. Resolves when the stream is over (never rejects for a
 * network, HTTP or abort condition); the events are delivered through `onEvent` as they arrive.
 */
export async function sendAiMessage(
  transport: ChatTransport,
  conversationId: string,
  body: { text: string; clientMessageId: string },
  options: SendAiMessageOptions,
): Promise<AiStreamResult> {
  const now = options.now ?? (() => performance.now());
  const metrics = emptyMetrics();
  const controller = new AbortController();
  const forward = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  else options.signal?.addEventListener("abort", forward, { once: true });

  const startedAt = now();
  const finish = (outcome: AiStreamOutcome, error: ChatApiError | null = null): AiStreamResult => {
    options.signal?.removeEventListener("abort", forward);
    metrics.totalMs ??= Math.round(now() - startedAt);
    metrics.bufferedEvents = metrics.maxEventsPerChunk >= BUFFERED_EVENTS_THRESHOLD;
    metrics.streamDropped = metrics.maxGapMs > STREAM_DROPPED_GAP_MS;
    return { outcome, metrics, error };
  };

  let response: Response;
  try {
    response = await transport.fetch(transport.url(`ai-conversations/${encodeURIComponent(conversationId)}/messages`), {
      method: "POST",
      headers: transport.headers({ Accept: "text/event-stream", "Content-Type": "application/json" }),
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (isAbortError(error)) return finish("aborted");
    return finish("failed", networkError());
  }

  metrics.httpStatus = response.status;
  metrics.requestId = response.headers.get("x-request-id");
  metrics.ttfbMs = Math.round(now() - startedAt);

  if (!response.ok) {
    const problem = await parseProblem(response);
    metrics.requestId = problem.requestId ?? metrics.requestId;
    metrics.errorCode = problem.code;
    return finish("failed", problem);
  }
  if (!response.body) return finish("failed", new ChatApiError({ status: response.status, code: ChatErrorCode.StreamEnded }));

  let lastChunkAt = now();
  let eventsInChunk = 0;
  const closeChunk = () => {
    metrics.maxEventsPerChunk = Math.max(metrics.maxEventsPerChunk, eventsInChunk);
    eventsInChunk = 0;
  };

  let outcome: AiStreamOutcome | null = null;
  try {
    for await (const block of parseSse(response.body, {
      onChunk: () => {
        const at = now();
        closeChunk();
        metrics.chunks += 1;
        metrics.maxGapMs = Math.max(metrics.maxGapMs, Math.round(at - lastChunkAt));
        lastChunkAt = at;
      },
    })) {
      if (block.type === "comment") {
        metrics.heartbeats += 1;
        continue;
      }
      const event = parseEvent(block.event, block.data);
      if (!event) continue;
      eventsInChunk += 1;
      if (event.type === "delta") {
        metrics.deltas += 1;
        metrics.firstDeltaMs ??= Math.round(now() - startedAt);
      }
      options.onEvent(event);
      if (event.type === "delta" && options.abortAfterFirstDelta) {
        controller.abort();
        outcome = "aborted";
        break;
      }
      if (event.type === "done") {
        metrics.doneState = event.state;
        metrics.conversationClosed = event.conversationClosed;
        metrics.totalMs = Math.round(now() - startedAt);
        outcome = "done";
        break;
      }
      if (event.type === "error") {
        metrics.errorCode = event.code;
        metrics.totalMs = Math.round(now() - startedAt);
        outcome = "failed";
        break;
      }
    }
  } catch (error) {
    closeChunk();
    if (isAbortError(error) || controller.signal.aborted) return finish("aborted");
    return finish("failed", networkError());
  }
  closeChunk();
  // The stream closed with neither `done` nor `error`: the reply is incomplete, and the caller must say so.
  if (outcome === null) {
    return finish("failed", new ChatApiError({ status: response.status, code: ChatErrorCode.StreamEnded, title: "Stream ended early" }));
  }
  return finish(outcome);
}
