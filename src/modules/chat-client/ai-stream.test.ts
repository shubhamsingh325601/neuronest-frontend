import { describe, expect, it } from "vitest";
import { createTransport } from "./client";
import { sendAiMessage, type StreamMetrics } from "./ai-stream";
import { ChatErrorCode } from "./problem";
import type { AiStreamEvent } from "./types";
import { BASE, HEARTBEAT, problem, routedFetch, scriptedSse, sse, type Handler } from "./test-helpers";

const doneData = { messageId: "m1", seq: 4, state: "COMPLETE", conversationClosed: false };
const body = { text: "my secret question", clientMessageId: "cmid-1" };

function run(handler: Handler, options: Partial<Parameters<typeof sendAiMessage>[3]> = {}, clock = { t: 0 }) {
  const fetchFn = routedFetch(handler);
  const transport = createTransport({ baseUrl: BASE, getToken: () => "secret-token", fetch: fetchFn });
  const events: AiStreamEvent[] = [];
  const result = sendAiMessage(transport, "conv 1", body, {
    onEvent: (e) => events.push(e),
    now: () => clock.t,
    ...options,
  });
  return { result, events, fetchFn, clock };
}

describe("sendAiMessage", () => {
  it("posts the message with the stream headers and the bearer token", async () => {
    const clock = { t: 0 };
    const { result, fetchFn } = run(() => scriptedSse(clock, [{ at: 0, data: sse("done", doneData) }]), {}, clock);
    await result;
    const req = fetchFn.calls[0];
    expect(req.method).toBe("POST");
    expect(req.url.href).toBe(`${BASE}/v1/ai-conversations/conv%201/messages`);
    expect(req.headers.get("accept")).toBe("text/event-stream");
    expect(req.headers.get("authorization")).toBe("Bearer secret-token");
    expect(JSON.parse(req.body ?? "")).toEqual(body);
  });

  it("delivers delta, delta, done and measures the timings", async () => {
    const clock = { t: 0 };
    const handler: Handler = () => {
      clock.t = 120; // headers arrive
      return scriptedSse(
        clock,
        [
          { at: 130, data: sse("delta", { text: "Hello. " }) },
          { at: 400, data: HEARTBEAT },
          { at: 900, data: sse("delta", { text: "More." }) + sse("done", doneData) },
        ],
        { "x-request-id": "req-77" },
      );
    };
    const { result, events } = run(handler, {}, clock);
    const { outcome, metrics, error } = await result;
    expect(events).toEqual([
      { type: "delta", text: "Hello. " },
      { type: "delta", text: "More." },
      { type: "done", messageId: "m1", seq: 4, state: "COMPLETE", conversationClosed: false },
    ]);
    expect(outcome).toBe("done");
    expect(error).toBeNull();
    expect(metrics).toMatchObject({
      httpStatus: 200,
      requestId: "req-77",
      ttfbMs: 120,
      firstDeltaMs: 130,
      totalMs: 900,
      deltas: 2,
      chunks: 3,
      heartbeats: 1,
      maxEventsPerChunk: 2,
      maxGapMs: 500,
      bufferedEvents: false,
      streamDropped: false,
      doneState: "COMPLETE",
      conversationClosed: false,
      errorCode: null,
    });
  });

  it("passes a retract through and records the done state", async () => {
    const clock = { t: 0 };
    const { result, events } = run(
      () =>
        scriptedSse(clock, [
          { at: 1, data: sse("delta", { text: "Partial. " }) },
          { at: 2, data: sse("retract", { text: "Safe text." }) },
          { at: 3, data: sse("done", { ...doneData, state: "RETRACTED" }) },
        ]),
      {},
      clock,
    );
    const { outcome, metrics } = await result;
    expect(events.map((e) => e.type)).toEqual(["delta", "retract", "done"]);
    expect(outcome).toBe("done");
    expect(metrics.doneState).toBe("RETRACTED");
  });

  it("flags conversationClosed from done", async () => {
    const clock = { t: 0 };
    const { result } = run(
      () => scriptedSse(clock, [{ at: 1, data: sse("done", { ...doneData, state: "REDIRECTED", conversationClosed: true }) }]),
      {},
      clock,
    );
    expect((await result).metrics).toMatchObject({ doneState: "REDIRECTED", conversationClosed: true });
  });

  it("reports an error event as a failed outcome with its code", async () => {
    const clock = { t: 0 };
    const { result, events } = run(
      () => scriptedSse(clock, [{ at: 1, data: sse("delta", { text: "x" }) + sse("error", { code: "AI_TIMEOUT" }) }]),
      {},
      clock,
    );
    const { outcome, metrics, error } = await result;
    expect(events.at(-1)).toEqual({ type: "error", code: "AI_TIMEOUT" });
    expect(outcome).toBe("failed");
    expect(error).toBeNull();
    expect(metrics.errorCode).toBe("AI_TIMEOUT");
  });

  it("maps a refusal before the stream to a ChatApiError by code", async () => {
    const { result, events } = run(() => problem(409, "AI_CHAT_BUSY", { requestId: "req-9", retryAfter: 3 }));
    const { outcome, metrics, error } = await result;
    expect(events).toEqual([]);
    expect(outcome).toBe("failed");
    expect(error).toMatchObject({ status: 409, code: "AI_CHAT_BUSY", requestId: "req-9", retryAfter: 3 });
    expect(metrics).toMatchObject({ httpStatus: 409, requestId: "req-9", errorCode: "AI_CHAT_BUSY", deltas: 0 });
  });

  it("flags buffering when one network chunk holds 3 or more events", async () => {
    const clock = { t: 0 };
    const all = sse("delta", { text: "a" }) + sse("delta", { text: "b" }) + sse("done", doneData);
    const { result } = run(() => scriptedSse(clock, [{ at: 5, data: all }]), {}, clock);
    const { metrics } = await result;
    expect(metrics).toMatchObject({ chunks: 1, maxEventsPerChunk: 3, bufferedEvents: true });
  });

  it("does not flag buffering for two events in a chunk", async () => {
    const clock = { t: 0 };
    const { result } = run(() => scriptedSse(clock, [{ at: 5, data: sse("delta", { text: "a" }) + sse("done", doneData) }]), {}, clock);
    expect((await result).metrics.bufferedEvents).toBe(false);
  });

  it("flags a dropped stream when two chunks are more than 17 s apart", async () => {
    const clock = { t: 0 };
    const { result } = run(
      () =>
        scriptedSse(clock, [
          { at: 100, data: sse("delta", { text: "a" }) },
          { at: 18_200, data: sse("done", doneData) },
        ]),
      {},
      clock,
    );
    const { metrics } = await result;
    expect(metrics.maxGapMs).toBe(18_100);
    expect(metrics.streamDropped).toBe(true);
  });

  it("treats heartbeats as chunks, so a long but heartbeat-covered wait is not a dropped stream", async () => {
    const clock = { t: 0 };
    const { result } = run(
      () =>
        scriptedSse(clock, [
          { at: 100, data: sse("delta", { text: "a" }) },
          { at: 15_100, data: HEARTBEAT },
          { at: 30_100, data: HEARTBEAT },
          { at: 31_000, data: sse("done", doneData) },
        ]),
      {},
      clock,
    );
    const { metrics } = await result;
    expect(metrics).toMatchObject({ heartbeats: 2, maxGapMs: 15_000, streamDropped: false });
  });

  it("aborts after the first delta when asked, and delivers nothing more", async () => {
    const clock = { t: 0 };
    const { result, events, fetchFn } = run(
      () =>
        scriptedSse(clock, [
          { at: 1, data: sse("delta", { text: "first. " }) },
          { at: 2, data: sse("delta", { text: "second. " }) },
          { at: 3, data: sse("done", doneData) },
        ]),
      { abortAfterFirstDelta: true },
      clock,
    );
    const { outcome, metrics } = await result;
    expect(outcome).toBe("aborted");
    expect(events).toEqual([{ type: "delta", text: "first. " }]);
    expect(fetchFn.calls[0].signal?.aborted).toBe(true);
    expect(metrics).toMatchObject({ deltas: 1, doneState: null });
  });

  it("aborts the request when the caller's signal fires", async () => {
    const controller = new AbortController();
    const fetchFn = routedFetch(
      (req) =>
        new Promise<Response>((_, reject) => {
          req.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
    );
    const transport = createTransport({ baseUrl: BASE, getToken: () => null, fetch: fetchFn });
    const pending = sendAiMessage(transport, "c", body, { onEvent: () => undefined, signal: controller.signal });
    controller.abort();
    expect((await pending).outcome).toBe("aborted");
  });

  it("returns aborted at once when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchFn = routedFetch(
      (req) => (req.signal?.aborted ? Promise.reject(new DOMException("aborted", "AbortError")) : problem(500, "X")),
    );
    const transport = createTransport({ baseUrl: BASE, getToken: () => null, fetch: fetchFn });
    expect((await sendAiMessage(transport, "c", body, { onEvent: () => undefined, signal: controller.signal })).outcome).toBe(
      "aborted",
    );
  });

  it("reports a network failure as status 0", async () => {
    const { result } = run(() => Promise.reject(new TypeError("Failed to fetch")));
    const { outcome, error, metrics } = await result;
    expect(outcome).toBe("failed");
    expect(error).toMatchObject({ status: 0, code: ChatErrorCode.Network });
    expect(metrics.httpStatus).toBe(0);
  });

  it("fails when the stream ends without done or error", async () => {
    const clock = { t: 0 };
    const { result } = run(() => scriptedSse(clock, [{ at: 1, data: sse("delta", { text: "cut off" }) }]), {}, clock);
    const { outcome, error } = await result;
    expect(outcome).toBe("failed");
    expect(error?.code).toBe(ChatErrorCode.StreamEnded);
  });

  it("ignores unknown events and malformed data, and parses status and footer", async () => {
    const clock = { t: 0 };
    const { result, events } = run(
      () =>
        scriptedSse(clock, [
          {
            at: 1,
            data:
              sse("telemetry", { x: 1 }) +
              "event: delta\ndata: {not json\n\n" +
              sse("delta", { nope: true }) +
              sse("status", { phase: "thinking" }) +
              sse("footer", { text: "This is AI guidance." }) +
              sse("done", doneData),
          },
        ]),
      {},
      clock,
    );
    await result;
    expect(events.map((e) => e.type)).toEqual(["status", "footer", "done"]);
  });

  it("keeps message text, tokens and headers out of the metrics", async () => {
    const clock = { t: 0 };
    const { result } = run(
      () =>
        scriptedSse(clock, [{ at: 1, data: sse("delta", { text: "my secret question reply" }) + sse("done", doneData) }], {
          "x-request-id": "req-1",
        }),
      {},
      clock,
    );
    const { metrics } = await result;
    for (const value of Object.values(metrics as StreamMetrics)) {
      expect(["number", "boolean", "string"].includes(typeof value) || value === null).toBe(true);
    }
    const dump = JSON.stringify(metrics);
    expect(dump).not.toContain("secret");
    expect(dump).not.toContain("reply");
    expect(dump).not.toContain("Bearer");
  });
});
