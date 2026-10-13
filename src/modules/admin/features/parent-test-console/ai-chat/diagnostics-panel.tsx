"use client";

import { Check, ClipboardCopy, RefreshCw, Square } from "lucide-react";
import { useState } from "react";
import { Badge } from "../../../ui/badge";
import { Button } from "../../../ui/button";
import { buildDiagnosticsCsv, rowFlags, type DiagnosticsRow } from "../diagnostics";

const dash = "–";
const num = (value: number | null) => (value === null ? dash : String(value));
const text = (value: string | null) => value ?? dash;

interface DiagnosticsPanelProps {
  rows: readonly DiagnosticsRow[];
  abortAfterFirstDelta: boolean;
  onAbortAfterFirstDeltaChange: (on: boolean) => void;
  streaming: boolean;
  onAbort: () => void;
  canResend: boolean;
  onResend: () => void;
}

/**
 * Timings, counts, event names and codes for each message sent, plus the controls that test the stream
 * (client abort, idempotent resend). Message text is never shown here and never reaches the CSV.
 */
export function DiagnosticsPanel({
  rows,
  abortAfterFirstDelta,
  onAbortAfterFirstDeltaChange,
  streaming,
  onAbort,
  canResend,
  onResend,
}: DiagnosticsPanelProps) {
  const [copied, setCopied] = useState(false);

  async function copyCsv() {
    try {
      await navigator.clipboard.writeText(buildDiagnosticsCsv(rows));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked: nothing to do.
    }
  }

  return (
    <div className="grid gap-4 text-sm">
      <div className="grid gap-3">
        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={abortAfterFirstDelta}
            onChange={(event) => onAbortAfterFirstDeltaChange(event.target.checked)}
            className="mt-0.5 size-4 accent-primary"
          />
          <span>
            <span className="font-medium">Abort after first delta</span>
            <span className="block text-xs text-muted-foreground">Cancels the request as soon as the first words arrive. The server should store no answer.</span>
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={!streaming} onClick={onAbort}>
            <Square aria-hidden="true" className="fill-current" />
            Abort mid-stream
          </Button>
          <Button size="sm" variant="outline" disabled={!canResend || streaming} onClick={onResend}>
            <RefreshCw aria-hidden="true" />
            Resend same clientMessageId
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">Requests ({rows.length})</h3>
        <Button size="sm" variant="ghost" disabled={rows.length === 0} onClick={() => void copyCsv()}>
          {copied ? <Check aria-hidden="true" /> : <ClipboardCopy aria-hidden="true" />}
          {copied ? "Copied" : "Copy as CSV"}
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-6 text-center text-muted-foreground">Send a message to see its timings here.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-max text-left text-xs tabular-nums">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                {["#", "Kind", "HTTP", "TTFB ms", "1st delta ms", "Total ms", "Deltas", "Chunks", "Max ev/chunk", "Max gap ms", "Heartbeats", "State", "Closed", "Error", "Request id", "Flags"].map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => {
                const m = row.metrics;
                const flags = rowFlags(m);
                return (
                  <tr key={row.n}>
                    <td className="px-3 py-2">{row.n}</td>
                    <td className="px-3 py-2">{row.kind}</td>
                    <td className="px-3 py-2">{m.httpStatus === 0 ? "net" : m.httpStatus}</td>
                    <td className="px-3 py-2">{num(m.ttfbMs)}</td>
                    <td className="px-3 py-2">{num(m.firstDeltaMs)}</td>
                    <td className="px-3 py-2">{num(m.totalMs)}</td>
                    <td className="px-3 py-2">{m.deltas}</td>
                    <td className="px-3 py-2">{m.chunks}</td>
                    <td className="px-3 py-2">{m.maxEventsPerChunk}</td>
                    <td className="px-3 py-2">{m.maxGapMs}</td>
                    <td className="px-3 py-2">{m.heartbeats}</td>
                    <td className="px-3 py-2">{text(m.doneState)}</td>
                    <td className="px-3 py-2">{m.conversationClosed === null ? dash : m.conversationClosed ? "yes" : "no"}</td>
                    <td className="px-3 py-2">{row.outcome === "aborted" ? "aborted" : text(m.errorCode)}</td>
                    <td className="max-w-40 truncate px-3 py-2 font-mono" title={m.requestId ?? undefined}>
                      {text(m.requestId)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex gap-1">
                        {flags.map((flag) => (
                          <Badge key={flag.label} tone="warning" title={flag.hint}>
                            {flag.label}
                          </Badge>
                        ))}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Chunk and gap flags can be checked against the browser&apos;s Network tab. Message text is never recorded here.
      </p>
    </div>
  );
}
