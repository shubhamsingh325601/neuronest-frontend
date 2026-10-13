import { describe, expect, it } from "vitest";
import { parseSse, SseParser, type SseBlock } from "./sse-reader";

const enc = new TextEncoder();

function streamOf(...chunks: (string | Uint8Array)[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(typeof chunk === "string" ? enc.encode(chunk) : chunk);
      controller.close();
    },
  });
}

async function collect(source: ReadableStream<Uint8Array>, onChunk?: (c: { bytes: number }) => void): Promise<SseBlock[]> {
  const out: SseBlock[] = [];
  for await (const block of parseSse(source, { onChunk })) out.push(block);
  return out;
}

const ev = (event: string, data: string, id: string | null = null): SseBlock => ({ type: "event", event, id, data, retry: null });

describe("SseParser", () => {
  it("dispatches an event on the blank line", () => {
    const p = new SseParser();
    expect(p.push("event: delta\ndata: {\"text\":\"hi\"}\n")).toEqual([]);
    expect(p.push("\n")).toEqual([ev("delta", '{"text":"hi"}')]);
  });

  it("handles a block split mid-line and mid-field", () => {
    const p = new SseParser();
    const out = [...p.push("eve"), ...p.push("nt: del"), ...p.push("ta\nda"), ...p.push("ta: {\"a\""), ...p.push(":1}\n\n")];
    expect(out).toEqual([ev("delta", '{"a":1}')]);
  });

  it("accepts \\r\\n, \\n and a lone \\r", () => {
    const p = new SseParser();
    expect(p.push("event: a\r\ndata: 1\r\n\r\n")).toEqual([ev("a", "1")]);
    expect(p.push("event: b\rdata: 2\r\r")).toEqual([]); // trailing \r is held in case a \n follows
    expect(p.push("event: c\ndata: 3\n\n")).toEqual([ev("b", "2"), ev("c", "3")]);
  });

  it("does not treat the \\n of a split \\r\\n as an extra blank line", () => {
    const p = new SseParser();
    const out = [...p.push("event: a\r"), ...p.push("\ndata: 1\r"), ...p.push("\n\r"), ...p.push("\n")];
    expect(out).toEqual([ev("a", "1")]);
  });

  it("turns a comment line into a heartbeat block", () => {
    const p = new SseParser();
    expect(p.push(": hb\n\n")).toEqual([{ type: "comment", text: "hb" }]);
    expect(p.push(":no-space\n")).toEqual([{ type: "comment", text: "no-space" }]);
  });

  it("joins multi-line data with a newline and strips one leading space only", () => {
    const p = new SseParser();
    expect(p.push("data: line1\ndata:  line2\ndata:\ndata: line4\n\n")).toEqual([ev("message", "line1\n line2\n\nline4")]);
  });

  it("defaults the event name to message and keeps an id given without an event", () => {
    const p = new SseParser();
    expect(p.push("id: 7\ndata: x\n\n")).toEqual([ev("message", "x", "7")]);
  });

  it("does not carry the id over to the next block", () => {
    const p = new SseParser();
    const out = p.push("id: 1\ndata: a\n\ndata: b\n\n");
    expect(out.map((b) => (b.type === "event" ? b.id : "c"))).toEqual(["1", null]);
  });

  it("ignores a block with no data line, and unknown fields", () => {
    const p = new SseParser();
    expect(p.push("event: x\nid: 3\n\nfoo: bar\ndata: y\n\n")).toEqual([ev("message", "y")]);
  });

  it("reads retry only when it is digits", () => {
    const p = new SseParser();
    expect(p.push("retry: 1500\ndata: a\n\nretry: soon\ndata: b\n\n")).toEqual([
      { type: "event", event: "message", id: null, data: "a", retry: 1500 },
      { type: "event", event: "message", id: null, data: "b", retry: null },
    ]);
  });

  it("treats a data line with no colon as an empty data line", () => {
    const p = new SseParser();
    expect(p.push("data\n\n")).toEqual([ev("message", "")]);
  });

  it("ignores a leading BOM", () => {
    const p = new SseParser();
    expect(p.push("﻿event: a\ndata: 1\n\n")).toEqual([ev("a", "1")]);
  });

  it("discards an unterminated tail at EOF", () => {
    const p = new SseParser();
    expect(p.push("event: a\ndata: 1\n\nevent: b\ndata: 2\n")).toEqual([ev("a", "1")]);
    expect(p.end()).toEqual([]);
  });

  it("treats a held \\r at EOF as a line ending", () => {
    const p = new SseParser();
    p.push("data: 1\r\r");
    expect(p.end()).toEqual([ev("message", "1")]);
  });
});

describe("parseSse", () => {
  it("parses blocks across chunk boundaries", async () => {
    const blocks = await collect(streamOf("event: delta\nda", 'ta: {"text":"a"}\n\n: hb\n\nevent: done\n', "data: {}\n\n"));
    expect(blocks).toEqual([ev("delta", '{"text":"a"}'), { type: "comment", text: "hb" }, ev("done", "{}")]);
  });

  it("survives a multi-byte character split across chunks", async () => {
    const bytes = enc.encode("data: héllo — 😀\n\n");
    for (let cut = 1; cut < bytes.length; cut++) {
      const blocks = await collect(streamOf(bytes.slice(0, cut), bytes.slice(cut)));
      expect(blocks).toEqual([ev("message", "héllo — 😀")]);
    }
  });

  it("discards the open block when the stream ends without a blank line", async () => {
    expect(await collect(streamOf("event: a\ndata: 1\n\nevent: b\ndata: 2"))).toEqual([ev("a", "1")]);
  });

  it("reports each chunk before the blocks it contains", async () => {
    const seen: string[] = [];
    const stream = streamOf("event: a\ndata: 1\n\nevent: b\ndata: 2\n\n", ": hb\n\n");
    for await (const block of parseSse(stream, { onChunk: (c) => seen.push(`chunk:${c.bytes}`) })) {
      seen.push(block.type === "event" ? block.event : "hb");
    }
    expect(seen).toEqual(["chunk:36", "a", "b", "chunk:6", "hb"]);
  });

  it("cancels the underlying stream when the consumer stops early", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(enc.encode("data: 1\n\ndata: 2\n\n"));
      },
      cancel() {
        cancelled = true;
      },
    });
    for await (const block of parseSse(stream)) {
      expect(block.type).toBe("event");
      break;
    }
    expect(cancelled).toBe(true);
  });

  it("accepts an async iterable of chunks", async () => {
    async function* chunks() {
      yield enc.encode("data: a\n\n");
    }
    const out: SseBlock[] = [];
    for await (const b of parseSse(chunks())) out.push(b);
    expect(out).toEqual([ev("message", "a")]);
  });
});
