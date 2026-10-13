// One Server-Sent Events reader for every stream (AI send stream, conversation events). Browser `EventSource`
// cannot send an Authorization header, so streams are read from `fetch().body`. Plain TS, no DOM-only APIs
// beyond `TextDecoder` and `ReadableStream`, which React Native's `expo/fetch` also provides.

export type SseBlock =
  | { type: "event"; event: string; id: string | null; data: string; retry: number | null }
  | { type: "comment"; text: string };

/**
 * Incremental parser over decoded text. Lines end with `\r\n`, `\n` or a lone `\r`; a blank line dispatches the
 * pending event; a line starting with `:` is a comment (the server's heartbeat). A block that is still open when
 * the stream ends is discarded, because the server never finished sending it.
 */
export class SseParser {
  private buffer = "";
  private started = false;
  private eventName = "";
  private dataLines: string[] = [];
  private hasData = false;
  private id: string | null = null;
  private retry: number | null = null;

  push(text: string): SseBlock[] {
    if (!this.started && text) {
      this.started = true;
      if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    }
    this.buffer += text;
    return this.drain(false);
  }

  /** Call once at EOF: a held `\r` is a complete line ending, an unterminated line or open block is dropped. */
  end(): SseBlock[] {
    const blocks = this.drain(true);
    this.buffer = "";
    this.reset();
    return blocks;
  }

  private drain(eof: boolean): SseBlock[] {
    const blocks: SseBlock[] = [];
    let start = 0;
    const buf = this.buffer;
    for (let i = 0; i < buf.length; i++) {
      const ch = buf[i];
      if (ch !== "\n" && ch !== "\r") continue;
      let next = i + 1;
      if (ch === "\r") {
        if (i + 1 === buf.length && !eof) break; // could be the first half of \r\n: wait for the next chunk
        if (buf[i + 1] === "\n") next = i + 2;
      }
      const block = this.line(buf.slice(start, i));
      if (block) blocks.push(block);
      start = next;
      i = next - 1;
    }
    this.buffer = buf.slice(start);
    return blocks;
  }

  private line(line: string): SseBlock | null {
    if (line === "") return this.dispatch();
    if (line[0] === ":") return { type: "comment", text: line.slice(1).replace(/^ /, "") };
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value[0] === " ") value = value.slice(1);
    switch (field) {
      case "event":
        this.eventName = value;
        break;
      case "data":
        this.dataLines.push(value);
        this.hasData = true;
        break;
      case "id":
        if (!value.includes("\0")) this.id = value;
        break;
      case "retry":
        if (/^\d+$/.test(value)) this.retry = Number(value);
        break;
    }
    return null;
  }

  private dispatch(): SseBlock | null {
    if (!this.hasData) {
      this.reset();
      return null;
    }
    const block: SseBlock = {
      type: "event",
      event: this.eventName || "message",
      id: this.id,
      data: this.dataLines.join("\n"),
      retry: this.retry,
    };
    this.reset();
    return block;
  }

  private reset() {
    this.eventName = "";
    this.dataLines = [];
    this.hasData = false;
    this.id = null;
    this.retry = null;
  }
}

export interface ParseSseOptions {
  /**
   * Called for each network chunk before it is parsed, so the events yielded next belong to this chunk. This is
   * how callers measure buffering (many events in one chunk) and silent gaps.
   */
  onChunk?: (chunk: { bytes: number }) => void;
}

type ByteSource = ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>;

async function* readChunks(source: ByteSource): AsyncGenerator<Uint8Array> {
  if (!("getReader" in source)) {
    yield* source;
    return;
  }
  const reader = source.getReader();
  let finished = false;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        finished = true;
        return;
      }
      if (value) yield value;
    }
  } finally {
    // The consumer stopped early (a `break`, an abort): release the connection instead of leaving it open.
    if (!finished) await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

/** Parses a byte stream into SSE blocks. `TextDecoder` runs in stream mode so a multi-byte character split across chunks survives. */
export async function* parseSse(source: ByteSource, options: ParseSseOptions = {}): AsyncGenerator<SseBlock> {
  const decoder = new TextDecoder("utf-8");
  const parser = new SseParser();
  for await (const chunk of readChunks(source)) {
    options.onChunk?.({ bytes: chunk.byteLength });
    yield* parser.push(decoder.decode(chunk, { stream: true }));
  }
  yield* parser.push(decoder.decode());
  yield* parser.end();
}
