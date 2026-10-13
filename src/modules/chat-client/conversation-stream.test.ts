import { describe, expect, it } from "vitest";
import { backoffDelay, ConversationStream, type ConversationStreamOptions } from "./conversation-stream";
import type { Message } from "./types";
import {
  clientFor,
  conversation,
  HEARTBEAT,
  jsonResponse,
  LiveStream,
  manualTimers,
  message,
  problem,
  routedFetch,
  settle,
  sse,
  type RecordedRequest,
} from "./test-helpers";

interface World {
  /** Server-side messages, in seq order. */
  store: Message[];
  purged: boolean;
  /** Answers each events request (called with the 0-based connection number). */
  events: (n: number, req: RecordedRequest) => Response | Promise<Response>;
  post?: (req: RecordedRequest) => Response | Promise<Response>;
}

function setup(world: Partial<World> = {}, options: Partial<ConversationStreamOptions> = {}) {
  const w: World = { store: [], purged: false, events: () => problem(500, "INTERNAL_ERROR"), ...world };
  let connections = 0;
  const fetchFn = routedFetch((req) => {
    const path = req.url.pathname;
    if (path.endsWith("/events")) return w.events(connections++, req);
    if (path.endsWith("/messages") && req.method === "GET") {
      const after = Number(req.url.searchParams.get("afterSeq") ?? 0);
      const limit = Number(req.url.searchParams.get("limit") ?? 50);
      return jsonResponse({ purged: w.purged, items: w.purged ? [] : w.store.filter((m) => m.seq > after).slice(0, limit) });
    }
    if (path.endsWith("/messages") && req.method === "POST") return w.post ? w.post(req) : problem(500, "X");
    return problem(404, "NOT_FOUND");
  });
  const t = manualTimers();
  const stream = new ConversationStream({
    client: clientFor(fetchFn),
    conversationId: "c1",
    timers: t.timers,
    random: () => 0,
    now: () => 1_000,
    newId: () => "generated-id",
    ...options,
  });
  const eventCalls = () => fetchFn.calls.filter((c) => c.url.pathname.endsWith("/events"));
  const historyCalls = () => fetchFn.calls.filter((c) => c.method === "GET" && c.url.pathname.endsWith("/messages"));
  return { stream, fetchFn, t, w, eventCalls, historyCalls };
}

const seqs = (s: ConversationStream) => s.getState().messages.map((m) => m.seq);

describe("backoffDelay", () => {
  it("doubles from 1 s up to 30 s", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 10].map((a) => backoffDelay(a, () => 0))).toEqual([1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000]);
  });

  it("adds up to 25% jitter, never subtracts", () => {
    expect(backoffDelay(0, () => 0.999)).toBeLessThanOrEqual(1250);
    expect(backoffDelay(0, () => 0.999)).toBeGreaterThan(1200);
    expect(backoffDelay(5, () => 0.999)).toBeLessThanOrEqual(37_500);
    expect(backoffDelay(2, () => 0)).toBe(4000);
  });
});

describe("ConversationStream: history and live", () => {
  it("pages the history, then opens the stream with Last-Event-ID", async () => {
    const live = new Map<number, LiveStream>();
    const { stream, historyCalls, eventCalls } = setup({
      store: Array.from({ length: 250 }, (_, i) => message(i + 1)),
      events: (n, req) => (live.set(n, new LiveStream(req.signal)), live.get(n)!.response),
    });
    stream.connect();
    await settle();
    expect(historyCalls().map((c) => c.url.searchParams.get("afterSeq"))).toEqual(["0", "100", "200"]);
    expect(historyCalls().every((c) => c.url.searchParams.get("limit") === "100")).toBe(true);
    expect(stream.getState().lastSeq).toBe(250);
    expect(eventCalls()[0].headers.get("last-event-id")).toBe("250");
    expect(eventCalls()[0].headers.get("authorization")).toBe("Bearer tok");
    expect(stream.getState().connection).toBe("connected");
  });

  it("sends no Last-Event-ID for an empty history", async () => {
    const { stream, eventCalls } = setup({ events: (_, req) => new LiveStream(req.signal).response });
    stream.connect();
    await settle();
    expect(eventCalls()[0].headers.has("last-event-id")).toBe(false);
  });

  it("appends live messages and drops ones it already has", async () => {
    let live!: LiveStream;
    const { stream } = setup({
      store: [message(1), message(2)],
      events: (_, req) => ((live = new LiveStream(req.signal)), live.response),
    });
    stream.connect();
    await settle();
    live.push(sse("message", message(2), 2)); // already held
    live.push(sse("message", message(3), 3));
    live.push(sse("message", message(3), 3)); // replayed duplicate
    await settle();
    expect(seqs(stream)).toEqual([1, 2, 3]);
    expect(stream.getState().lastSeq).toBe(3);
  });

  it("counts heartbeats and logs event names and times, never text", async () => {
    let live!: LiveStream;
    const { stream } = setup({ events: (_, req) => ((live = new LiveStream(req.signal)), live.response) });
    stream.connect();
    await settle();
    live.push(HEARTBEAT);
    live.push(sse("message", message(1, { body: "private words" }), 1));
    await settle();
    const state = stream.getState();
    expect(state.heartbeats).toBe(1);
    expect(state.log).toEqual([
      { name: "heartbeat", at: 1_000 },
      { name: "message", at: 1_000 },
    ]);
    expect(JSON.stringify(state.log)).not.toContain("private");
  });

  it("keeps streaming after a resync that needs no more pages", async () => {
    let live!: LiveStream;
    const { stream, historyCalls } = setup({
      store: Array.from({ length: 230 }, (_, i) => message(i + 1)),
      events: (_, req) => ((live = new LiveStream(req.signal)), live.response),
    });
    stream.connect();
    await settle();
    expect(stream.getState().lastSeq).toBe(230);
    const before = historyCalls().length;
    live.push(sse("resync", { lastSeq: 230 }));
    live.push(sse("message", message(231), 231));
    await settle();
    expect(historyCalls().length).toBe(before + 1); // one short page: nothing newer than 230 existed
    expect(stream.getState().lastSeq).toBe(231);
    expect(stream.getState().connection).toBe("connected");
  });

  it("follows resync across several pages", async () => {
    // Held: 1..5. The server store grows to 305 while the stream is away.
    const store = [message(1), message(2), message(3), message(4), message(5)];
    let live!: LiveStream;
    const { stream, historyCalls, w } = setup({ store, events: (_, req) => ((live = new LiveStream(req.signal)), live.response) });
    stream.connect();
    await settle();
    for (let i = 6; i <= 305; i++) w.store.push(message(i));
    const before = historyCalls().length;
    live.push(sse("resync", { lastSeq: 305 }));
    await settle();
    expect(historyCalls().slice(before).map((c) => c.url.searchParams.get("afterSeq"))).toEqual(["5", "105", "205"]);
    expect(stream.getState().lastSeq).toBe(305);
  });

  it("stops on closed and does not reconnect", async () => {
    let live!: LiveStream;
    const { stream, t, eventCalls } = setup({ events: (_, req) => ((live = new LiveStream(req.signal)), live.response) });
    stream.connect();
    await settle();
    live.push(sse("closed", conversation("CLOSED")));
    await settle();
    expect(stream.getState()).toMatchObject({ connection: "ended", endedReason: "closed" });
    expect(t.pending).toBe(0);
    expect(eventCalls()).toHaveLength(1);
  });

  it("stops on purged", async () => {
    let live!: LiveStream;
    const { stream, t } = setup({ events: (_, req) => ((live = new LiveStream(req.signal)), live.response) });
    stream.connect();
    await settle();
    live.push(sse("purged", conversation("CLOSED")));
    await settle();
    expect(stream.getState()).toMatchObject({ connection: "ended", endedReason: "purged" });
    expect(t.pending).toBe(0);
  });

  it("ends without streaming when the history says purged", async () => {
    const { stream, eventCalls } = setup({ purged: true });
    stream.connect();
    await settle();
    expect(stream.getState()).toMatchObject({ connection: "ended", endedReason: "purged" });
    expect(eventCalls()).toHaveLength(0);
  });

  it("ignores events it does not know", async () => {
    let live!: LiveStream;
    const { stream } = setup({ events: (_, req) => ((live = new LiveStream(req.signal)), live.response) });
    stream.connect();
    await settle();
    live.push(sse("typing", { who: "expert" }));
    live.push(sse("message", message(1), 1));
    await settle();
    expect(seqs(stream)).toEqual([1]);
  });
});

describe("ConversationStream: reconnecting", () => {
  it("reconnects with Last-Event-ID after the server closes the stream", async () => {
    const lives: LiveStream[] = [];
    const { stream, t, eventCalls } = setup({
      events: (_, req) => {
        const l = new LiveStream(req.signal);
        lives.push(l);
        return l.response;
      },
    });
    stream.connect();
    await settle();
    lives[0].push(sse("message", message(1), 1));
    await settle();
    lives[0].end();
    await settle();
    expect(stream.getState().connection).toBe("reconnecting");
    expect(t.delays).toEqual([1000]);
    await t.fireNext();
    expect(eventCalls()).toHaveLength(2);
    expect(eventCalls()[1].headers.get("last-event-id")).toBe("1");
    expect(stream.getState().connection).toBe("connected");
  });

  it("grows the wait 1, 2, 4 ... 30 s while the server keeps failing", async () => {
    const { stream, t } = setup({ events: () => problem(503, "UNAVAILABLE") });
    stream.connect();
    await settle();
    for (let i = 0; i < 7; i++) await t.fireNext();
    expect(t.delays).toEqual([1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000]);
    expect(stream.getState()).toMatchObject({ connection: "reconnecting", lastError: { status: 503, code: "UNAVAILABLE" } });
  });

  it("keeps the jitter within 25% of the base", async () => {
    const { stream, t } = setup({ events: () => problem(500, "INTERNAL_ERROR") }, { random: () => 0.999 });
    stream.connect();
    await settle();
    await t.fireNext();
    await t.fireNext();
    expect(t.delays[0]).toBeGreaterThanOrEqual(1000);
    expect(t.delays[0]).toBeLessThanOrEqual(1250);
    expect(t.delays[1]).toBeGreaterThanOrEqual(2000);
    expect(t.delays[1]).toBeLessThanOrEqual(2500);
  });

  it("restarts the backoff once a connection delivers something", async () => {
    let n = 0;
    const lives: LiveStream[] = [];
    const { stream, t } = setup({
      events: (_, req) => {
        if (n++ < 2) return problem(500, "INTERNAL_ERROR");
        const l = new LiveStream(req.signal);
        lives.push(l);
        return l.response;
      },
    });
    stream.connect();
    await settle();
    await t.fireNext();
    await t.fireNext(); // third attempt connects
    lives[0].push(HEARTBEAT);
    await settle();
    lives[0].end();
    await settle();
    expect(t.delays).toEqual([1000, 2000, 1000]);
  });

  it("reconnects after a network error", async () => {
    const { stream, t } = setup({ events: () => Promise.reject(new TypeError("Failed to fetch")) });
    stream.connect();
    await settle();
    expect(t.delays).toEqual([1000]);
    expect(stream.getState().lastError).toMatchObject({ status: 0, code: "NETWORK_ERROR" });
  });

  it.each([
    [401, "INVALID_TOKEN", "unauthorized"],
    [403, "FORBIDDEN", "forbidden"],
    [404, "NOT_FOUND", "not-found"],
    [422, "NOT_A_HUMAN_CONVERSATION", "invalid"],
  ] as const)("stops for good on %i", async (status, code, reason) => {
    const { stream, t, eventCalls } = setup({ events: () => problem(status, code, { requestId: "req-1" }) });
    stream.connect();
    await settle();
    expect(stream.getState()).toMatchObject({
      connection: "ended",
      endedReason: reason,
      lastError: { status, code, requestId: "req-1" },
    });
    expect(t.pending).toBe(0);
    expect(eventCalls()).toHaveLength(1);
    stream.connect(); // an ended stream stays ended
    await settle();
    expect(eventCalls()).toHaveLength(1);
  });

  it("waits at least 15 s after TOO_MANY_STREAMS and honours a longer Retry-After", async () => {
    let n = 0;
    const { stream, t } = setup({
      events: () => (n++ === 0 ? problem(429, "TOO_MANY_STREAMS") : problem(429, "TOO_MANY_STREAMS", { retryAfter: 40 })),
    });
    stream.connect();
    await settle();
    await t.fireNext();
    expect(t.delays[0]).toBe(15_000);
    expect(t.delays[1]).toBe(40_000);
  });

  it("retries the history load too", async () => {
    let failing = true;
    const fetchFn = routedFetch((req) => {
      if (req.url.pathname.endsWith("/events")) return new LiveStream(req.signal).response;
      if (failing) return problem(500, "INTERNAL_ERROR");
      return jsonResponse({ purged: false, items: [message(1)] });
    });
    const t = manualTimers();
    const stream = new ConversationStream({ client: clientFor(fetchFn), conversationId: "c1", timers: t.timers, random: () => 0 });
    stream.connect();
    await settle();
    expect(t.delays).toEqual([1000]);
    failing = false;
    await t.fireNext();
    expect(seqs(stream)).toEqual([1]);
    expect(stream.getState().connection).toBe("connected");
  });
});

describe("ConversationStream: disconnect and connect", () => {
  it("aborts the fetch, schedules nothing and stays disconnected", async () => {
    let live!: LiveStream;
    const { stream, t, eventCalls } = setup({ events: (_, req) => ((live = new LiveStream(req.signal)), live.response) });
    stream.connect();
    await settle();
    stream.disconnect();
    await settle();
    expect(eventCalls()[0].signal?.aborted).toBe(true);
    expect(stream.getState().connection).toBe("disconnected");
    expect(t.pending).toBe(0);
    expect(eventCalls()).toHaveLength(1);
    void live;
  });

  it("cancels a pending reconnect timer", async () => {
    const { stream, t } = setup({ events: () => problem(500, "INTERNAL_ERROR") });
    stream.connect();
    await settle();
    expect(t.pending).toBe(1);
    stream.disconnect();
    await settle();
    expect(t.pending).toBe(0);
    expect(stream.getState().connection).toBe("disconnected");
  });

  it("resumes from lastSeq on connect() after a disconnect", async () => {
    const lives: LiveStream[] = [];
    const { stream, eventCalls, w } = setup({
      events: (_, req) => {
        const l = new LiveStream(req.signal);
        lives.push(l);
        return l.response;
      },
    });
    stream.connect();
    await settle();
    lives[0].push(sse("message", message(1), 1));
    await settle();
    stream.disconnect();
    await settle();
    w.store.push(message(1), message(2), message(3)); // sent while away
    stream.connect();
    await settle();
    expect(eventCalls()).toHaveLength(2);
    expect(eventCalls()[1].headers.get("last-event-id")).toBe("1");
    lives[1].push(sse("message", message(2), 2) + sse("message", message(3), 3));
    await settle();
    expect(seqs(stream)).toEqual([1, 2, 3]);
  });

  it("ignores connect() while already connected", async () => {
    const { stream, eventCalls } = setup({ events: (_, req) => new LiveStream(req.signal).response });
    stream.connect();
    await settle();
    stream.connect();
    await settle();
    expect(eventCalls()).toHaveLength(1);
  });

  it("notifies subscribers with a new state object each change", async () => {
    const { stream } = setup({ events: (_, req) => new LiveStream(req.signal).response });
    const seen: string[] = [];
    const first = stream.getState();
    stream.subscribe(() => seen.push(stream.getState().connection));
    stream.connect();
    await settle();
    expect(seen[0]).toBe("connecting");
    expect(seen.at(-1)).toBe("connected");
    expect(stream.getState()).not.toBe(first);
  });
});

describe("ConversationStream: sending", () => {
  it("shows the message as sending, then sent, and drops the echo", async () => {
    let live!: LiveStream;
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const { stream, fetchFn } = setup({
      events: (_, req) => ((live = new LiveStream(req.signal)), live.response),
      post: async () => {
        await gate;
        return jsonResponse(message(1, { clientMessageId: "generated-id", body: "hello" }), 201);
      },
    });
    stream.connect();
    await settle();
    const sending = stream.send("hello");
    await settle();
    expect(stream.getState().pending).toEqual([{ clientMessageId: "generated-id", text: "hello", status: "sending", errorCode: null }]);
    release();
    await sending;
    expect(stream.getState().pending).toEqual([]);
    expect(seqs(stream)).toEqual([1]);
    const post = fetchFn.calls.find((c) => c.method === "POST")!;
    expect(JSON.parse(post.body ?? "")).toEqual({ text: "hello", clientMessageId: "generated-id" });
    live.push(sse("message", message(1, { clientMessageId: "generated-id" }), 1)); // the echo on our own stream
    await settle();
    expect(seqs(stream)).toEqual([1]);
  });

  it("keeps a failed send and retries it with the same clientMessageId", async () => {
    let fail = true;
    const { stream, fetchFn } = setup({
      events: (_, req) => new LiveStream(req.signal).response,
      post: () => (fail ? Promise.reject(new TypeError("Failed to fetch")) : jsonResponse(message(1, { clientMessageId: "id-7" }), 201)),
    });
    await stream.send("hello", "id-7");
    expect(stream.getState().pending).toEqual([{ clientMessageId: "id-7", text: "hello", status: "failed", errorCode: "NETWORK_ERROR" }]);
    fail = false;
    await stream.retry("id-7");
    expect(stream.getState().pending).toEqual([]);
    const ids = fetchFn.calls.filter((c) => c.method === "POST").map((c) => JSON.parse(c.body ?? "").clientMessageId);
    expect(ids).toEqual(["id-7", "id-7"]);
  });

  it("records the problem code of a refused send", async () => {
    const { stream } = setup({ post: () => problem(409, "CONVERSATION_CLOSED") });
    await stream.send("hello", "id-1");
    expect(stream.getState().pending[0]).toMatchObject({ status: "failed", errorCode: "CONVERSATION_CLOSED" });
  });

  it("does not skip messages that the stream delivers after a POST result that is ahead of it", async () => {
    let live!: LiveStream;
    const { stream } = setup({
      store: [message(1)],
      events: (_, req) => ((live = new LiveStream(req.signal)), live.response),
      post: () => jsonResponse(message(3, { clientMessageId: "mine" }), 201),
    });
    stream.connect();
    await settle();
    await stream.send("hi", "mine"); // seq 3 comes back before seq 2 has reached the stream
    expect(stream.getState().lastSeq).toBe(1); // 2 is still missing, so Last-Event-ID must not jump to 3
    live.push(sse("message", message(2), 2));
    await settle();
    expect(seqs(stream)).toEqual([1, 2, 3]);
    expect(stream.getState().lastSeq).toBe(3);
  });
});

describe("ConversationStream: extra streams", () => {
  it("reports the per-user cap without touching the main stream", async () => {
    let n = 0;
    const { stream } = setup({
      events: (_, req) => (n++ === 0 ? new LiveStream(req.signal).response : problem(429, "TOO_MANY_STREAMS", { requestId: "req-5" })),
    });
    stream.connect();
    await settle();
    const extra = await stream.openExtra();
    expect(extra).toMatchObject({ status: 429, code: "TOO_MANY_STREAMS", requestId: "req-5" });
    expect(stream.getState().connection).toBe("connected");
  });

  it("holds an accepted extra stream open until it is closed or the stream is destroyed", async () => {
    const signals: (AbortSignal | null)[] = [];
    const { stream } = setup({
      events: (_, req) => {
        signals.push(req.signal);
        return new LiveStream(req.signal).response;
      },
    });
    stream.connect();
    await settle();
    const extra = await stream.openExtra();
    expect(extra.status).toBe(200);
    expect(signals[1]?.aborted).toBe(false);
    stream.destroy();
    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(true);
  });
});
