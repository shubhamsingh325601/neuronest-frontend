// Live parent <-> expert chat: GET /v1/conversations/:id/events (SSE) plus the cursor read as the fallback.
// Postgres is the source of truth; the stream is an accelerator. The algorithm is the backend handoff's §4:
//   1 load history  2 open the stream with Last-Event-ID  3 drop anything already seen  4 reconnect with backoff
//   5 stop on closed/purged  6 a reconnect replays whatever was missed.
// Fetch and timers are injected so the whole thing is testable without a network or real time.

import { newClientMessageId, type ChatClient } from "./client";
import { ChatApiError, ChatErrorCode, isAbortError, isChatApiError, networkError, parseProblem } from "./problem";
import { parseSse } from "./sse-reader";
import { conversationSchema, messageSchema, resyncDataSchema, type Message } from "./types";

const PAGE_LIMIT = 100;
const BACKOFF_BASE_MS = 1_000;
const BACKOFF_MAX_MS = 30_000;
/** Upper bound of the random extra added to every wait: 25% of it. */
const JITTER_RATIO = 0.25;
/** `429 TOO_MANY_STREAMS` is not a blip; wait at least this long (or Retry-After, if larger). */
const TOO_MANY_STREAMS_MIN_MS = 15_000;
const LOG_LIMIT = 200;

export type Connection = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected" | "ended";

/** Why the stream will not come back by itself. */
export type EndedReason = "closed" | "purged" | "unauthorized" | "forbidden" | "not-found" | "invalid";

export interface LogEntry {
  /** Event name only; never message text. */
  name: string;
  at: number;
}

export interface PendingMessage {
  clientMessageId: string;
  text: string;
  status: "sending" | "failed";
  /** Problem code of the failure, or `NETWORK_ERROR`. */
  errorCode: string | null;
}

export interface ConversationStreamState {
  connection: Connection;
  endedReason: EndedReason | null;
  /** Messages in `seq` order, without duplicates. */
  messages: Message[];
  pending: PendingMessage[];
  /** Highest `seq` such that every message up to it is held. Sent as `Last-Event-ID` on reconnect. */
  lastSeq: number;
  heartbeats: number;
  log: LogEntry[];
  /** Last connection problem: status (0 = network), code and requestId. No text. */
  lastError: { status: number; code: string; requestId: string | null } | null;
  /** Reconnect attempts since the last healthy connection. */
  attempt: number;
  /** ms until the next reconnect attempt while `reconnecting`. */
  retryInMs: number | null;
}

export interface Timers {
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
}

export interface ConversationStreamOptions {
  client: ChatClient;
  conversationId: string;
  timers?: Timers;
  /** 0..1; injectable for tests. */
  random?: () => number;
  /** Wall-clock ms for the event log. */
  now?: () => number;
  newId?: () => string;
}

const defaultTimers: Timers = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/** Backoff 1, 2, 4 ... capped at 30 s, plus up to 25% jitter. `attempt` counts from 0. */
export function backoffDelay(attempt: number, random: () => number = Math.random): number {
  const base = Math.min(BACKOFF_BASE_MS * 2 ** attempt, BACKOFF_MAX_MS);
  return Math.round(base + random() * base * JITTER_RATIO);
}

const FATAL: Record<number, EndedReason> = { 401: "unauthorized", 403: "forbidden", 404: "not-found", 422: "invalid" };

export class ConversationStream {
  private readonly client: ChatClient;
  private readonly conversationId: string;
  private readonly timers: Timers;
  private readonly random: () => number;
  private readonly now: () => number;
  private readonly newId: () => string;

  private readonly bySeq = new Map<number, Message>();
  private readonly listeners = new Set<() => void>();
  private readonly extras = new Set<AbortController>();
  private state: ConversationStreamState;

  private run = 0; // bumped by connect/disconnect so a stale loop notices it was superseded
  private controller: AbortController | null = null;
  private wake: (() => void) | null = null;
  private historyLoaded = false;

  constructor(options: ConversationStreamOptions) {
    this.client = options.client;
    this.conversationId = options.conversationId;
    this.timers = options.timers ?? defaultTimers;
    this.random = options.random ?? Math.random;
    this.now = options.now ?? Date.now;
    this.newId = options.newId ?? newClientMessageId;
    this.state = {
      connection: "idle",
      endedReason: null,
      messages: [],
      pending: [],
      lastSeq: 0,
      heartbeats: 0,
      log: [],
      lastError: null,
      attempt: 0,
      retryInMs: null,
    };
  }

  // --- external-store API (works with React's useSyncExternalStore) ---

  getState = (): ConversationStreamState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  // --- lifecycle ---

  /** Starts (or restarts after `disconnect`) the load-then-stream loop. No-op while already running. */
  connect(): void {
    if (this.state.connection === "ended") return;
    if (this.controller || this.state.connection === "connecting" || this.state.connection === "reconnecting") return;
    const run = ++this.run;
    this.set({ connection: "connecting", retryInMs: null });
    void this.loop(run);
  }

  /** Aborts the stream and stays disconnected until `connect()`. */
  disconnect(): void {
    if (this.state.connection === "ended" && !this.controller) return;
    this.run++;
    this.controller?.abort();
    this.controller = null;
    this.wake?.();
    if (this.state.connection !== "ended") this.set({ connection: "disconnected", retryInMs: null });
  }

  /** Disconnects and releases every extra stream. Call on unmount and on Exit. Subscribers unsubscribe themselves. */
  destroy(): void {
    this.disconnect();
    for (const extra of this.extras) extra.abort();
    this.extras.clear();
  }

  /**
   * Opens one more events stream for the same user and reports how the server answered, to show the per-user
   * cap (`429 TOO_MANY_STREAMS`). The stream is left open (it holds a slot) until the returned `close()`.
   */
  async openExtra(): Promise<{ status: number; code: string | null; requestId: string | null; close: () => void }> {
    const controller = new AbortController();
    this.extras.add(controller);
    const close = () => {
      controller.abort();
      this.extras.delete(controller);
    };
    try {
      const response = await this.openEvents(controller.signal, this.state.lastSeq);
      if (!response.ok) {
        const problem = await parseProblem(response);
        close();
        return { status: problem.status, code: problem.code, requestId: problem.requestId, close };
      }
      return { status: response.status, code: null, requestId: response.headers.get("x-request-id"), close };
    } catch {
      close();
      return { status: 0, code: ChatErrorCode.Network, requestId: null, close };
    }
  }

  // --- sending ---

  /** Optimistic send: the message shows as `sending` at once; on 201 it becomes a normal message. */
  async send(text: string, clientMessageId: string = this.newId()): Promise<void> {
    this.setPending(clientMessageId, { clientMessageId, text, status: "sending", errorCode: null });
    try {
      const message = await this.client.sendMessage(this.conversationId, { text, clientMessageId });
      this.applyMessage(message);
    } catch (error) {
      const code = isChatApiError(error) ? error.code : ChatErrorCode.Network;
      this.setPending(clientMessageId, { clientMessageId, text, status: "failed", errorCode: code });
    }
  }

  /** Retries a failed send with the SAME `clientMessageId`, so the server cannot store it twice. */
  retry(clientMessageId: string): Promise<void> {
    const pending = this.state.pending.find((p) => p.clientMessageId === clientMessageId);
    return pending ? this.send(pending.text, clientMessageId) : Promise.resolve();
  }

  // --- the loop ---

  private async loop(run: number): Promise<void> {
    const live = () => run === this.run;
    let attempt = 0;
    while (live()) {
      let waitMs: number;
      try {
        if (!this.historyLoaded) {
          await this.catchUp(run, undefined);
          if (!live()) return;
          if (this.state.endedReason) return; // purged: nothing to stream
          this.historyLoaded = true;
        }
        await this.stream(run, () => {
          attempt = 0;
          this.set({ attempt: 0 });
        });
        if (!live() || this.state.connection === "ended") return;
        waitMs = backoffDelay(attempt++, this.random); // the server closed a healthy stream: come back
      } catch (error) {
        if (!live()) return;
        if (isAbortError(error)) return;
        const problem = isChatApiError(error) ? error : networkError();
        this.set({ lastError: { status: problem.status, code: problem.code, requestId: problem.requestId } });
        const fatal = FATAL[problem.status];
        if (fatal) {
          this.end(fatal);
          return;
        }
        waitMs =
          problem.status === 429
            ? Math.max(problem.retryAfter !== undefined ? problem.retryAfter * 1000 : 0, TOO_MANY_STREAMS_MIN_MS) *
              (1 + this.random() * JITTER_RATIO)
            : backoffDelay(attempt++, this.random);
        waitMs = Math.round(waitMs);
      }
      this.set({ connection: "reconnecting", attempt, retryInMs: waitMs });
      await this.sleep(waitMs);
      if (!live()) return;
      this.set({ retryInMs: null });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const handle = this.timers.setTimeout(() => {
        this.wake = null;
        resolve();
      }, ms);
      this.wake = () => {
        this.timers.clearTimeout(handle);
        this.wake = null;
        resolve();
      };
    });
  }

  /** Pages `GET messages?afterSeq=lastSeq` until a short page, or until `upTo` is held (a `resync`). */
  private async catchUp(run: number, upTo: number | undefined): Promise<void> {
    for (;;) {
      if (run !== this.run) return;
      const page = await this.client.listMessages(
        this.conversationId,
        { afterSeq: this.state.lastSeq, limit: PAGE_LIMIT },
        { signal: this.controller?.signal },
      );
      if (run !== this.run) return;
      if (page.purged) {
        this.end("purged");
        return;
      }
      for (const message of page.items) this.applyMessage(message);
      if (page.items.length < PAGE_LIMIT) return;
      if (upTo !== undefined && this.state.lastSeq >= upTo) return;
    }
  }

  private openEvents(signal: AbortSignal, lastSeq: number): Promise<Response> {
    const { transport } = this.client;
    const headers = transport.headers({ Accept: "text/event-stream" });
    if (lastSeq > 0) headers.set("Last-Event-ID", String(lastSeq));
    return transport
      .fetch(transport.url(`conversations/${encodeURIComponent(this.conversationId)}/events`), { method: "GET", headers, signal })
      .catch((error: unknown) => {
        throw isAbortError(error) ? error : networkError();
      });
  }

  /** Runs one connection to its end. Throws on a refused or broken connection; returns when the server closes it. */
  private async stream(run: number, onHealthy: () => void): Promise<void> {
    const controller = new AbortController();
    this.controller = controller;
    try {
      const response = await this.openEvents(controller.signal, this.state.lastSeq);
      if (run !== this.run) return;
      if (!response.ok) throw await parseProblem(response);
      if (!response.body) throw new ChatApiError({ status: response.status, code: ChatErrorCode.StreamEnded });
      this.set({ connection: "connected", lastError: null });

      let healthy = false;
      for await (const block of parseSse(response.body)) {
        if (run !== this.run) return;
        if (!healthy) {
          healthy = true;
          onHealthy(); // the first block (event or heartbeat) proves the connection works: restart the backoff
        }
        if (block.type === "comment") {
          this.set({ heartbeats: this.state.heartbeats + 1 });
          this.record("heartbeat");
          continue;
        }
        this.record(block.event);
        await this.handle(run, block.event, block.data);
        if (this.state.connection === "ended") return;
      }
    } catch (error) {
      if (run !== this.run && isAbortError(error)) return;
      throw error;
    } finally {
      if (this.controller === controller) this.controller = null;
      controller.abort(); // frees the slot (the backend allows 5 streams per user) even on an early return
    }
  }

  private async handle(run: number, name: string, data: string): Promise<void> {
    let json: unknown;
    try {
      json = JSON.parse(data);
    } catch {
      return;
    }
    switch (name) {
      case "message": {
        const message = messageSchema.safeParse(json);
        if (message.success) this.applyMessage(message.data);
        return;
      }
      case "resync": {
        const resync = resyncDataSchema.safeParse(json);
        if (resync.success) await this.catchUp(run, resync.data.lastSeq);
        return;
      }
      case "closed":
      case "purged": {
        if (conversationSchema.safeParse(json).success) this.end(name);
        return;
      }
      default:
        return; // forward compatibility
    }
  }

  // --- state ---

  /** Adds a message once. The POST result and the stream echo of our own message both arrive here. */
  private applyMessage(message: Message): void {
    const known = this.bySeq.has(message.seq);
    if (!known) this.bySeq.set(message.seq, message);
    let lastSeq = this.state.lastSeq;
    // Only a gapless run advances lastSeq: a POST result that is ahead of the stream must not make us skip the
    // messages in between when they arrive.
    while (this.bySeq.has(lastSeq + 1)) lastSeq++;
    const pending = message.clientMessageId
      ? this.state.pending.filter((p) => p.clientMessageId !== message.clientMessageId)
      : this.state.pending;
    if (known && pending.length === this.state.pending.length) return; // a duplicate (the echo of our own send)
    this.set({
      messages: known ? this.state.messages : [...this.bySeq.values()].sort((a, b) => a.seq - b.seq),
      pending,
      lastSeq,
    });
  }

  private setPending(clientMessageId: string, entry: PendingMessage): void {
    const exists = this.state.pending.some((p) => p.clientMessageId === clientMessageId);
    this.set({
      pending: exists
        ? this.state.pending.map((p) => (p.clientMessageId === clientMessageId ? entry : p))
        : [...this.state.pending, entry],
    });
  }

  private end(reason: EndedReason): void {
    this.run++;
    this.controller?.abort();
    this.controller = null;
    this.wake?.();
    this.set({ connection: "ended", endedReason: reason, retryInMs: null });
  }

  private record(name: string): void {
    const log = [...this.state.log, { name, at: this.now() }];
    this.set({ log: log.length > LOG_LIMIT ? log.slice(-LOG_LIMIT) : log });
  }

  private set(patch: Partial<ConversationStreamState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }
}
