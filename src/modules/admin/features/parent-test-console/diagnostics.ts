import type { AiStreamOutcome, StreamMetrics } from "@/modules/chat-client/ai-stream";

// The Diagnostics table and its CSV. A row holds timings, counts, event names and codes ONLY: never message
// text, a token or a header. `kind` says how the request was started.

export type SendKind = "send" | "retry" | "resend";

export interface DiagnosticsRow {
  n: number;
  kind: SendKind;
  outcome: AiStreamOutcome;
  metrics: StreamMetrics;
}

export const CSV_COLUMNS: { header: string; value: (row: DiagnosticsRow) => string | number | boolean | null }[] = [
  { header: "n", value: (r) => r.n },
  { header: "kind", value: (r) => r.kind },
  { header: "outcome", value: (r) => r.outcome },
  { header: "httpStatus", value: (r) => r.metrics.httpStatus },
  { header: "ttfbMs", value: (r) => r.metrics.ttfbMs },
  { header: "firstDeltaMs", value: (r) => r.metrics.firstDeltaMs },
  { header: "totalMs", value: (r) => r.metrics.totalMs },
  { header: "deltas", value: (r) => r.metrics.deltas },
  { header: "chunks", value: (r) => r.metrics.chunks },
  { header: "maxEventsPerChunk", value: (r) => r.metrics.maxEventsPerChunk },
  { header: "bufferedEvents", value: (r) => r.metrics.bufferedEvents },
  { header: "maxGapMs", value: (r) => r.metrics.maxGapMs },
  { header: "streamDropped", value: (r) => r.metrics.streamDropped },
  { header: "heartbeats", value: (r) => r.metrics.heartbeats },
  { header: "doneState", value: (r) => r.metrics.doneState },
  { header: "conversationClosed", value: (r) => r.metrics.conversationClosed },
  { header: "errorCode", value: (r) => r.metrics.errorCode },
  { header: "requestId", value: (r) => r.metrics.requestId },
];

/** Quotes a cell, and defuses a leading `= + - @` so a spreadsheet never runs a value as a formula. */
export function csvCell(value: string | number | boolean | null): string {
  if (value === null) return "";
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildDiagnosticsCsv(rows: readonly DiagnosticsRow[]): string {
  const lines = [CSV_COLUMNS.map((c) => c.header).join(",")];
  for (const row of rows) lines.push(CSV_COLUMNS.map((c) => csvCell(c.value(row))).join(","));
  return lines.join("\n");
}

/** Raw stream metrics -> the flags the table highlights. */
export function rowFlags(metrics: StreamMetrics): { label: string; hint: string }[] {
  const flags: { label: string; hint: string }[] = [];
  if (metrics.bufferedEvents) {
    flags.push({ label: "Buffered", hint: "Several events arrived in one network chunk: a proxy or host is buffering the stream." });
  }
  if (metrics.streamDropped) {
    flags.push({ label: "Gap over 17 s", hint: "No bytes for more than 15 s plus tolerance, heartbeats included: something dropped the stream." });
  }
  return flags;
}
