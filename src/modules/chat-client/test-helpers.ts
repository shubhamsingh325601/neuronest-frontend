// Shared fakes for the chat-client tests: a routed fetch, SSE bodies (scripted or live), manual timers.
// Imported by *.test.ts only.

import { createChatClient } from "./client";
import type { Message } from "./types";

const enc = new TextEncoder();

export const BASE = "https://api.test";

export interface RecordedRequest {
  url: URL;
  method: string;
  headers: Headers;
  body: string | null;
  signal: AbortSignal | null;
}

export type Handler = (req: RecordedRequest) => Response | Promise<Response>;

/** A fetch that records every request and answers through `handler`. */
export function routedFetch(handler: Handler) {
  const calls: RecordedRequest[] = [];
  const fake = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const req: RecordedRequest = {
      url: new URL(String(input)),
      method: init?.method ?? "GET",
      headers: new Headers(init?.headers),
      body: typeof init?.body === "string" ? init.body : null,
      signal: init?.signal ?? null,
    };
    calls.push(req);
    return handler(req);
  };
  return Object.assign(fake as typeof fetch, { calls });
}

export function clientFor(fetchFn: typeof fetch, token: string | null = "tok") {
  return createChatClient({ baseUrl: BASE, getToken: () => token, fetch: fetchFn });
}

export function sse(event: string, data: unknown, id?: string | number): string {
  return `${id !== undefined ? `id: ${id}\n` : ""}event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export const HEARTBEAT = ": hb\n\n";

export function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

export function problem(
  status: number,
  code: string,
  extra: { requestId?: string; retryAfter?: number; headers?: Record<string, string> } = {},
): Response {
  const headers: Record<string, string> = { "content-type": "application/problem+json", ...extra.headers };
  if (extra.retryAfter !== undefined) headers["retry-after"] = String(extra.retryAfter);
  return new Response(
    JSON.stringify({ type: "about:blank", title: code, status, detail: `${code} happened`, code, requestId: extra.requestId }),
    { status, headers },
  );
}

export function sseHeaders(extra: Record<string, string> = {}) {
  return { "content-type": "text/event-stream", ...extra };
}

/** Chunks delivered one per read, each stamped on `clock` at the moment it is pulled. */
export function scriptedSse(clock: { t: number }, steps: { at: number; data: string }[], headers: Record<string, string> = {}): Response {
  let i = 0;
  const body = new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        const step = steps[i++];
        if (!step) return controller.close();
        clock.t = step.at;
        controller.enqueue(enc.encode(step.data));
      },
    },
    { highWaterMark: 0 },
  );
  return new Response(body, { status: 200, headers: sseHeaders(headers) });
}

/** A connection the test keeps open and feeds by hand. Errors with an AbortError when the request is aborted. */
export class LiveStream {
  readonly response: Response;
  private controller!: ReadableStreamDefaultController<Uint8Array>;
  closed = false;

  constructor(signal: AbortSignal | null, headers: Record<string, string> = {}) {
    const body = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.controller = controller;
        signal?.addEventListener("abort", () => {
          if (this.closed) return;
          this.closed = true;
          controller.error(new DOMException("aborted", "AbortError"));
        });
      },
    });
    this.response = new Response(body, { status: 200, headers: sseHeaders(headers) });
  }

  push(text: string) {
    if (!this.closed) this.controller.enqueue(enc.encode(text));
  }

  end() {
    if (this.closed) return;
    this.closed = true;
    this.controller.close();
  }
}

/** Lets pending promise callbacks and stream reads run. */
export async function settle(rounds = 5): Promise<void> {
  for (let i = 0; i < rounds; i++) await new Promise<void>((resolve) => setImmediate(resolve));
}

/** Timers that never fire by themselves: the test fires them, and can read every delay that was requested. */
export function manualTimers() {
  let next = 0;
  const pending = new Map<number, () => void>();
  const delays: number[] = [];
  return {
    timers: {
      setTimeout: (fn: () => void, ms: number) => {
        next += 1;
        pending.set(next, fn);
        delays.push(ms);
        return next;
      },
      clearTimeout: (handle: unknown) => {
        pending.delete(handle as number);
      },
    },
    delays,
    get pending() {
      return pending.size;
    },
    async fireNext() {
      const [id, fn] = [...pending.entries()][0] ?? [];
      if (id === undefined || !fn) throw new Error("no timer is pending");
      pending.delete(id);
      fn();
      await settle();
    },
  };
}

export function message(seq: number, overrides: Partial<Message> = {}): Message {
  return {
    id: `m${seq}`,
    seq,
    sender: seq % 2 ? "PARENT" : "EXPERT",
    state: "COMPLETE",
    body: `body ${seq}`,
    clientMessageId: null,
    createdAt: "2026-10-13T10:00:00.000Z",
    ...overrides,
  };
}

export function conversation(status: "OPEN" | "CLOSED" = "CLOSED") {
  return {
    id: "c1",
    kind: "HUMAN",
    topic: null,
    childId: "ch1",
    status,
    lastMessageAt: null,
    closedAt: null,
    messagesPurgedAt: null,
    createdAt: "2026-10-13T10:00:00.000Z",
  };
}
