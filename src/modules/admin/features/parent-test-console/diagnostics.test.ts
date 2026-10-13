import { describe, expect, it } from "vitest";
import type { StreamMetrics } from "@/modules/chat-client/ai-stream";
import { buildDiagnosticsCsv, csvCell, CSV_COLUMNS, rowFlags, type DiagnosticsRow } from "./diagnostics";

const metrics = (over: Partial<StreamMetrics> = {}): StreamMetrics => ({
  httpStatus: 200,
  requestId: "req-1",
  ttfbMs: 310,
  firstDeltaMs: 1200,
  totalMs: 4800,
  deltas: 5,
  chunks: 6,
  maxEventsPerChunk: 1,
  maxGapMs: 900,
  heartbeats: 0,
  bufferedEvents: false,
  streamDropped: false,
  doneState: "COMPLETE",
  conversationClosed: false,
  errorCode: null,
  ...over,
});
const row = (over: Partial<DiagnosticsRow> = {}): DiagnosticsRow => ({ n: 1, kind: "send", outcome: "done", metrics: metrics(), ...over });

describe("csvCell", () => {
  it("leaves plain values alone and empties null", () => {
    expect(csvCell(12)).toBe("12");
    expect(csvCell(true)).toBe("true");
    expect(csvCell("COMPLETE")).toBe("COMPLETE");
    expect(csvCell(null)).toBe("");
  });

  it("quotes commas, quotes and newlines", () => {
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(csvCell("a\nb")).toBe('"a\nb"');
  });

  it("defuses spreadsheet formulas in text cells but not numbers", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("-1+2")).toBe("'-1+2");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell(-5)).toBe("-5");
  });
});

describe("buildDiagnosticsCsv", () => {
  it("has the columns the plan asks for, in a header row", () => {
    const [header] = buildDiagnosticsCsv([]).split("\n");
    expect(header.split(",")).toEqual(CSV_COLUMNS.map((c) => c.header));
    for (const name of ["ttfbMs", "firstDeltaMs", "totalMs", "deltas", "chunks", "maxEventsPerChunk", "maxGapMs", "heartbeats", "doneState", "conversationClosed", "errorCode", "httpStatus", "requestId"]) {
      expect(header.split(",")).toContain(name);
    }
  });

  it("writes one line per row", () => {
    const csv = buildDiagnosticsCsv([row(), row({ n: 2, kind: "resend", metrics: metrics({ errorCode: "AI_CHAT_BUSY", httpStatus: 409, ttfbMs: null, doneState: null }) })]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toBe("1,send,done,200,310,1200,4800,5,6,1,false,900,false,0,COMPLETE,false,,req-1");
    expect(lines[2].split(",").slice(0, 5)).toEqual(["2", "resend", "done", "409", ""]);
    expect(lines[2]).toContain("AI_CHAT_BUSY");
  });

  it("contains only the metric fields: no text, token or header can reach it", () => {
    const dump = JSON.stringify(CSV_COLUMNS.map((c) => c.header));
    for (const forbidden of ["text", "body", "message", "token", "authorization", "header"]) {
      expect(dump.toLowerCase()).not.toContain(forbidden);
    }
    const csv = buildDiagnosticsCsv([row()]);
    expect(csv).not.toMatch(/Bearer|secret|password/i);
  });
});

describe("rowFlags", () => {
  it("flags buffering and a dropped stream", () => {
    expect(rowFlags(metrics())).toEqual([]);
    expect(rowFlags(metrics({ bufferedEvents: true })).map((f) => f.label)).toEqual(["Buffered"]);
    expect(rowFlags(metrics({ bufferedEvents: true, streamDropped: true })).map((f) => f.label)).toEqual(["Buffered", "Gap over 17 s"]);
  });
});
